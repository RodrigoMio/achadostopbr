import fs from 'fs/promises';
import makeWASocket, {
  DisconnectReason,
  fetchLatestBaileysVersion,
  useMultiFileAuthState,
} from '@whiskeysockets/baileys';
import { Boom } from '@hapi/boom';
import qrcode from 'qrcode-terminal';
import pino from 'pino';
import { config } from '../config.js';

/** @type {import('@whiskeysockets/baileys').WASocket | null} */
let sock = null;
let connectionReady = false;
/** @type {Promise<void> | null} */
let connectionPromise = null;
let isReplacingSocket = false;
let backoffStep = 0;
let lastAuthClearAt = 0;

const BACKOFF_MS = [2000, 5000, 10000, 30000];
const AUTH_CLEAR_COOLDOWN_MS = 60_000;

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

/** Erros de rede/SSL costumam vir com status badSession (500) sem ser sessão corrompida. */
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

async function waitBackoffAndReconnect() {
  const delayMs = getBackoffDelay();
  console.log(`Reconectando em ${delayMs / 1000}s...`);
  await new Promise((resolve) => setTimeout(resolve, delayMs));
  await connectWhatsApp();
}

export function isWhatsAppReady() {
  return connectionReady && sock !== null;
}

export function getWhatsAppSocket() {
  if (!isWhatsAppReady()) {
    throw new Error('WhatsApp não está conectado');
  }
  return sock;
}

export function normalizeGroupJid(groupId) {
  const trimmed = groupId.trim();
  if (trimmed.includes('@')) {
    return trimmed;
  }
  return `${trimmed}@g.us`;
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

  if (statusCode === DisconnectReason.loggedOut) {
    await clearAuthState();
    console.log('Sessão encerrada no WhatsApp. Reinicie o servidor e escaneie um novo QR Code.');
    return;
  }

  if (statusCode === DisconnectReason.connectionReplaced) {
    console.log(
      'Outra sessão WhatsApp Web está ativa nesta conta. Reconexão automática desativada.',
    );
    return;
  }

  if (statusCode === DisconnectReason.badSession) {
    if (isInfrastructureError(errorMessage)) {
      console.log(
        '[WhatsApp] Falha de rede ou certificado SSL ao conectar (não é sessão inválida). ' +
          'Verifique proxy, antivírus ou certificados do sistema.',
      );
      await waitBackoffAndReconnect();
      return;
    }

    const now = Date.now();
    if (now - lastAuthClearAt >= AUTH_CLEAR_COOLDOWN_MS) {
      lastAuthClearAt = now;
      await clearAuthState();
      resetBackoff();
      console.log('Sessão inválida. Aguarde o QR Code no terminal...');
      await new Promise((resolve) => setTimeout(resolve, 2000));
      await connectWhatsApp();
      return;
    }

    console.log(
      'Sessão ainda instável após limpeza recente. Aguardando antes de tentar novamente...',
    );
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
      console.log('\nEscaneie o QR Code abaixo com o WhatsApp:\n');
      qrcode.generate(qr, { small: true });
    }

    if (connection === 'open') {
      resetBackoff();
      setReady(true);
      console.log('WhatsApp conectado com sucesso.');
      return;
    }

    if (connection === 'close') {
      if (isReplacingSocket) return;

      setReady(false);
      const statusCode = new Boom(lastDisconnect?.error)?.output?.statusCode;
      const errorMessage = lastDisconnect?.error?.message;

      try {
        await handleDisconnect(statusCode, errorMessage);
      } catch (err) {
        console.error('[WhatsApp] Falha ao reconectar:', err);
        connectionPromise = null;
      }
    }
  });
}

export function connectWhatsApp() {
  if (!connectionPromise) {
    connectionPromise = startSocket().catch((err) => {
      connectionPromise = null;
      throw err;
    });
  }
  return connectionPromise;
}
