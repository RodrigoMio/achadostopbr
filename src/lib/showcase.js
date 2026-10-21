import { STATUS } from './constants.js';
import { getServiceClient } from './supabase.js';
import { mapProduct } from './products.js';

export async function getPublicProfileBySlug(slug) {
  const supabase = getServiceClient();
  const { data, error } = await supabase
    .from('users')
    .select('id_users, name, slug, days_limit_show_product, id_status')
    .eq('slug', slug)
    .eq('id_status', STATUS.ACTIVE)
    .maybeSingle();

  if (error) throw error;
  return data;
}

export async function listShowcaseProducts(profile) {
  const since = new Date();
  since.setDate(since.getDate() - (profile.days_limit_show_product || 30));

  const supabase = getServiceClient();
  const { data, error } = await supabase
    .from('product')
    .select(
      `
      id_product,
      title,
      product_link,
      image_link,
      affiliated_link,
      ia_description,
      price,
      id_users,
      id_status,
      id_platform,
      id_category,
      created_at,
      updated_at,
      category:id_category ( id_category, label ),
      platform:id_platform ( id_platform, label, url_icon )
    `,
    )
    .eq('id_users', profile.id_users)
    .eq('id_status', STATUS.PROMOTED)
    .gte('updated_at', since.toISOString())
    .order('updated_at', { ascending: false });

  if (error) throw error;
  return (data ?? []).map(mapProduct);
}

export async function listFilterCatalog() {
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
