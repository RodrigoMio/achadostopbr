import { createHmac, timingSafeEqual } from 'node:crypto';
import { NextResponse } from 'next/server';
import { config, isInstagramWebhookConfigured } from './config.js';
import { processInstagramWebhookBody } from '../server/instagram.js';

function verifyRequestSignature(rawBody, headerValue, secret) {
  if (!headerValue || !secret) return false;
  const expected = `sha256=${createHmac('sha256', secret).update(rawBody).digest('hex')}`;
  const left = Buffer.from(String(headerValue));
  const right = Buffer.from(expected);
  if (left.length !== right.length) return false;
  return timingSafeEqual(left, right);
}

export async function GET(request) {
  const url = new URL(request.url);
  const mode = url.searchParams.get('hub.mode');
  const token = url.searchParams.get('hub.verify_token');
  const challenge = url.searchParams.get('hub.challenge');

  if (!config.metaWebhookVerifyToken) {
    console.error('[Instagram] META_WEBHOOK_VERIFY_TOKEN não configurado.');
    return NextResponse.json({ error: 'Webhook não configurado' }, { status: 500 });
  }

  if (mode === 'subscribe' && token === config.metaWebhookVerifyToken && challenge) {
    return new NextResponse(challenge, {
      status: 200,
      headers: { 'Content-Type': 'text/plain; charset=utf-8' },
    });
  }

  return NextResponse.json({ error: 'Verificação do webhook recusada' }, { status: 403 });
}

export async function POST(request) {
  const rawBody = await request.text();
  const signature =
    request.headers.get('x-hub-signature-256') || request.headers.get('X-Hub-Signature-256');

  if (!isInstagramWebhookConfigured()) {
    console.error(
      '[Instagram] Webhook POST recusado: META_APP_SECRET ou META_WEBHOOK_VERIFY_TOKEN em falta.',
    );
    return NextResponse.json({ error: 'Webhook não configurado' }, { status: 500 });
  }

  if (!verifyRequestSignature(rawBody, signature, config.metaAppSecret)) {
    return NextResponse.json({ error: 'Assinatura inválida' }, { status: 403 });
  }

  let body;
  try {
    body = rawBody ? JSON.parse(rawBody) : {};
  } catch {
    return NextResponse.json({ error: 'JSON inválido' }, { status: 400 });
  }

  try {
    const results = await processInstagramWebhookBody(body);
    if (results.length === 0 && body?.object) {
      console.log('[Instagram] webhook POST ok, sem eventos comments processados.');
    }
  } catch (err) {
    console.error('[Instagram] webhook', err);
  }

  return NextResponse.json({ ok: true });
}

export const dynamic = 'force-dynamic';
