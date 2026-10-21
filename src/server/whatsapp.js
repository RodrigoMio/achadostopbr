import { EventEmitter } from 'events';
import fs from 'fs/promises';
import makeWASocket, {
  DisconnectReason,
  fetchLatestBaileysVersion,
  useMultiFileAuthState,
} from '@whiskeysockets/baileys';
import { Boom } from '@hapi/boom';
import QRCode from 'qrcode';
import qrcodeTerminal from 'qrcode-terminal';
import pino from 'pino';
import { config, isPublicOnly, isSupabaseConfigured } from '../lib/config.js';
import { normalizeWhatsAppJid } from '../lib/jid.js';
import { findActiveUserByJid } from '../lib/users.js';

const BACKOFF_MS = [2000, 5000, 10000, 30000];
const AUTH_CLEAR_COOLDOWN_MS = 60_000;

function createWhatsAppRuntime() {
  const bus = new EventEmitter();
  bus.setMaxListeners(100);

  /** @type {import('@whiskeysockets/baileys').WASocket | null} */
  let sock = null;
  let connectionReady = false;
  /** @type {Promise<void> | null} */
  let connectionPromise = null;
  let isReplacingSocket = false;
  let isConnecting = false;
  let backoffStep = 0;
  let lastAuthClearAt = 0;
  let currentQr = null;
  let currentQrDataUrl = null;
  let currentJid = null;
  let authorizedUser = null;
  let authError = null;
  let rejectingUnauthorized = false;

  function emitState() {
    bus.emit('state', getPublicState());
  }

  function getPublicState() {
    return {
      connected: connectionReady && sock !== null,
      connecting: isConnecting && !connectionReady,
      hasSocket: sock !== null,
      qr: currentQrDataUrl,
      jid: currentJid,
      authorized: Boolean(authorizedUser),
      error: authError,
      user: authorizedUser
        ? {
            id_users: authorizedUser.id_users,
            name: authorizedUser.name,
            slug: authorizedUser.slug,
          }
        : null,
    };
  }

  function setReady(value) {
    connectionReady = value;
  }

  function getDisconnectLabel(code) {
    if (code == null) return 'desconhecido';
    const name = DisconnectReason[code];
    return typeof name === 'string' ? name : 'desconhecido';
  }

  function resetBackoff() {
    backoffStep = 0;
  }

  function getBackoffDelay() {
    const delay = BACKOFF_MS[Math.min(backoffStep, BACKOFF_MS.length - 1)];
    backoffStep = Math.min(backoffStep + 1, BACKOFF_MS.length - 1);
    return delay;
  }

  function isInfrastructureError(message) {
    if (!message) return false;
    const normalized = message.toLowerCase();
    return (
      normalized.includes('unable to verify the first certificate') ||
      normalized.includes('certificate') ||
      normalized.includes('econnreset') ||
      normalized.includes('enotfound') ||
      normalized.includes('etimedout') ||
      normalized.includes('socket hang up')
    );
  }

  function clearQr() {
    currentQr = null;
    currentQrDataUrl = null;
  }

  async function setQr(qr) {
    currentQr = qr;
    try {
      currentQrDataUrl = await QRCode.toDataURL(qr, {
        margin: 1,
        width: 320,
        color: { dark: '#0f172a', light: '#ffffff' },
      });
    } catch (err) {
      console.warn('[WhatsApp] Falha ao gerar QR em imagem:', err?.message ?? err);
      currentQrDataUrl = null;
    }
    emitState();
  }

  async function waitBackoffAndReconnect() {
    const delayMs = getBackoffDelay();
    console.log(`Reconectando em ${delayMs / 1000}s...`);
    await new Promise((resolve) => setTimeout(resolve, delayMs));
    await connectWhatsApp();
  }

  async function clearAuthState() {
    await fs.rm(config.authPath, { recursive: true, force: true });
    console.log(
      `Pasta de sessão "${config.authPath}" removida. Nova autenticação será necessária.`,
    );
  }

  async function destroySocket() {
    if (!sock) return;

    isReplacingSocket = true;
    try {
      await sock.end(undefined);
    } catch (err) {
      console.warn('[WhatsApp] Erro ao encerrar socket:', err?.message ?? err);
    } finally {
      sock = null;
      isReplacingSocket = false;
    }
  }

  function usesBackoff(statusCode) {
    return (
      statusCode === DisconnectReason.connectionClosed ||
      statusCode === DisconnectReason.connectionLost ||
      statusCode === DisconnectReason.timedOut ||
      statusCode === DisconnectReason.unavailableService
    );
  }

  async function handleDisconnect(statusCode, errorMessage) {
    const label = getDisconnectLabel(statusCode);

    console.log(
      `Conexão encerrada: ${label} (${statusCode ?? '?'})${errorMessage ? ` — ${errorMessage}` : ''}`,
    );

    await destroySocket();
    connectionPromise = null;
    setReady(false);
    currentJid = null;
    authorizedUser = null;
    clearQr();
    emitState();

    if (rejectingUnauthorized) {
      rejectingUnauthorized = false;
      isConnecting = true;
      emitState();
      await new Promise((resolve) => setTimeout(resolve, 1200));
      await connectWhatsApp();
      return;
    }

    if (statusCode === DisconnectReason.loggedOut) {
      isConnecting = false;
      await clearAuthState();
      authError = authError || 'Sessão encerrada. Escaneie o QR Code novamente.';
      emitState();
      isConnecting = true;
      await connectWhatsApp();
      return;
    }

    if (statusCode === DisconnectReason.connectionReplaced) {
      isConnecting = false;
      authError = 'Outra sessão WhatsApp Web está ativa nesta conta.';
      emitState();
      console.log(
        'Outra sessão WhatsApp Web está ativa nesta conta. Reconexão automática desativada.',
      );
      return;
    }

    if (statusCode === DisconnectReason.badSession) {
      if (isInfrastructureError(errorMessage)) {
        console.log(
          '[WhatsApp] Falha de rede ou certificado SSL ao conectar (não é sessão inválida).',
        );
        await waitBackoffAndReconnect();
        return;
      }

      const now = Date.now();
      if (now - lastAuthClearAt >= AUTH_CLEAR_COOLDOWN_MS) {
        lastAuthClearAt = now;
        await clearAuthState();
        resetBackoff();
        console.log('Sessão inválida. Aguarde o QR Code...');
        await new Promise((resolve) => setTimeout(resolve, 2000));
        await connectWhatsApp();
        return;
      }

      await waitBackoffAndReconnect();
      return;
    }

    if (statusCode === DisconnectReason.restartRequired) {
      resetBackoff();
      console.log('Reinício exigido pelo WhatsApp. Reconectando...');
      await connectWhatsApp();
      return;
    }

    if (usesBackoff(statusCode)) {
      await waitBackoffAndReconnect();
      return;
    }

    await waitBackoffAndReconnect();
  }

  async function authorizeConnectedUser() {
    const rawId = sock?.user?.id || '';
    currentJid = normalizeWhatsAppJid(rawId);
    clearQr();

    if (!currentJid) {
      authError = 'Não foi possível ler o número conectado.';
      authorizedUser = null;
      emitState();
      await rejectUnauthorized();
      return;
    }

    if (!isSupabaseConfigured()) {
      authError = 'Supabase não configurado. Defina SUPABASE_URL e SUPABASE_SERVICE_ROLE_KEY.';
      authorizedUser = null;
      emitState();
      return;
    }

    try {
      const user = await findActiveUserByJid(currentJid);
      if (!user) {
        authError = 'Número não habilitado';
        authorizedUser = null;
        emitState();
        console.log(`[WhatsApp] JID ${currentJid} não habilitado.`);
        await rejectUnauthorized();
        return;
      }

      authorizedUser = user;
      authError = null;
      emitState();
      console.log(`[WhatsApp] Autorizado: ${user.name} (${currentJid})`);
    } catch (err) {
      console.error('[WhatsApp] Falha ao validar utilizador:', err);
      authError = 'Falha ao validar o número no banco.';
      authorizedUser = null;
      emitState();
    }
  }

  async function rejectUnauthorized() {
    rejectingUnauthorized = true;
    try {
      if (sock) {
        await sock.logout();
      }
    } catch (err) {
      console.warn('[WhatsApp] logout:', err?.message ?? err);
      rejectingUnauthorized = false;
      await destroySocket();
      await clearAuthState();
      connectionPromise = null;
      setReady(false);
      currentJid = null;
      authorizedUser = null;
      isConnecting = true;
      emitState();
      await new Promise((resolve) => setTimeout(resolve, 1200));
      await connectWhatsApp();
    }
  }

  async function startSocket() {
    const { version } = await fetchLatestBaileysVersion();
    const { state, saveCreds } = await useMultiFileAuthState(config.authPath);

    sock = makeWASocket({
      auth: state,
      version,
      logger: pino({ level: 'silent' }),
    });

    sock.ev.on('creds.update', saveCreds);

    sock.ev.on('connection.update', async (update) => {
      const { connection, lastDisconnect, qr } = update;

      if (qr) {
        authError = authError === 'Número não habilitado' ? authError : null;
        console.log('\nEscaneie o QR Code com o WhatsApp:\n');
        qrcodeTerminal.generate(qr, { small: true });
        await setQr(qr);
      }

      if (connection === 'open') {
        resetBackoff();
        isConnecting = false;
        setReady(true);
        console.log('WhatsApp conectado com sucesso.');
        await authorizeConnectedUser();
        return;
      }

      if (connection === 'close') {
        if (isReplacingSocket) return;

        setReady(false);
        isConnecting = true;
        const statusCode = new Boom(lastDisconnect?.error)?.output?.statusCode;
        const errorMessage = lastDisconnect?.error?.message;

        try {
          await handleDisconnect(statusCode, errorMessage);
        } catch (err) {
          console.error('[WhatsApp] Falha ao reconectar:', err);
          connectionPromise = null;
          isConnecting = false;
          emitState();
        }
      }
    });
  }

  function connectWhatsApp() {
    if (!connectionPromise) {
      isConnecting = true;
      emitState();
      connectionPromise = startSocket().catch((err) => {
        connectionPromise = null;
        isConnecting = false;
        emitState();
        throw err;
      });
    }
    return connectionPromise;
  }

  async function logoutSession() {
    authError = null;
    authorizedUser = null;
    currentJid = null;
    try {
      if (sock) {
        await sock.logout();
      } else {
        await destroySocket();
        await clearAuthState();
        connectionPromise = null;
        await connectWhatsApp();
      }
    } catch (err) {
      console.warn('[WhatsApp] Falha no logout:', err?.message ?? err);
      await destroySocket();
      await clearAuthState();
      connectionPromise = null;
      await connectWhatsApp();
    }
  }

  function subscribe(listener) {
    bus.on('state', listener);
    return () => bus.off('state', listener);
  }

  const runtimeApi = {
    connectWhatsApp,
    getPublicState,
    subscribe,
    logoutSession,
    _getCtx: () => ({
      sock,
      connectionReady,
      authorizedUser,
      isConnecting,
    }),
  };

  installMessagingApi(runtimeApi);
  return runtimeApi;
}

function requireReadyContext(getCtx) {
  const ctx = getCtx();
  if (!ctx.connectionReady || !ctx.sock) {
    const err = new Error(
      ctx.isConnecting
        ? 'WhatsApp reconectando. Tente novamente em alguns segundos.'
        : 'WhatsApp não está conectado.',
    );
    err.status = 503;
    throw err;
  }
  if (!ctx.authorizedUser) {
    const err = new Error('WhatsApp não autorizado.');
    err.status = 403;
    throw err;
  }
  return ctx;
}

function installMessagingApi(runtime) {
  const getCtx = runtime._getCtx;
  if (typeof getCtx !== 'function') return;

  runtime.listParticipatingGroups = async function listParticipatingGroups() {
    const { sock } = requireReadyContext(getCtx);
    const participating = await sock.groupFetchAllParticipating();
    return Object.values(participating || {}).map((group) => ({
      jid: group.id,
      name: group.subject || '',
      memberCount: Array.isArray(group.participants)
        ? group.participants.length
        : Number(group.size) || 0,
    }));
  };

  runtime.fetchGroupInviteCode = async function fetchGroupInviteCode(jid) {
    const { sock } = requireReadyContext(getCtx);
    const code = await sock.groupInviteCode(jid);
    return typeof code === 'string' ? code.trim() : '';
  };

  runtime.sendImageMessage = async function sendImageMessage(jid, imageUrl, caption) {
    const { sock } = requireReadyContext(getCtx);
    return sock.sendMessage(jid, {
      image: { url: imageUrl },
      caption,
    });
  };
}

const runtime = globalThis.__afiliadosWhatsApp ?? createWhatsAppRuntime();
if (typeof runtime._getCtx === 'function') {
  installMessagingApi(runtime);
}
globalThis.__afiliadosWhatsApp = runtime;

export async function connectWhatsApp() {
  if (isPublicOnly()) {
    const err = new Error('WhatsApp desligado (PUBLIC_ONLY).');
    err.status = 503;
    throw err;
  }
  return runtime.connectWhatsApp();
}
export const getPublicState = runtime.getPublicState;
export const subscribeWhatsApp = runtime.subscribe;
export const logoutSession = runtime.logoutSession;

export async function listParticipatingGroups() {
  if (typeof runtime.listParticipatingGroups !== 'function') {
    const err = new Error('Reinicie o servidor para habilitar o envio WhatsApp.');
    err.status = 503;
    throw err;
  }
  return runtime.listParticipatingGroups();
}

export async function fetchGroupInviteCode(jid) {
  if (typeof runtime.fetchGroupInviteCode !== 'function') {
    const err = new Error('Reinicie o servidor para habilitar o envio WhatsApp.');
    err.status = 503;
    throw err;
  }
  return runtime.fetchGroupInviteCode(jid);
}

export async function sendImageMessage(jid, imageUrl, caption) {
  if (typeof runtime.sendImageMessage !== 'function') {
    const err = new Error('Reinicie o servidor para habilitar o envio WhatsApp.');
    err.status = 503;
    throw err;
  }
  return runtime.sendImageMessage(jid, imageUrl, caption);
}

export function assertWhatsAppForUser(idUsers) {
  const state = getPublicState();
  if (!state.connected) {
    const err = new Error(
      state.connecting
        ? 'WhatsApp reconectando. Tente novamente em alguns segundos.'
        : 'WhatsApp não está conectado.',
    );
    err.status = 503;
    throw err;
  }
  if (!state.authorized || Number(state.user?.id_users) !== Number(idUsers)) {
    const err = new Error(state.error || 'WhatsApp não autorizado para este utilizador.');
    err.status = 403;
    throw err;
  }
  return state.user;
}
