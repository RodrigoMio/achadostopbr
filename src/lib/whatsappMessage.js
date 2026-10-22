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

function appendCatalogLines(caption, storeUrl) {
  const catalog = typeof storeUrl === 'string' ? storeUrl.trim() : '';
  if (!catalog) {
    return caption;
  }
  const base = caption.trim();
  const suffix = `Catálogo completo em:\n${catalog}`;
  return base ? `${base}\n\n${suffix}` : suffix;
}

export function buildProductWhatsAppCaption(product, storeUrl) {
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
  let caption = link ? buildAffiliateCaption(message, link) : message;
  return appendCatalogLines(caption, storeUrl);
}
