export const INSTAGRAM_CTA = 'Digite QUERO nos comentários para receber o link';
export const INSTAGRAM_CAPTION_MAX = 2200;

export const INSTAGRAM_REQUIRED_PERMISSIONS = [
  'instagram_content_publish',
  'instagram_manage_comments',
  'instagram_manage_messages',
];

const PERMISSION_ALIASES = {
  instagram_content_publish: [
    'instagram_content_publish',
    'instagram_business_content_publish',
  ],
  instagram_manage_comments: [
    'instagram_manage_comments',
    'instagram_business_manage_comments',
  ],
  instagram_manage_messages: [
    'instagram_manage_messages',
    'instagram_business_manage_messages',
  ],
};

export function buildDefaultInstagramCaption(product) {
  const title = product?.title?.trim() || '';
  const description = product?.ia_description?.trim() || '';
  const parts = [];
  if (title) parts.push(title);
  if (description) parts.push(description);
  parts.push(INSTAGRAM_CTA);
  return parts.join('\n\n');
}

export function buildInstagramDmText(product) {
  const title = product?.title?.trim() || 'produto';
  const link = String(product?.affiliated_link || product?.afilliated_link || '').trim();
  const lines = [`Seu link para comprar o produto ${title}`];
  if (link) lines.push(link);
  return lines.join('\n');
}

export function commentContainsQuero(text) {
  return /(^|[^a-zà-ÿ])quero([^a-zà-ÿ]|$)/i.test(String(text || ''));
}

export function hasGrantedPermission(granted, requiredName) {
  const aliases = PERMISSION_ALIASES[requiredName] || [requiredName];
  const set = new Set((granted || []).map((item) => String(item).toLowerCase()));
  return aliases.some((name) => set.has(name.toLowerCase()));
}

export function missingInstagramPermissions(granted) {
  return INSTAGRAM_REQUIRED_PERMISSIONS.filter(
    (name) => !hasGrantedPermission(granted, name),
  );
}
