import { createHmac } from 'node:crypto';
import { config } from './config.js';
import { missingPublicAppUrlMessage } from './publicOrigin.js';
import { isHttpsUrl, normalizeProductImageLink } from './validation.js';

const META_UA =
  'facebookexternalhit/1.1 (+http://www.facebook.com/externalhit_uatext.php)';
const FETCH_UA =
  'Mozilla/5.0 (compatible; AfiliadosInstagram/1.0; +https://achadostopbr.com.br)';

const MAX_BYTES = 8 * 1024 * 1024;

export function publishImageSignature(product) {
  const secret = config.sessionSecret || 'instagram-publish-image';
  const payload = `${product.id_product}|${product.image_link}|${product.updated_at || ''}`;
  return createHmac('sha256', secret).update(payload).digest('hex').slice(0, 24);
}

export function verifyPublishImageSignature(product, sig) {
  if (!sig || typeof sig !== 'string') return false;
  const expected = publishImageSignature(product);
  return sig.length === expected.length && sig === expected;
}

function normalizePublicBaseUrl(candidate, requestOriginHint = '') {
  const base = String(candidate || '').trim().replace(/\/+$/, '');
  if (!base) {
    const err = new Error(missingPublicAppUrlMessage(requestOriginHint));
    err.status = 400;
    throw err;
  }
  if (!base.startsWith('https://')) {
    const err = new Error('PUBLIC_APP_URL deve começar com https://');
    err.status = 400;
    throw err;
  }
  if (/localhost|127\.0\.0\.1/i.test(base)) {
    const err = new Error(
      'PUBLIC_APP_URL não pode ser localhost. Use o domínio público onde a app está deployada (ex.: https://www.achadostopbr.com.br).',
    );
    err.status = 400;
    throw err;
  }
  return base;
}

/** Prioridade: origem do request (produção) → PUBLIC_APP_URL no env. */
export function resolvePublicAppBaseUrl(requestOrigin = '', requestOriginHint = '') {
  const fromRequest = String(requestOrigin || '').trim();
  const fromEnv = config.publicAppUrl;
  const base = fromRequest || fromEnv || '';
  return normalizePublicBaseUrl(base, requestOriginHint || fromRequest);
}

export function buildInstagramProxyImageUrl(product, publicBaseUrl) {
  const sig = publishImageSignature(product);
  return `${publicBaseUrl.replace(/\/+$/, '')}/api/instagram/publish-image/${product.id_product}?sig=${sig}`;
}

function sniffContentType(buffer) {
  if (buffer.length >= 3 && buffer[0] === 0xff && buffer[1] === 0xd8 && buffer[2] === 0xff) {
    return 'image/jpeg';
  }
  if (
    buffer.length >= 8 &&
    buffer[0] === 0x89 &&
    buffer[1] === 0x50 &&
    buffer[2] === 0x4e &&
    buffer[3] === 0x47
  ) {
    return 'image/png';
  }
  if (
    buffer.length >= 12 &&
    buffer.toString('ascii', 0, 4) === 'RIFF' &&
    buffer.toString('ascii', 8, 12) === 'WEBP'
  ) {
    return 'image/webp';
  }
  return '';
}

function normalizeContentType(headerValue, buffer) {
  const header = String(headerValue || '').split(';')[0].trim().toLowerCase();
  if (header.startsWith('image/')) return header;
  return sniffContentType(buffer) || 'application/octet-stream';
}

export async function downloadProductImage(imageUrl) {
  const url = normalizeProductImageLink(imageUrl);
  if (!isHttpsUrl(url)) {
    const err = new Error('URL da imagem do produto deve ser HTTPS.');
    err.status = 400;
    throw err;
  }

  let lastError = null;
  for (const userAgent of [META_UA, FETCH_UA]) {
    try {
      const response = await fetch(url, {
        redirect: 'follow',
        headers: {
          Accept: 'image/avif,image/webp,image/apng,image/*,*/*;q=0.8',
          'User-Agent': userAgent,
        },
      });

      if (!response.ok) {
        lastError = new Error(`Origem devolveu HTTP ${response.status}.`);
        continue;
      }

      const buffer = Buffer.from(await response.arrayBuffer());
      if (buffer.length === 0) {
        lastError = new Error('A origem devolveu uma imagem vazia.');
        continue;
      }
      if (buffer.length > MAX_BYTES) {
        const err = new Error('A imagem excede 8 MB (limite do Instagram).');
        err.status = 400;
        throw err;
      }

      const contentType = normalizeContentType(response.headers.get('content-type'), buffer);
      if (!contentType.startsWith('image/')) {
        lastError = new Error(
          'O link da imagem não devolve um ficheiro de imagem (a loja pode bloquear robots).',
        );
        continue;
      }

      if (contentType === 'image/webp') {
        const err = new Error(
          'A imagem está em WebP. Use um link JPG ou PNG na ficha do produto, ou troque a imagem.',
        );
        err.status = 400;
        throw err;
      }

      return { buffer, contentType };
    } catch (err) {
      lastError = err;
      if (err.status === 400) throw err;
    }
  }

  const err = new Error(
    lastError?.message ||
      'Não foi possível obter a imagem do produto. Verifique o link ou use uma URL de imagem direta (JPG/PNG).',
  );
  err.status = 400;
  throw err;
}

export function mapInstagramMediaFetchError(error) {
  if (error?.graphSubcode === 2207052 || error?.graphCode === 9004) {
    return new Error(
      'A Meta não conseguiu obter a imagem. Confirme PUBLIC_APP_URL (HTTPS público), republique e garanta que /api/instagram/publish-image/… abre a foto no browser.',
    );
  }
  return error;
}
