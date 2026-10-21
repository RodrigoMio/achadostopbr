import { NextResponse } from 'next/server';
import { getSession } from '@/lib/session';
import {
  parseWhatsappGroupSavePayload,
  upsertWhatsappGroupForUser,
} from '@/lib/whatsappGroups';
import { buildWhatsAppGroupInviteUrl } from '@/lib/whatsappInvite';
import {
  assertWhatsAppForUser,
  listParticipatingGroups,
} from '@/server/whatsapp';
import { asTrimmedString } from '@/lib/validation';

export const dynamic = 'force-dynamic';

export async function PUT(request) {
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

  const parsed = parseWhatsappGroupSavePayload(body);
  if (!parsed.ok) {
    return NextResponse.json({ error: parsed.error }, { status: 400 });
  }

  try {
    assertWhatsAppForUser(session.id_users);

    const participating = await listParticipatingGroups();
    const live = participating.find(
      (item) => item.jid === parsed.values.whatsapp_group_id,
    );
    const liveTitle = asTrimmedString(live?.name);
    const values = {
      ...parsed.values,
      title: liveTitle || parsed.values.title,
    };

    const group = await upsertWhatsappGroupForUser(session.id_users, values);
    return NextResponse.json({
      group: {
        ...group,
        invite_url: buildWhatsAppGroupInviteUrl(group.invite_code),
      },
    });
  } catch (err) {
    console.error('[whatsapp groups save]', err);
    const status = err?.status || 500;
    return NextResponse.json(
      { error: err.message || 'Falha ao salvar grupo.' },
      { status },
    );
  }
}
