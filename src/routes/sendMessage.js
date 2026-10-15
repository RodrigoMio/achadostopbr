import { Router } from 'express';
import {
  getWhatsAppSocket,
  isWhatsAppReady,
  normalizeGroupJid,
} from '../whatsapp/client.js';
import { validateSendPayload } from '../utils/validateSendPayload.js';

const router = Router();

router.post('/send-message', async (req, res, next) => {
  try {
    const validated = validateSendPayload(req.body);

    if (!validated.ok) {
      return res.status(400).json({ error: validated.error });
    }

    if (!isWhatsAppReady()) {
      return res.status(503).json({
        error:
          'WhatsApp não está conectado. Aguarde a autenticação ou verifique o QR Code no terminal.',
      });
    }

    const jid = normalizeGroupJid(validated.groupId);
    const sock = getWhatsAppSocket();

    let result;
    if (validated.mode === 'affiliate') {
      result = await sock.sendMessage(jid, {
        image: { url: validated.imageUrl },
        caption: validated.caption,
      });
    } else {
      result = await sock.sendMessage(jid, { text: validated.message });
    }

    return res.status(200).json({
      success: true,
      mode: validated.mode,
      groupId: jid,
      messageId: result?.key?.id ?? null,
    });
  } catch (err) {
    next(err);
  }
});

export default router;
