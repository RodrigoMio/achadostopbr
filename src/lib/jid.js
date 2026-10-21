export function normalizeWhatsAppJid(id) {
  if (!id || typeof id !== 'string') return '';
  const trimmed = id.trim();
  const [userPart, serverPart] = trimmed.split('@');
  const number = (userPart || '').split(':')[0].replace(/\D/g, '');
  if (!number) return '';
  const server = serverPart || 's.whatsapp.net';
  if (server.includes('g.us') || server.includes('lid')) {
    return `${(userPart || '').split(':')[0]}@${server}`;
  }
  return `${number}@${server}`;
}

export function jidLookupCandidates(id) {
  const normalized = normalizeWhatsAppJid(id);
  const candidates = new Set();

  if (!normalized) return [];

  const [user, server] = normalized.split('@');
  candidates.add(normalized);
  candidates.add(user);

  if (server && server !== 's.whatsapp.net') {
    const digits = user.replace(/\D/g, '');
    if (digits) {
      candidates.add(`${digits}@s.whatsapp.net`);
      candidates.add(digits);
    }
  }

  const digits = user.replace(/\D/g, '');
  if (digits.startsWith('55') && digits.length === 12) {
    const withNine = `55${digits.slice(2, 4)}9${digits.slice(4)}`;
    candidates.add(withNine);
    candidates.add(`${withNine}@s.whatsapp.net`);
  }
  if (digits.startsWith('55') && digits.length === 13) {
    const withoutNine = `55${digits.slice(2, 4)}${digits.slice(5)}`;
    candidates.add(withoutNine);
    candidates.add(`${withoutNine}@s.whatsapp.net`);
  }

  return [...candidates];
}
