import { NextResponse } from 'next/server';
import { getSession } from '@/lib/session';
import { INSTAGRAM_CAPTION_MAX } from '@/lib/instagram';
import { getPublicOriginFromRequest } from '@/lib/publicOrigin';
import { asPositiveInt, asTrimmedString } from '@/lib/validation';
import { getProductForUser } from '@/lib/products';
import {
  getProductInstagramPosts,
  publishProductToInstagram,
} from '@/server/instagram';

export const dynamic = 'force-dynamic';

export async function GET(_request, { params }) {
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
    const posts = await getProductInstagramPosts(idProduct);
    return NextResponse.json({
      product,
      posts,
      posts_count: posts.length,
      last_published_at: posts[0]?.published_at ?? product.instagram_sent ?? null,
    });
  } catch (err) {
    console.error('[products instagram get]', err);
    const status = typeof err.status === 'number' ? err.status : 500;
    return NextResponse.json(
      { error: err.message || 'Falha ao consultar publicações do Instagram' },
      { status },
    );
  }
}

export async function POST(request, { params }) {
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

  const caption = asTrimmedString(body.caption);
  if (!caption) {
    return NextResponse.json({ error: 'Informe a legenda da publicação.' }, { status: 400 });
  }
  if (caption.length > INSTAGRAM_CAPTION_MAX) {
    return NextResponse.json(
      { error: `Legenda deve ter no máximo ${INSTAGRAM_CAPTION_MAX} caracteres.` },
      { status: 400 },
    );
  }

  try {
    const product = await getProductForUser(idProduct, session.id_users);
    if (!product) {
      return NextResponse.json({ error: 'Produto não encontrado' }, { status: 404 });
    }

    const posts = await getProductInstagramPosts(idProduct);
    const confirm = body.confirm === true;
    if (posts.length > 0 && !confirm) {
      return NextResponse.json({
        needs_confirm: true,
        posts_count: posts.length,
        last_published_at: posts[0]?.published_at ?? product.instagram_sent ?? null,
        product,
      });
    }

    const requestOrigin = getPublicOriginFromRequest(request);
    const result = await publishProductToInstagram({
      product,
      caption,
      idUsers: session.id_users,
      publicAppBaseUrl: requestOrigin,
      publicAppOriginHint: requestOrigin || new URL(request.url).origin,
    });

    return NextResponse.json({
      product: result.product,
      post: result.post,
    });
  } catch (err) {
    console.error('[products instagram]', err);
    const status = typeof err.status === 'number' ? err.status : 500;
    return NextResponse.json(
      { error: err.message || 'Falha ao publicar no Instagram' },
      { status },
    );
  }
}
