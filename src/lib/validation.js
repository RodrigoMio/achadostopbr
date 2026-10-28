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
