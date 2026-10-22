import { NextResponse } from 'next/server';
import { getSession } from '@/lib/session';
import { asPositiveInt, asTrimmedString } from '@/lib/validation';
import { getProductForUser, updateProductForUser } from '@/lib/products';
import { getUserStoreUrl, updateUserWhatsappGroupName } from '@/lib/users';
import {
  buildProductWhatsAppCaption,
  filterGroupsByPrefix,
} from '@/lib/whatsappMessage';
import {
  assertWhatsAppForUser,
  listParticipatingGroups,
  sendImageMessage,
} from '@/server/whatsapp';

export const dynamic = 'force-dynamic';

const SEND_GAP_MS = 1000;

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
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

  const groupName = asTrimmedString(body.whatsapp_group_name);
  if (!groupName) {
    return NextResponse.json({ error: 'Informe o nome do grupo.' }, { status: 400 });
  }
  if (groupName.length > 100) {
    return NextResponse.json(
      { error: 'Nome do grupo deve ter no máximo 100 caracteres.' },
      { status: 400 },
    );
  }

  try {
    const current = await getProductForUser(idProduct, session.id_users);
    if (!current) {
      return NextResponse.json({ error: 'Produto não encontrado' }, { status: 404 });
    }

    assertWhatsAppForUser(session.id_users);

    const savedGroupName = await updateUserWhatsappGroupName(
      session.id_users,
      groupName,
    );
    const product = current;

    const groups = filterGroupsByPrefix(
      await listParticipatingGroups(),
      groupName,
    );
    const confirm = body.confirm === true;

    if (!confirm) {
      return NextResponse.json({
        product,
        whatsapp_group_name: savedGroupName,
        count: groups.length,
        groups,
      });
    }

    if (groups.length === 0) {
      return NextResponse.json(
        {
          product,
          whatsapp_group_name: savedGroupName,
          count: 0,
          groups: [],
          error: 'Nenhum grupo encontrado',
        },
        { status: 404 },
      );
    }

    const storeUrl = await getUserStoreUrl(session.id_users);
    const caption = buildProductWhatsAppCaption(product, storeUrl);
    const failed = [];
    let sent = 0;

    for (let index = 0; index < groups.length; index += 1) {
      if (index > 0) {
        await sleep(SEND_GAP_MS);
      }
      const group = groups[index];
      try {
        await sendImageMessage(group.jid, product.image_link, caption);
        sent += 1;
      } catch (err) {
        console.error('[products whatsapp send]', group.jid, err);
        failed.push({
          jid: group.jid,
          name: group.name,
          error: err.message || 'Falha ao enviar',
        });
      }
    }

    let updatedProduct = product;
    if (sent > 0) {
      updatedProduct = await updateProductForUser(idProduct, session.id_users, {
        whatsapp_sent: new Date().toISOString(),
      });
    }

    return NextResponse.json({
      product: updatedProduct,
      whatsapp_group_name: savedGroupName,
      count: groups.length,
      sent,
      failed,
    });
  } catch (err) {
    console.error('[products whatsapp]', err);
    const status = typeof err.status === 'number' ? err.status : 500;
    return NextResponse.json(
      { error: err.message || 'Falha no envio WhatsApp' },
      { status },
    );
  }
}
