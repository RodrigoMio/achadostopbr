import { STATUS } from './constants.js';
import { generateProductFromUserPrompt } from './gemini.js';
import { isGeminiConfigured } from './config.js';
import { getUserPromptIa } from './users.js';
import { getServiceClient } from './supabase.js';
import { asPositiveInt, asTrimmedString, isHttpUrl } from './validation.js';

const PRODUCT_SELECT = `
  id_product,
  title,
  product_link,
  image_link,
  affiliated_link,
  ia_description,
  price,
  whatsapp_group_name,
  whatsapp_sent,
  id_users,
  id_status,
  id_platform,
  id_category,
  created_at,
  updated_at,
  category:id_category ( id_category, label ),
  platform:id_platform ( id_platform, label, url_icon ),
  status:id_status ( id_status, label, color_hex )
`;

const PRODUCT_EDIT_KEYS = [
  'product_link',
  'image_link',
  'affiliated_link',
  'title',
  'ia_description',
  'id_category',
  'id_platform',
];

export function mapProduct(row) {
  if (!row) return null;
  return {
    id_product: row.id_product,
    title: row.title ?? null,
    product_link: row.product_link,
    image_link: row.image_link,
    affiliated_link: row.affiliated_link,
    ia_description: row.ia_description,
    price: Number(row.price) || 0,
    whatsapp_group_name: row.whatsapp_group_name ?? null,
    whatsapp_sent: row.whatsapp_sent ?? null,
    id_users: row.id_users,
    id_status: row.id_status,
    id_platform: row.id_platform,
    id_category: row.id_category,
    created_at: row.created_at,
    updated_at: row.updated_at,
    category: row.category ?? null,
    platform: row.platform ?? null,
    status: row.status ?? null,
  };
}

export function hasProductEditFields(body) {
  if (!body || typeof body !== 'object') return false;
  return PRODUCT_EDIT_KEYS.some((key) => Object.prototype.hasOwnProperty.call(body, key));
}

export function parseProductWritePayload(body) {
  const payload = body ?? {};
  const productLink = asTrimmedString(payload.product_link);
  const imageLink = asTrimmedString(payload.image_link);
  const affiliatedLink = asTrimmedString(payload.affiliated_link);
  const title = asTrimmedString(payload.title);
  const iaDescription = asTrimmedString(payload.ia_description);
  const idCategory = asPositiveInt(payload.id_category);
  const idPlatform = asPositiveInt(payload.id_platform);

  if (!idCategory) {
    return { ok: false, error: 'Categoria é obrigatória.' };
  }
  if (!idPlatform) {
    return { ok: false, error: 'Plataforma é obrigatória.' };
  }
  if (!productLink || productLink.length > 2048 || !isHttpUrl(productLink)) {
    return {
      ok: false,
      error: 'Link do produto deve ser uma URL válida (máx. 2048 caracteres).',
    };
  }
  if (!imageLink || imageLink.length > 2048 || !isHttpUrl(imageLink)) {
    return {
      ok: false,
      error: 'URL da imagem deve ser uma URL válida (máx. 2048 caracteres).',
    };
  }
  if (!affiliatedLink || affiliatedLink.length > 2048 || !isHttpUrl(affiliatedLink)) {
    return {
      ok: false,
      error: 'Link de afiliado deve ser uma URL válida (máx. 2048 caracteres).',
    };
  }
  if (title.length > 100) {
    return { ok: false, error: 'Título deve ter no máximo 100 caracteres.' };
  }
  if (iaDescription.length > 1500) {
    return { ok: false, error: 'Descrição deve ter no máximo 1500 caracteres.' };
  }

  return {
    ok: true,
    values: {
      title: title || null,
      product_link: productLink,
      image_link: imageLink,
      affiliated_link: affiliatedLink,
      ia_description: iaDescription || null,
      id_platform: idPlatform,
      id_category: idCategory,
    },
  };
}

export async function updateProductForUser(idProduct, idUsers, updates) {
  const supabase = getServiceClient();
  const { data, error } = await supabase
    .from('product')
    .update(updates)
    .eq('id_product', idProduct)
    .eq('id_users', idUsers)
    .select(PRODUCT_SELECT)
    .single();

  if (error) throw error;
  return mapProduct(data);
}

export async function listUserProducts(idUsers) {
  const supabase = getServiceClient();
  const { data, error } = await supabase
    .from('product')
    .select(PRODUCT_SELECT)
    .eq('id_users', idUsers)
    .order('created_at', { ascending: false });

  if (error) throw error;
  return (data ?? []).map(mapProduct);
}

export async function getProductForUser(idProduct, idUsers) {
  const supabase = getServiceClient();
  const { data, error } = await supabase
    .from('product')
    .select(PRODUCT_SELECT)
    .eq('id_product', idProduct)
    .eq('id_users', idUsers)
    .maybeSingle();

  if (error) throw error;
  return mapProduct(data);
}

export async function listCatalog() {
  const supabase = getServiceClient();
  const [categories, platforms] = await Promise.all([
    supabase.from('category').select('id_category, label').order('label'),
    supabase.from('platform').select('id_platform, label, url_icon').order('label'),
  ]);

  if (categories.error) throw categories.error;
  if (platforms.error) throw platforms.error;

  return {
    categories: categories.data ?? [],
    platforms: platforms.data ?? [],
  };
}

export async function runProductAi(product) {
  if (!isGeminiConfigured()) {
    throw new Error('GEMINI_API_KEY não configurado.');
  }

  if (product.id_status !== STATUS.GENERATE_IA) {
    const err = new Error('Só é possível gerar IA para produtos com status Gerar IA.');
    err.status = 400;
    throw err;
  }

  const userPrompt = await getUserPromptIa(product.id_users);
  if (!userPrompt?.trim()) {
    const err = new Error(
      'Configure o prompt em "Prompt para IA" antes de gerar.',
    );
    err.status = 400;
    throw err;
  }

  const copy = await generateProductFromUserPrompt({
    userPrompt,
    productLink: product.product_link,
    imageLink: product.image_link,
    affiliatedLink: product.affiliated_link,
    category: product.category?.label,
    platform: product.platform?.label,
  });

  const existingTitle = product.title?.trim() ?? '';
  const preserveTitle = existingTitle.length > 0;

  const updates = {
    title: preserveTitle ? existingTitle : copy.title || null,
    ia_description: copy.description || null,
    id_status: STATUS.TO_PROMOTE,
  };

  const supabase = getServiceClient();
  const { data, error } = await supabase
    .from('product')
    .update(updates)
    .eq('id_product', product.id_product)
    .select(PRODUCT_SELECT)
    .single();

  if (error) throw error;
  return mapProduct(data);
}
