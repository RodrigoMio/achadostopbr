import { getServiceClient } from './supabase.js';
import { config } from './config.js';

function isMissingRelation(error) {
  const code = String(error?.code || '');
  const message = String(error?.message || '').toLowerCase();
  return (
    code === '42P01' ||
    code === 'PGRST205' ||
    code === '42703' ||
    message.includes('does not exist') ||
    message.includes('schema cache')
  );
}

function migrationError(error) {
  const err = new Error(
    'Tabelas do Instagram em falta. Execute supabase/migrations/008_instagram.sql no SQL Editor do Supabase.',
  );
  err.status = 500;
  err.cause = error;
  return err;
}

function isUniqueViolation(error) {
  return String(error?.code || '') === '23505';
}

export async function getOrCreateDefaultInstagramAccount({ facebookPageId } = {}) {
  const supabase = getServiceClient();
  const { data: existing, error: readError } = await supabase
    .from('instagram_account')
    .select(
      'id_instagram_account, id_users, ig_business_account_id, facebook_page_id, token_source, is_default',
    )
    .eq('is_default', true)
    .maybeSingle();

  if (readError) {
    if (isMissingRelation(readError)) throw migrationError(readError);
    throw readError;
  }

  const pageId = facebookPageId || config.facebookPageId || null;
  const igId = config.instagramBusinessAccountId;

  if (existing) {
    const updates = {};
    if (igId && existing.ig_business_account_id !== igId) {
      updates.ig_business_account_id = igId;
    }
    if (pageId && existing.facebook_page_id !== pageId) {
      updates.facebook_page_id = pageId;
    }
    if (Object.keys(updates).length === 0) return existing;

    updates.updated_at = new Date().toISOString();
    const { data, error } = await supabase
      .from('instagram_account')
      .update(updates)
      .eq('id_instagram_account', existing.id_instagram_account)
      .select(
        'id_instagram_account, id_users, ig_business_account_id, facebook_page_id, token_source, is_default',
      )
      .single();
    if (error) throw error;
    return data;
  }

  const { data, error } = await supabase
    .from('instagram_account')
    .insert({
      id_users: null,
      ig_business_account_id: igId,
      facebook_page_id: pageId,
      token_source: 'env',
      is_default: true,
    })
    .select(
      'id_instagram_account, id_users, ig_business_account_id, facebook_page_id, token_source, is_default',
    )
    .single();

  if (error) {
    if (isMissingRelation(error)) throw migrationError(error);
    throw error;
  }
  return data;
}

export async function listInstagramPostsForProduct(idProduct) {
  const supabase = getServiceClient();
  const { data, error } = await supabase
    .from('instagram_post')
    .select(
      'id_instagram_post, id_product, ig_media_id, caption, permalink, published_at',
    )
    .eq('id_product', idProduct)
    .order('published_at', { ascending: false });

  if (error) {
    if (isMissingRelation(error)) throw migrationError(error);
    throw error;
  }
  return data ?? [];
}

export async function insertInstagramPost(row) {
  const supabase = getServiceClient();
  const { data, error } = await supabase
    .from('instagram_post')
    .insert(row)
    .select(
      'id_instagram_post, id_instagram_account, id_product, id_users, ig_container_id, ig_media_id, caption, permalink, published_at',
    )
    .single();

  if (error) {
    if (isMissingRelation(error)) throw migrationError(error);
    throw error;
  }
  return data;
}

export async function findInstagramPostByMediaId(igMediaId) {
  if (!igMediaId) return null;
  const supabase = getServiceClient();
  const { data, error } = await supabase
    .from('instagram_post')
    .select(
      'id_instagram_post, id_instagram_account, id_product, id_users, ig_media_id, caption, permalink',
    )
    .eq('ig_media_id', String(igMediaId))
    .maybeSingle();

  if (error) {
    if (isMissingRelation(error)) throw migrationError(error);
    throw error;
  }
  return data ?? null;
}

export async function insertCommentDm(row) {
  const supabase = getServiceClient();
  const { data, error } = await supabase
    .from('instagram_comment_dm')
    .insert(row)
    .select('id_instagram_comment_dm, ig_comment_id, ig_commenter_id, dm_status')
    .single();

  if (!error) {
    return { ok: true, row: data };
  }
  if (isMissingRelation(error)) throw migrationError(error);
  if (!isUniqueViolation(error)) throw error;

  const details = `${error.message || ''} ${error.details || ''} ${error.hint || ''}`.toLowerCase();
  if (details.includes('ig_comment_id') || details.includes('comment_uidx')) {
    return { ok: false, reason: 'duplicate_comment' };
  }
  return { ok: false, reason: 'already_claimed' };
}

export async function updateCommentDm(id, updates) {
  const supabase = getServiceClient();
  const { error } = await supabase
    .from('instagram_comment_dm')
    .update(updates)
    .eq('id_instagram_comment_dm', id);
  if (error) throw error;
}

export async function listRecentInstagramPosts(limit = 5) {
  const supabase = getServiceClient();
  const { data, error } = await supabase
    .from('instagram_post')
    .select('id_instagram_post, id_product, ig_media_id, permalink, published_at')
    .order('published_at', { ascending: false })
    .limit(limit);

  if (error) {
    if (isMissingRelation(error)) throw migrationError(error);
    throw error;
  }
  return data ?? [];
}

export async function listRecentCommentDms(limit = 10) {
  const supabase = getServiceClient();
  const { data, error } = await supabase
    .from('instagram_comment_dm')
    .select(
      'id_instagram_comment_dm, ig_comment_id, ig_commenter_id, comment_text, matched, dm_status, dm_error, created_at, processed_at',
    )
    .order('created_at', { ascending: false })
    .limit(limit);

  if (error) {
    if (isMissingRelation(error)) throw migrationError(error);
    throw error;
  }
  return data ?? [];
}
