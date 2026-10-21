import { NextResponse } from 'next/server';
import { getSession } from '@/lib/session';
import { listCatalog } from '@/lib/products';

export const dynamic = 'force-dynamic';

export async function GET() {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: 'Não autenticado' }, { status: 401 });
  }

  try {
    const catalog = await listCatalog();
    return NextResponse.json(catalog);
  } catch (err) {
    console.error('[catalog]', err);
    return NextResponse.json(
      { error: err.message || 'Falha ao carregar catálogo' },
      { status: 500 },
    );
  }
}
