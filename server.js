import 'dotenv/config';
import { createServer } from 'http';
import { parse } from 'url';
import next from 'next';
import { isPublicOnly } from './src/lib/config.js';

const dev = process.argv.includes('--dev');
if (!dev && !process.env.NODE_ENV) {
  process.env.NODE_ENV = 'production';
}

if (dev && process.env.TLS_INSECURE_DEV === 'true') {
  process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';
  console.warn(
    '[dev] TLS_INSECURE_DEV=true — verificação SSL desativada (antivírus/proxy local). Não use em produção.',
  );
}

const hostname = process.env.HOSTNAME || undefined;
const port = Number(process.env.PORT) || 3000;

const app = next({ dev, hostname: hostname || 'localhost', port });
const handle = app.getRequestHandler();

try {
  await app.prepare();
} catch (err) {
  console.error('Falha ao preparar o Next.js:', err);
  process.exit(1);
}

if (isPublicOnly()) {
  console.log('[WhatsApp] PUBLIC_ONLY=true — Baileys desligado (vitrine pública).');
} else {
  const { connectWhatsApp } = await import('./src/server/whatsapp.js');
  connectWhatsApp().catch((err) => {
    console.error('[WhatsApp] Falha na inicialização:', err);
  });
}

const server = createServer(async (req, res) => {
  try {
    const parsedUrl = parse(req.url, true);
    await handle(req, res, parsedUrl);
  } catch (err) {
    console.error('[HTTP]', err);
    res.statusCode = 500;
    res.end('Erro interno do servidor');
  }
});

function onListen() {
  console.log(`Servidor em http://localhost:${port} (${dev ? 'dev' : 'prod'})`);
}

if (hostname) {
  server.listen(port, hostname, onListen);
} else {
  server.listen(port, onListen);
}
