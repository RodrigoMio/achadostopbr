
function trimOrigin(value) {
  return String(value || '').trim().replace(/\/+$/, '');
}

function isLocalHostHost(host) {
  return /localhost|127\.0\.0\.1/i.test(String(host || ''));
}

/**
 * Origem HTTPS pública inferida do pedido (Render/proxy envia x-forwarded-*).
 * Devolve string vazia se o host for localhost ou o protocolo não for https.
 */
export function getPublicOriginFromRequest(request) {
  if (!request?.headers) return '';

  const forwardedHost = request.headers.get('x-forwarded-host');
  const host = (forwardedHost || request.headers.get('host') || '').split(',')[0].trim();
  if (!host || isLocalHostHost(host)) return '';

  const forwardedProto = request.headers.get('x-forwarded-proto');
  const proto = (forwardedProto || 'https').split(',')[0].trim().toLowerCase();
  if (proto !== 'https') return '';

  return trimOrigin(`https://${host}`);
}

export function missingPublicAppUrlMessage(requestOriginHint = '') {
  const hint = trimOrigin(requestOriginHint);
  if (hint && isLocalHostHost(hint.replace(/^https?:\/\//, ''))) {
    return (
      'Ao publicar pelo localhost, adicione PUBLIC_APP_URL=https://www.achadostopbr.com.br no .env local ' +
      '(domínio HTTPS onde a app está deployada, com a rota /api/instagram/publish-image) e reinicie o npm run dev. ' +
      'Alternativa: publique em /products no site em produção.'
    );
  }
  return (
    'Defina PUBLIC_APP_URL no Render (HTTPS público) ou publique a partir do site em produção ' +
    '(headers x-forwarded-proto/host). A Meta precisa descarregar a imagem desse servidor.'
  );
}

