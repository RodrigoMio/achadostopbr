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

export function isHttpsUrl(value) {
  if (typeof value !== 'string' || !value.trim()) {
    return false;
  }
  try {
    const url = new URL(value.trim());
    return url.protocol === 'https:';
  } catch {
    return false;
  }
}

export function asTrimmedString(value) {
  return typeof value === 'string' ? value.trim() : '';
}

export function asPositiveInt(value) {
  const n = Number(value);
  return Number.isInteger(n) && n > 0 ? n : null;
}

/** Preço opcional: vazio → 0; aceita número ou string mascarada (ex.: R$ 9,99). */
export function parseNonNegativePrice(value) {
  if (value === undefined || value === null || value === '') {
    return { ok: true, value: 0 };
  }
  if (typeof value === 'number') {
    if (!Number.isFinite(value) || value < 0) {
      return { ok: false, error: 'Preço inválido.' };
    }
    return { ok: true, value };
  }
  if (typeof value === 'string') {
    const trimmed = value.trim();
    if (!trimmed) {
      return { ok: true, value: 0 };
    }
    const digits = trimmed.replace(/\D/g, '');
    if (!digits) {
      return { ok: true, value: 0 };
    }
    const amount = Number(digits) / 100;
    if (!Number.isFinite(amount) || amount < 0) {
      return { ok: false, error: 'Preço inválido.' };
    }
    return { ok: true, value: amount };
  }
  return { ok: false, error: 'Preço inválido.' };
}

/** Mercado Livre / mlstatic: .webp no path → .jpg (CDN serve JPEG com o mesmo path). */
export function normalizeProductImageLink(url) {
  const trimmed = asTrimmedString(url);
  if (!trimmed || !/\.webp/i.test(trimmed)) return trimmed;
  try {
    const parsed = new URL(trimmed);
    parsed.pathname = parsed.pathname.replace(/\.webp/gi, '.jpg');
    return parsed.toString();
  } catch {
    return trimmed.replace(/\.webp/gi, '.jpg');
  }
}
