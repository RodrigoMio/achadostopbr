import { NextResponse } from 'next/server';
import { getSession } from '@/lib/session';
import { STATUS } from '@/lib/constants';
import { asPositiveInt } from '@/lib/validation';
import {
  getProductForUser,
  hasProductEditFields,
  parseProductWritePayload,
  updateProductForUser,
} from '@/lib/products';

export const dynamic = 'force-dynamic';

export async function PATCH(request, { params }) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: 'Não autenticado' }, { status: 401 });
  }

  const { id } = await params;
  const idProduct = asPositiveInt(id);
  if (!idProduct) {
    return NextResponse.json({ error: 'Produto inválido' }, { status: 400 });
  }

  let body;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'JSON inválido' }, { status: 400 });
  }

  try {
    const current = await getProductForUser(idProduct, session.id_users);
    if (!current) {
      return NextResponse.json({ error: 'Produto não encontrado' }, { status: 404 });
    }

    if (hasProductEditFields(body)) {
      const parsed = parseProductWritePayload(body);
      if (!parsed.ok) {
        return NextResponse.json({ error: parsed.error }, { status: 400 });
      }

      const product = await updateProductForUser(
        idProduct,
        session.id_users,
        parsed.values,
      );
      return NextResponse.json({ product });
    }

    const nextStatus = asPositiveInt(body.id_status);
    if (nextStatus !== STATUS.TO_PROMOTE && nextStatus !== STATUS.PROMOTED) {
      return NextResponse.json(
        { error: 'Só é possível alternar entre A Divulgar e Divulgado.' },
        { status: 400 },
      );
    }

    if (current.id_status === STATUS.GENERATE_IA) {
      return NextResponse.json(
        { error: 'Conclua a geração por IA antes de alterar a vitrine.' },
        { status: 400 },
      );
    }

    if (
      current.id_status !== STATUS.TO_PROMOTE &&
      current.id_status !== STATUS.PROMOTED
    ) {
      return NextResponse.json(
        { error: 'Este produto não pode ir para a vitrine neste estado.' },
        { status: 400 },
      );
    }

    const product = await updateProductForUser(idProduct, session.id_users, {
      id_status: nextStatus,
    });
    return NextResponse.json({ product });
  } catch (err) {
    console.error('[products PATCH]', err);
    return NextResponse.json(
      { error: err.message || 'Falha ao atualizar produto' },
      { status: 500 },
    );
  }
}
