import { NextResponse } from 'next/server';
import { clearSessionCookie } from '@/lib/session';

export const dynamic = 'force-dynamic';

/** Limpa o cookie de sessão (permitido em Route Handler) e redireciona ao painel. */
export async function GET(request) {
  await clearSessionCookie();
  const { searchParams } = new URL(request.url);
  const target = searchParams.get('redirect') || '/admin';
  const safePath = target.startsWith('/') && !target.startsWith('//') ? target : '/admin';
  return NextResponse.redirect(new URL(safePath, request.url));
}
