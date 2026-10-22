import { STATUS } from './constants.js';
import { jidLookupCandidates } from './jid.js';
import { getServiceClient } from './supabase.js';

export async function findActiveUserByJid(jid) {
  const candidates = jidLookupCandidates(jid);
  if (candidates.length === 0) return null;

  const supabase = getServiceClient();
  const { data, error } = await supabase
    .from('users')
    .select('id_users, name, slug, whatsapp_jid, id_status, days_limit_show_product')
    .in('whatsapp_jid', candidates)
    .eq('id_status', STATUS.ACTIVE)
    .limit(1);

  if (error) {
    throw error;
  }

  return data?.[0] ?? null;
}

export async function getDefaultCatalogProfile() {
  const supabase = getServiceClient();
  const { data, error } = await supabase
    .from('users')
    .select('id_users, name, slug, days_limit_show_product, id_status')
    .eq('default_catalog', true)
    .eq('id_status', STATUS.ACTIVE)
    .order('id_users', { ascending: true })
    .limit(1);

  if (error) throw error;
  return data?.[0] ?? null;
}

export async function getUserPromptIa(idUsers) {
  const supabase = getServiceClient();
  const { data, error } = await supabase
    .from('users')
    .select('prompt_ia')
    .eq('id_users', idUsers)
    .maybeSingle();

  if (error) throw error;
  return data?.prompt_ia ?? '';
}

export async function updateUserPromptIa(idUsers, promptIa) {
  const supabase = getServiceClient();
  const { data, error } = await supabase
    .from('users')
    .update({ prompt_ia: promptIa })
    .eq('id_users', idUsers)
    .select('prompt_ia')
    .single();

  if (error) throw error;
  return data?.prompt_ia ?? '';
}

export async function getUserWhatsappGroupName(idUsers) {
  const supabase = getServiceClient();
  const { data, error } = await supabase
    .from('users')
    .select('whatsapp_group_name')
    .eq('id_users', idUsers)
    .maybeSingle();

  if (error) throw error;
  return data?.whatsapp_group_name ?? '';
}

export async function getUserStoreUrl(idUsers) {
  const supabase = getServiceClient();
  const { data, error } = await supabase
    .from('users')
    .select('store_url')
    .eq('id_users', idUsers)
    .maybeSingle();

  if (error) throw error;
  return data?.store_url ?? '';
}

export async function updateUserWhatsappGroupName(idUsers, groupName) {
  const supabase = getServiceClient();
  const { data, error } = await supabase
    .from('users')
    .update({ whatsapp_group_name: groupName })
    .eq('id_users', idUsers)
    .select('whatsapp_group_name')
    .single();

  if (error) throw error;
  return data?.whatsapp_group_name ?? '';
}
