import { NextResponse } from 'next/server';
import { getSession } from '@/lib/session';
import { STATUS } from '@/lib/constants';
import { getServiceClient } from '@/lib/supabase';
import { getProductForUser, listUserProducts, parseProductWritePayload } from '@/lib/products';

export const dynamic = 'force-dynamic';

export async function GET() {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: 'Não autenticado' }, { status: 401 });
  }

  try {
    const products = await listUserProducts(session.id_users);
    return NextResponse.json({ products });
  } catch (err) {
    console.error('[products GET]', err);
    return NextResponse.json(
      { error: err.message || 'Falha ao listar produtos' },
      { status: 500 },
    );
  }
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

  const parsed = parseProductWritePayload(body);
  if (!parsed.ok) {
    return NextResponse.json({ error: parsed.error }, { status: 400 });
  }

  try {
    const supabase = getServiceClient();
    const { data, error } = await supabase
      .from('product')
      .insert({
        ...parsed.values,
        price: 0,
        id_users: session.id_users,
        id_status: STATUS.GENERATE_IA,
      })
      .select('id_product')
      .single();

    if (error) throw error;

    const product = await getProductForUser(data.id_product, session.id_users);

    return NextResponse.json({ product }, { status: 201 });
  } catch (err) {
    console.error('[products POST]', err);
    return NextResponse.json(
      { error: err.message || 'Falha ao guardar o produto' },
      { status: 500 },
    );
  }
}
