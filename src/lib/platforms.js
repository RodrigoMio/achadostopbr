/** @typedef {'mercadolivre' | 'shopee' | 'amazon' | 'magalu'} PlatformId */

export const PLATFORMS = [
  {
    id: 'mercadolivre',
    name: 'Mercado Livre',
    short: 'ML',
    bg: '#FFE600',
    fg: '#2D3277',
    icon: 'https://www.mercadolivre.com.br/favicon.ico',
    match: ['mercado livre', 'mercadolivre', 'ml'],
  },
  {
    id: 'shopee',
    name: 'Shopee',
    short: 'S',
    bg: '#EE4D2D',
    fg: '#FFFFFF',
    icon: 'https://shopee.com.br/favicon.ico',
    match: ['shopee'],
  },
  {
    id: 'amazon',
    name: 'Amazon',
    short: 'a',
    bg: '#FF9900',
    fg: '#111111',
    icon: 'https://www.amazon.com.br/favicon.ico',
    match: ['amazon'],
  },
  {
    id: 'magalu',
    name: 'Magalu',
    short: 'M',
    bg: '#0086FF',
    fg: '#FFFFFF',
    icon: 'https://www.magazineluiza.com.br/favicon.ico',
    match: ['magalu', 'magazine luiza', 'magazine luíza'],
  },
];

function normalizeLabel(label) {
  return String(label || '')
    .trim()
    .toLowerCase()
    .normalize('NFD')
    .replace(/\p{M}/gu, '');
}

/**
 * @param {string | null | undefined} label
 * @returns {(typeof PLATFORMS)[number] | null}
 */
export function resolvePlatformStyle(label) {
  const normalized = normalizeLabel(label);
  if (!normalized) return null;
  return (
    PLATFORMS.find((p) => p.match.some((m) => normalized.includes(m) || m.includes(normalized))) ??
    null
  );
}

/**
 * @param {{ label?: string | null; url_icon?: string | null } | null | undefined} platformRow
 */
export function getPlatformPresentation(platformRow) {
  const style = resolvePlatformStyle(platformRow?.label);
  const name = style?.name ?? platformRow?.label ?? 'Loja';
  const icon = platformRow?.url_icon?.trim() || style?.icon || null;
  return {
    name,
    bg: style?.bg ?? '#1e1b4b',
    fg: style?.fg ?? '#ffffff',
    icon,
  };
}
