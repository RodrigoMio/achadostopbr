import express from 'express';
import { config } from './config.js';
import { connectWhatsApp, getWhatsAppStatus } from './whatsapp/client.js';
import sendMessageRouter from './routes/sendMessage.js';
import { errorHandler, notFoundHandler } from './middleware/errorHandler.js';

const app = express();

app.use(express.json({ limit: '1mb' }));

app.get('/health', (_req, res) => {
  res.json({
    status: 'ok',
    whatsapp: getWhatsAppStatus(),
  });
});

app.use(sendMessageRouter);

app.use(notFoundHandler);
app.use(errorHandler);

async function bootstrap() {
  try {
    await connectWhatsApp();

    app.listen(config.port, () => {
      console.log(`Servidor HTTP ouvindo em http://localhost:${config.port}`);
    });
  } catch (err) {
    console.error('Falha ao iniciar a aplicação:', err);
    process.exit(1);
  }
}

bootstrap();
