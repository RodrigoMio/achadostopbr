import { NextResponse } from 'next/server';
import { getSession } from '@/lib/session';
import { asTrimmedString } from '@/lib/validation';
import { filterGroupsByPrefix } from '@/lib/whatsappMessage';
import { buildWhatsAppGroupInviteUrl } from '@/lib/whatsappInvite';
import { listWhatsappGroupsForUserByJids } from '@/lib/whatsappGroups';
import {
  assertWhatsAppForUser,
  fetchGroupInviteCode,
  listParticipatingGroups,
} from '@/server/whatsapp';

export const dynamic = 'force-dynamic';

const INVITE_GAP_MS = 350;

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export async function POST(request) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: 'Não autenticado' }, { status: 401 });
  }

  let body;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'JSON inválido' }, { status: 400 });
  }

  const prefix = asTrimmedString(body?.prefix);
  if (!prefix) {
    return NextResponse.json({ error: 'Informe o nome do grupo para buscar.' }, { status: 400 });
  }
  if (prefix.length > 100) {
    return NextResponse.json(
      { error: 'Nome do grupo deve ter no máximo 100 caracteres.' },
      { status: 400 },
    );
  }

  const includeInvites = body?.include_invites !== false;

  try {
    assertWhatsAppForUser(session.id_users);

    const filtered = filterGroupsByPrefix(await listParticipatingGroups(), prefix);

    if (!includeInvites) {
      const groups = filtered.map((waGroup) => ({
        whatsapp_group_id: waGroup.jid,
        name: waGroup.name,
        current_members: waGroup.memberCount ?? 0,
      }));
      return NextResponse.json({ prefix, count: groups.length, groups });
    }

    const jids = filtered.map((group) => group.jid);
    const savedRows = await listWhatsappGroupsForUserByJids(session.id_users, jids);
    const savedByJid = new Map(savedRows.map((row) => [row.whatsapp_group_id, row]));

    const groups = [];
    for (let index = 0; index < filtered.length; index += 1) {
      if (index > 0) {
        await sleep(INVITE_GAP_MS);
      }

      const waGroup = filtered[index];
      let inviteCode = '';
      let inviteError = '';

      try {
        inviteCode = await fetchGroupInviteCode(waGroup.jid);
      } catch (err) {
        console.error('[whatsapp groups search invite]', waGroup.jid, err);
        inviteError =
          err?.message ||
          'Não foi possível obter o link de convite. A conta precisa ser admin do grupo.';
      }

      const saved = savedByJid.get(waGroup.jid) ?? null;
      groups.push({
        whatsapp_group_id: waGroup.jid,
        name: waGroup.name,
        invite_code: inviteCode || null,
        invite_url: buildWhatsAppGroupInviteUrl(inviteCode),
        invite_error: inviteCode ? '' : inviteError,
        current_members: waGroup.memberCount ?? 0,
        can_save: Boolean(inviteCode),
        saved,
      });
    }

    return NextResponse.json({ prefix, count: groups.length, groups });
  } catch (err) {
    console.error('[whatsapp groups search]', err);
    const status = err?.status || 500;
    return NextResponse.json(
      { error: err.message || 'Falha ao buscar grupos.' },
      { status },
    );
  }
}
