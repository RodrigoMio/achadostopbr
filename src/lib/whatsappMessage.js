import { buildAffiliateCaption } from '../utils/validateSendPayload.js';

export function filterGroupsByPrefix(groups, prefix) {
  const needle = typeof prefix === 'string' ? prefix.trim().toLowerCase() : '';
  if (!needle) return [];
  return (groups ?? []).filter((group) =>
    String(group?.name || '')
      .trim()
      .toLowerCase()
      .startsWith(needle),
  );
}

export function formatProductPrice(value) {
  const amount = Number(value) || 0;
  if (amount <= 0) return '';
  return amount.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
}

export function buildBuyDirectLine(product) {
  const platform = product?.platform?.label?.trim() || '';
  return platform ? `Compre direto em ${platform}` : 'Compre direto em';
}

export function buildProductWhatsAppCaption(product) {
  const parts = [];
  const title = product?.title?.trim();
  if (title) {
    parts.push(`*${title}*`);
  }

  const description = product?.ia_description?.trim();
  if (description) {
    parts.push(description);
  }

  const price = formatProductPrice(product?.price);
  if (price) {
    parts.push(price);
  }

  parts.push(buildBuyDirectLine(product));

  const message = parts.join('\n\n');
  const link = String(product?.affiliated_link || '').trim();
  if (!link) {
    return message;
  }
  return buildAffiliateCaption(message, link);
}
