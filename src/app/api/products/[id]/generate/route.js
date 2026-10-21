import { NextResponse } from 'next/server';
import { getSession } from '@/lib/session';
import { asPositiveInt } from '@/lib/validation';
import { getProductForUser, runProductAi } from '@/lib/products';

export const dynamic = 'force-dynamic';

export async function POST(_request, { params }) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: 'Não autenticado' }, { status: 401 });
  }

  const { id } = await params;
  const idProduct = asPositiveInt(id);
  if (!idProduct) {
    return NextResponse.json({ error: 'Produto inválido' }, { status: 400 });
  }

  try {
    const product = await getProductForUser(idProduct, session.id_users);
    if (!product) {
      return NextResponse.json({ error: 'Produto não encontrado' }, { status: 404 });
    }

    const updated = await runProductAi(product);
    return NextResponse.json({ product: updated });
  } catch (err) {
    console.error('[products generate]', err);
    const status = typeof err.status === 'number' ? err.status : 500;
    return NextResponse.json(
      { error: err.message || 'Falha ao gerar texto com IA' },
      { status },
    );
  }
}
