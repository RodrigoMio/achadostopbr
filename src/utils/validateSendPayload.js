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

/** Monta legenda: texto + link uma vez (evita duplicar se a IA já incluiu o link). */
export function buildAffiliateCaption(message, link) {
  const normalizedLink = link.trim();
  let text = message.trim();

  if (!text) {
    return normalizedLink;
  }

  const lines = text.split('\n');
  while (lines.length > 0 && lines[lines.length - 1].trim() === normalizedLink) {
    lines.pop();
  }
  text = lines.join('\n').trim();

  while (text.endsWith(normalizedLink)) {
    text = text.slice(0, -normalizedLink.length).trimEnd();
  }

  if (!text) {
    return normalizedLink;
  }

  if (text.includes(normalizedLink)) {
    return text;
  }

  return `${text}\n\n${normalizedLink}`;
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

  const caption = buildAffiliateCaption(messageResult.value, link);

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
