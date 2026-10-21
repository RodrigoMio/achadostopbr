import { NextResponse } from 'next/server';
import { clearSessionCookie } from '@/lib/session';
import { logoutSession } from '@/server/whatsapp';

export const dynamic = 'force-dynamic';

export async function POST() {
  await clearSessionCookie();
  logoutSession().catch((err) => {
    console.error('[Logout] WhatsApp:', err);
  });
  return NextResponse.json({ ok: true });
}
