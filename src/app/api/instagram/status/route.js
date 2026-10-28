import { NextResponse } from 'next/server';
import { getSession } from '@/lib/session';
import { getInstagramPublicState, startInstagram } from '@/server/instagram';

export const dynamic = 'force-dynamic';

export async function GET() {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: 'Não autenticado' }, { status: 401 });
  }

  let state = getInstagramPublicState();
  if (!state.checkedAt) {
    try {
      state = await startInstagram();
    } catch (err) {
      return NextResponse.json(
        { error: err.message || 'Falha ao consultar o Instagram' },
        { status: 500 },
      );
    }
  }

  return NextResponse.json(state);
}
