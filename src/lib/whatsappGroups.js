import { getServiceClient } from './supabase.js';
import { asPositiveInt, asTrimmedString } from './validation.js';
import { buildWhatsAppGroupInviteUrl } from './whatsappInvite.js';

export const PUBLIC_GROUPS_PER_CATEGORY = 3;

const GROUP_SELECT = `
  id_whatsapp_group,
  id_users,
  whatsapp_group_id,
  title,
  invite_code,
  id_group_category,
  max_capacity,
  current_members,
  is_active,
  created_at,
  updated_at,
  group_category:id_group_category ( id_group_category, title )
`;

export function mapWhatsappGroup(row) {
  if (!row) return null;
  const category = row.group_category;
  return {
    id_whatsapp_group: row.id_whatsapp_group,
    id_users: row.id_users,
    whatsapp_group_id: row.whatsapp_group_id,
    title: row.title,
    invite_code: row.invite_code,
    id_group_category: row.id_group_category,
    max_capacity: row.max_capacity,
    current_members: row.current_members,
    is_active: row.is_active,
    created_at: row.created_at,
    updated_at: row.updated_at,
    category: category
      ? { id_group_category: category.id_group_category, title: category.title }
      : null,
  };
}

export async function listGroupCategories() {
  const supabase = getServiceClient();
  const { data, error } = await supabase
    .from('group_category')
    .select('id_group_category, title, description')
    .order('id_group_category', { ascending: true });

  if (error) throw error;
  return data ?? [];
}

export function isWhatsappGroupJoinable(group) {
  if (!group || group.is_active === false) return false;
  if (!buildWhatsAppGroupInviteUrl(group.invite_code)) return false;
  const members = Number(group.current_members);
  const capacity = Number(group.max_capacity);
  if (!Number.isFinite(members) || !Number.isFinite(capacity)) return false;
  return members < capacity;
}

export async function listPublicCategoriesWithGroups(idUsers) {
  const supabase = getServiceClient();
  const [categoriesResult, groupsResult] = await Promise.all([
    supabase
      .from('group_category')
      .select('id_group_category, title, description')
      .order('id_group_category', { ascending: true }),
    supabase
      .from('whatsapp_group')
      .select(
        'id_whatsapp_group, title, invite_code, id_group_category, max_capacity, current_members, is_active',
      )
      .eq('id_users', idUsers)
      .eq('is_active', true)
      .order('id_whatsapp_group', { ascending: false }),
  ]);

  if (categoriesResult.error) throw categoriesResult.error;
  if (groupsResult.error) throw groupsResult.error;

  const groupsByCategory = new Map();
  for (const row of groupsResult.data ?? []) {
    if (!isWhatsappGroupJoinable(row)) continue;
    const list = groupsByCategory.get(row.id_group_category) ?? [];
    if (list.length >= PUBLIC_GROUPS_PER_CATEGORY) continue;
    list.push({
      id_whatsapp_group: row.id_whatsapp_group,
      title: row.title,
      invite_code: row.invite_code,
    });
    groupsByCategory.set(row.id_group_category, list);
  }

  return (categoriesResult.data ?? [])
    .filter((category) => (groupsByCategory.get(category.id_group_category) ?? []).length > 0)
    .map((category) => ({
      id_group_category: category.id_group_category,
      title: category.title,
      description: category.description,
      groups: groupsByCategory.get(category.id_group_category),
    }));
}

export async function listWhatsappGroupsForUserByJids(idUsers, jids) {
  const uniqueJids = [...new Set((jids ?? []).map((jid) => asTrimmedString(jid)).filter(Boolean))];
  if (uniqueJids.length === 0) return [];

  const supabase = getServiceClient();
  const { data, error } = await supabase
    .from('whatsapp_group')
    .select(GROUP_SELECT)
    .eq('id_users', idUsers)
    .in('whatsapp_group_id', uniqueJids);

  if (error) throw error;
  return (data ?? []).map(mapWhatsappGroup);
}

export function parseWhatsappGroupSavePayload(body) {
  const whatsappGroupId = asTrimmedString(body?.whatsapp_group_id);
  const title = asTrimmedString(body?.title);
  const inviteCode = asTrimmedString(body?.invite_code);
  const idGroupCategory = asPositiveInt(body?.id_group_category);
  const maxCapacity = asPositiveInt(body?.max_capacity);
  const currentMembers = Number(body?.current_members);
  const isActive = body?.is_active !== false;

  if (!whatsappGroupId) {
    return { ok: false, error: 'Grupo inválido.' };
  }
  if (!title) {
    return { ok: false, error: 'Nome do grupo é obrigatório.' };
  }
  if (title.length > 100) {
    return { ok: false, error: 'Nome do grupo deve ter no máximo 100 caracteres.' };
  }
  if (!inviteCode) {
    return {
      ok: false,
      error:
        'Não foi possível obter o link de convite deste grupo. Verifique se a conta WhatsApp é admin do grupo.',
    };
  }
  if (inviteCode.length > 64) {
    return { ok: false, error: 'Código de convite inválido.' };
  }
  if (!idGroupCategory) {
    return { ok: false, error: 'Selecione uma categoria.' };
  }
  if (!maxCapacity || maxCapacity < 200 || maxCapacity > 1024) {
    return { ok: false, error: 'Limite de membros deve estar entre 200 e 1024.' };
  }
  if (!Number.isInteger(currentMembers) || currentMembers < 0) {
    return { ok: false, error: 'Contagem de membros inválida.' };
  }

  return {
    ok: true,
    values: {
      whatsapp_group_id: whatsappGroupId,
      title,
      invite_code: inviteCode,
      id_group_category: idGroupCategory,
      max_capacity: maxCapacity,
      current_members: currentMembers,
      is_active: isActive,
    },
  };
}

export async function upsertWhatsappGroupForUser(idUsers, values) {
  const supabase = getServiceClient();
  const payload = {
    id_users: idUsers,
    whatsapp_group_id: values.whatsapp_group_id,
    title: values.title,
    invite_code: values.invite_code,
    id_group_category: values.id_group_category,
    max_capacity: values.max_capacity,
    current_members: values.current_members,
    is_active: values.is_active,
  };

  const { data, error } = await supabase
    .from('whatsapp_group')
    .upsert(payload, { onConflict: 'id_users,whatsapp_group_id' })
    .select(GROUP_SELECT)
    .single();

  if (error) throw error;
  return mapWhatsappGroup(data);
}
