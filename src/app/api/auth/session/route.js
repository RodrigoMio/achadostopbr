import { NextResponse } from 'next/server';
import { setSessionCookie } from '@/lib/session';
import { connectWhatsApp, getPublicState } from '@/server/whatsapp';

export const dynamic = 'force-dynamic';

export async function POST() {
  connectWhatsApp().catch(() => {});
  const state = getPublicState();

  if (!state.connected || !state.authorized || !state.user) {
    return NextResponse.json(
      {
        error: state.error || 'Número não habilitado',
        authorized: false,
      },
      { status: 403 },
    );
  }

  await setSessionCookie({
    id_users: state.user.id_users,
    name: state.user.name,
    slug: state.user.slug,
    jid: state.jid,
  });

  return NextResponse.json({
    ok: true,
    redirect: '/admin',
    user: state.user,
  });
}
