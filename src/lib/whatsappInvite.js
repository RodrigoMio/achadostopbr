import { asTrimmedString } from './validation.js';

export function buildWhatsAppGroupInviteUrl(inviteCode) {
  const code = asTrimmedString(inviteCode);
  if (!code) return null;
  return `https://chat.whatsapp.com/${code}`;
}
