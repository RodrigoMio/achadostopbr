import { NextResponse } from 'next/server';
import { config, isInstagramWebhookConfigured } from '@/lib/config';
import { getSession } from '@/lib/session';
import {
  getInstagramPublicState,
  getInstagramWebhookDiagnostics,
  startInstagram,
} from '@/server/instagram';

export const dynamic = 'force-dynamic';

export async function GET() {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: 'Não autenticado' }, { status: 401 });
  }

  const current = getInstagramPublicState();
  if (!current.checkedAt) {
    try {
      await startInstagram();
    } catch {
      /* diagnostics still useful */
    }
  }

  try {
    const diagnostics = await getInstagramWebhookDiagnostics();
    const publicBase = (config.publicAppUrl || 'https://www.achadostopbr.com.br').replace(
      /\/+$/,
      '',
    );
    const verifyTokenSet = Boolean(config.metaWebhookVerifyToken);
    const appSecretSet = Boolean(config.metaAppSecret);

    return NextResponse.json({
      ...diagnostics,
      checklist: {
        metaWebhookVerifyToken: verifyTokenSet,
        metaAppSecret: appSecretSet,
        webhookConfigured: isInstagramWebhookConfigured(),
        metaCallbackUrlSuggested: `${publicBase}/webhook`,
        metaCallbackUrlAlt: `${publicBase}/api/webhook`,
        subscribeField: 'comments',
        instagramBusinessAccountId: config.instagramBusinessAccountId || null,
        facebookPageId: config.facebookPageId || diagnostics.pageId || null,
        commentFromPersonalAccount:
          'Use conta pessoal (não @achadostopbr.ofertas) com texto contendo QUERO',
        localhostNote:
          'Webhooks só chegam ao Render/produção; publicar pelo localhost grava o post no Supabase.',
        setupDoc: 'docs/instagram-webhook-setup.md',
      },
    });
  } catch (err) {
    console.error('[instagram webhook-status]', err);
    return NextResponse.json(
      { error: err.message || 'Falha ao obter diagnóstico' },
      { status: 500 },
    );
  }
}
