import { Router } from 'express';
import {
  getWhatsAppSocket,
  isWhatsAppReady,
  normalizeGroupJid,
} from '../whatsapp/client.js';

const router = Router();

router.post('/send-message', async (req, res, next) => {
  try {
    const { groupId, message } = req.body ?? {};

    if (!groupId || typeof groupId !== 'string') {
      return res.status(400).json({
        error: 'Campo "groupId" é obrigatório e deve ser uma string.',
      });
    }

    if (!message || typeof message !== 'string') {
      return res.status(400).json({
        error: 'Campo "message" é obrigatório e deve ser uma string.',
      });
    }

    if (!isWhatsAppReady()) {
      return res.status(503).json({
        error:
          'WhatsApp não está conectado. Aguarde a autenticação ou verifique o QR Code no terminal.',
      });
    }

    const jid = normalizeGroupJid(groupId);
    const sock = getWhatsAppSocket();
    const result = await sock.sendMessage(jid, { text: message });

    return res.status(200).json({
      success: true,
      groupId: jid,
      messageId: result?.key?.id ?? null,
    });
  } catch (err) {
    next(err);
  }
});

export default router;
