export function isHttpUrl(value) {
  if (typeof value !== 'string' || !value.trim()) {
    return false;
  }
  try {
    const url = new URL(value.trim());
    return url.protocol === 'http:' || url.protocol === 'https:';
  } catch {
    return false;
  }
}

function nonEmptyString(value, fieldName) {
  if (typeof value !== 'string' || !value.trim()) {
    return {
      ok: false,
      error: `Campo "${fieldName}" é obrigatório e deve ser uma string não vazia.`,
    };
  }
  return { ok: true, value: value.trim() };
}

/**
 * @param {unknown} body
 * @returns {{ ok: true, mode: 'text', groupId: string, message: string } | { ok: true, mode: 'affiliate', groupId: string, message: string, link: string, imageUrl: string, caption: string } | { ok: false, error: string }}
 */
export function validateSendPayload(body) {
  const payload = body ?? {};

  const groupIdResult = nonEmptyString(payload.groupId, 'groupId');
  if (!groupIdResult.ok) return groupIdResult;

  const messageResult = nonEmptyString(payload.message, 'message');
  if (!messageResult.ok) return messageResult;

  const hasLink =
    payload.link !== undefined &&
    payload.link !== null &&
    String(payload.link).trim() !== '';
  const hasImageUrl =
    payload.imageUrl !== undefined &&
    payload.imageUrl !== null &&
    String(payload.imageUrl).trim() !== '';

  if (!hasLink && !hasImageUrl) {
    return {
      ok: true,
      mode: 'text',
      groupId: groupIdResult.value,
      message: messageResult.value,
    };
  }

  if (hasLink !== hasImageUrl) {
    return {
      ok: false,
      error:
        'Para envio com imagem, os campos "link" e "imageUrl" são obrigatórios juntos.',
    };
  }

  const link = String(payload.link).trim();
  const imageUrl = String(payload.imageUrl).trim();

  if (!isHttpUrl(link)) {
    return {
      ok: false,
      error: 'Campo "link" deve ser uma URL válida (http ou https).',
    };
  }

  if (!isHttpUrl(imageUrl)) {
    return {
      ok: false,
      error: 'Campo "imageUrl" deve ser uma URL válida (http ou https).',
    };
  }

  const caption = `${messageResult.value}\n\n${link}`;

  return {
    ok: true,
    mode: 'affiliate',
    groupId: groupIdResult.value,
    message: messageResult.value,
    link,
    imageUrl,
    caption,
  };
}
