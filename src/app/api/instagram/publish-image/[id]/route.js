import { NextResponse } from 'next/server';
import { downloadProductImage, verifyPublishImageSignature } from '@/lib/instagramImage';
import { getProductPublishImageMeta } from '@/lib/products';
import { asPositiveInt } from '@/lib/validation';

export const dynamic = 'force-dynamic';

export async function GET(request, { params }) {
  const { id } = await params;
  const idProduct = asPositiveInt(id);
  if (!idProduct) {
    return NextResponse.json({ error: 'Produto inválido' }, { status: 400 });
  }

  const url = new URL(request.url);
  const sig = url.searchParams.get('sig') || '';

  try {
    const product = await getProductPublishImageMeta(idProduct);
    if (!product) {
      return NextResponse.json({ error: 'Produto não encontrado' }, { status: 404 });
    }
    if (!verifyPublishImageSignature(product, sig)) {
      return NextResponse.json({ error: 'Assinatura inválida' }, { status: 403 });
    }

    const { buffer, contentType } = await downloadProductImage(product.image_link);
    return new NextResponse(buffer, {
      status: 200,
      headers: {
        'Content-Type': contentType,
        'Content-Length': String(buffer.length),
        'Cache-Control': 'public, max-age=300',
      },
    });
  } catch (err) {
    console.error('[instagram publish-image]', idProduct, err.message);
    const status = typeof err.status === 'number' ? err.status : 502;
    return NextResponse.json(
      { error: err.message || 'Falha ao obter imagem' },
      { status },
    );
  }
}
