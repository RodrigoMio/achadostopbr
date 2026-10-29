import {
  config,
  isInstagramConfigured,
  isInstagramWebhookConfigured,
  isPublicAppUrlConfigured,
} from '../lib/config.js';
import {
  buildInstagramDmText,
  commentContainsQuero,
  missingInstagramPermissions,
} from '../lib/instagram.js';
import {
  assertInstagramPublishReady,
  createImageContainer,
  fetchGrantedPermissions,
  fetchInstagramAccount,
  fetchMediaPermalink,
  fetchTokenProfile,
  publishMediaContainer,
  resolveFacebookPageId,
  sendPrivateReply,
  waitForContainer,
} from '../lib/instagramGraph.js';
import {
  findInstagramPostByMediaId,
  getOrCreateDefaultInstagramAccount,
  insertCommentDm,
  insertInstagramPost,
  listInstagramPostsForProduct,
  listRecentCommentDms,
  listRecentInstagramPosts,
  updateCommentDm,
} from '../lib/instagramStore.js';
import { getProductForUser, updateProductForUser } from '../lib/products.js';
import {
  buildInstagramProxyImageUrl,
  downloadProductImage,
  mapInstagramMediaFetchError,
  resolvePublicAppBaseUrl,
} from '../lib/instagramImage.js';

const state = {
  configured: false,
  webhookConfigured: false,
  permissionsOk: false,
  grantedPermissions: [],
  missingPermissions: [],
  username: '',
  pageId: '',
  igUserId: '',
  lastError: '',
  checkedAt: null,
  lastWebhook: null,
};

function syncConfigFlags() {
  state.configured = isInstagramConfigured();
  state.webhookConfigured = isInstagramWebhookConfigured();
  if (!state.igUserId) state.igUserId = config.instagramBusinessAccountId;
  if (!state.pageId) state.pageId = config.facebookPageId;
}

export function getInstagramPublicState() {
  syncConfigFlags();
  return {
    configured: state.configured,
    webhookConfigured: state.webhookConfigured,
    permissionsOk: state.permissionsOk,
    missingPermissions: state.missingPermissions,
    publicAppUrlConfigured: isPublicAppUrlConfigured(),
    facebookPageIdConfigured: Boolean(config.facebookPageId || state.pageId),
    webhookCallbackUrls: [
      '/webhook',
      '/api/webhook',
    ],
    username: state.username,
    pageId: state.pageId || config.facebookPageId || null,
    lastError: state.lastError,
    checkedAt: state.checkedAt,
    lastWebhook: state.lastWebhook,
  };
}

export async function getInstagramWebhookDiagnostics() {
  syncConfigFlags();
  let recentPosts = [];
  let recentCommentDms = [];
  let tablesOk = true;
  let tablesError = null;

  try {
    [recentPosts, recentCommentDms] = await Promise.all([
      listRecentInstagramPosts(5),
      listRecentCommentDms(10),
    ]);
  } catch (err) {
    tablesOk = false;
    tablesError = err.message || 'Falha ao consultar Supabase';
  }

  return {
    ...getInstagramPublicState(),
    tablesOk,
    tablesError,
    recentPosts,
    recentCommentDms,
    setupGuide: '/docs/instagram-webhook-setup.md',
  };
}

export async function startInstagram() {
  state.configured = isInstagramConfigured();
  state.webhookConfigured = isInstagramWebhookConfigured();
  state.igUserId = config.instagramBusinessAccountId;
  state.pageId = config.facebookPageId;
  state.lastError = '';

  if (!state.configured) {
    state.lastError = 'META_ACCESS_TOKEN ou INSTAGRAM_BUSINESS_ACCOUNT_ID em falta.';
    console.warn('[Instagram]', state.lastError);
    return getInstagramPublicState();
  }

  try {
    const granted = await fetchGrantedPermissions();
    state.grantedPermissions = granted;
    state.missingPermissions = missingInstagramPermissions(granted);
    state.permissionsOk = state.missingPermissions.length === 0;
    if (!state.permissionsOk) {
      console.warn(
        '[Instagram] Permissões em falta no token:',
        state.missingPermissions.join(', '),
      );
    } else {
      console.log('[Instagram] Permissões do token validadas:', granted.join(', '));
    }
  } catch (err) {
    state.permissionsOk = false;
    state.lastError = err.message || 'Falha ao validar permissões do token.';
    console.error('[Instagram] GET /me/permissions:', state.lastError);
  }

  try {
    const profile = await fetchTokenProfile();
    if (profile?.name || profile?.id) {
      console.log(`[Instagram] Token associado a ${profile.name || profile.id}.`);
    }
    const pageId = await resolveFacebookPageId();
    if (pageId) state.pageId = pageId;
  } catch (err) {
    console.warn('[Instagram] Não foi possível resolver a Page ID:', err.message);
  }

  try {
    const ig = await fetchInstagramAccount(state.igUserId);
    state.username = ig?.username || ig?.name || '';
    console.log(
      `[Instagram] Conta @${state.username || state.igUserId} pronta para publicação.`,
    );
  } catch (err) {
    state.lastError = state.lastError || err.message;
    console.error('[Instagram] Conta comercial:', err.message);
  }

  if (!state.webhookConfigured) {
    console.warn(
      '[Instagram] Webhook incompleto. Defina META_APP_SECRET e META_WEBHOOK_VERIFY_TOKEN.',
    );
  }

  if (isPublicAppUrlConfigured()) {
    console.log('[Instagram] PUBLIC_APP_URL configurado para proxy de imagem.');
  } else {
    console.warn(
      '[Instagram] PUBLIC_APP_URL em falta — ao publicar pelo localhost, defina no .env o domínio HTTPS de produção.',
    );
  }

  state.checkedAt = new Date().toISOString();
  return getInstagramPublicState();
}

export async function publishProductToInstagram({
  product,
  caption,
  idUsers,
  publicAppBaseUrl,
  publicAppOriginHint = '',
}) {
  assertInstagramPublishReady();

  const publicBase = resolvePublicAppBaseUrl(
    publicAppBaseUrl || '',
    publicAppOriginHint,
  );
  await downloadProductImage(product.image_link);
  const imageUrl = buildInstagramProxyImageUrl(product, publicBase);

  const igUserId = config.instagramBusinessAccountId;
  const account = await getOrCreateDefaultInstagramAccount({
    facebookPageId: state.pageId || config.facebookPageId,
  });

  let container;
  try {
    container = await createImageContainer({
      imageUrl,
      caption,
      igUserId,
    });
  } catch (err) {
    throw mapInstagramMediaFetchError(err);
  }
  const creationId = container?.id;
  if (!creationId) {
    const err = new Error('A Meta não devolveu o contentor da publicação.');
    err.status = 502;
    throw err;
  }

  await waitForContainer(creationId);

  const published = await publishMediaContainer({
    igUserId,
    creationId,
  });
  const mediaId = published?.id;
  if (!mediaId) {
    const err = new Error('A Meta não devolveu o ID da publicação.');
    err.status = 502;
    throw err;
  }

  const media = await fetchMediaPermalink(mediaId);
  const post = await insertInstagramPost({
    id_instagram_account: account.id_instagram_account,
    id_product: product.id_product,
    id_users: idUsers,
    ig_container_id: String(creationId),
    ig_media_id: String(mediaId),
    caption,
    permalink: media?.permalink || null,
    published_at: media?.timestamp || new Date().toISOString(),
  });

  let updatedProduct = product;
  try {
    updatedProduct = await updateProductForUser(product.id_product, idUsers, {
      instagram_sent: post.published_at || new Date().toISOString(),
    });
  } catch (err) {
    console.warn('[Instagram] Não foi possível gravar instagram_sent:', err.message);
  }

  return { product: updatedProduct, post };
}

export async function getProductInstagramPosts(idProduct) {
  return listInstagramPostsForProduct(idProduct);
}

const COMMENT_FIELDS = new Set(['comments', 'live_comments']);

function parseCommentChangeValue(value) {
  if (!value || typeof value !== 'object') return null;
  const text = value.text ?? value.message ?? value.comment_text ?? '';
  const commentId = value.id || value.comment_id;
  const commenterId =
    value.from?.id || value.from?.username || value.igsid || value.sender_id || '';
  const mediaId = value.media?.id || value.media_id || value.post_id || value.media?.media_id;
  if (!commentId) return null;
  return {
    commentId: String(commentId),
    commenterId: String(commenterId || ''),
    text: String(text || ''),
    mediaId: mediaId ? String(mediaId) : '',
  };
}

function extractCommentEvents(body) {
  const events = [];
  const entries = Array.isArray(body?.entry) ? body.entry : [];
  for (const entry of entries) {
    const changes = Array.isArray(entry?.changes) ? entry.changes : [];
    for (const change of changes) {
      const field = String(change?.field || '').toLowerCase();
      if (!COMMENT_FIELDS.has(field)) continue;
      const parsed = parseCommentChangeValue(change.value);
      if (parsed) events.push(parsed);
    }
  }
  return events;
}

function summarizeWebhookResults(results) {
  const summary = { sent: 0, skipped: 0, failed: 0, reasons: {} };
  for (const item of results) {
    if (item?.sent) summary.sent += 1;
    else if (item?.failed) summary.failed += 1;
    else summary.skipped += 1;
    const reason = item?.reason || (item?.failed ? 'failed' : item?.sent ? 'sent' : 'unknown');
    summary.reasons[reason] = (summary.reasons[reason] || 0) + 1;
  }
  return summary;
}

export async function handleInstagramCommentEvent(event) {
  if (!commentContainsQuero(event.text)) return { skipped: true, reason: 'no_match' };

  const mediaId = event.mediaId;
  if (!mediaId) return { skipped: true, reason: 'no_media' };

  const post = await findInstagramPostByMediaId(mediaId);
  if (!post) return { skipped: true, reason: 'unknown_media' };

  if (event.commenterId && event.commenterId === String(config.instagramBusinessAccountId)) {
    return { skipped: true, reason: 'own_comment' };
  }

  const product = await getProductForUser(post.id_product, post.id_users);
  if (!product) return { skipped: true, reason: 'product_missing' };

  const commenterId = event.commenterId || `comment:${event.commentId}`;
  const claimed = await insertCommentDm({
    id_instagram_post: post.id_instagram_post,
    ig_comment_id: event.commentId,
    ig_commenter_id: commenterId,
    comment_text: event.text,
    matched: true,
    dm_status: 'pending',
  });

  if (!claimed.ok) {
    return { skipped: true, reason: claimed.reason };
  }

  try {
    await sendPrivateReply({
      commentId: event.commentId,
      message: buildInstagramDmText(product),
      pageId: state.pageId || config.facebookPageId,
    });
    await updateCommentDm(claimed.row.id_instagram_comment_dm, {
      dm_status: 'sent',
      processed_at: new Date().toISOString(),
    });
    return { sent: true, commentId: event.commentId };
  } catch (err) {
    await updateCommentDm(claimed.row.id_instagram_comment_dm, {
      dm_status: 'failed',
      dm_error: err.message || 'Falha no Direct',
      processed_at: new Date().toISOString(),
    });
    console.error('[Instagram] private reply', event.commentId, err.message);
    return { failed: true, error: err.message };
  }
}

export async function processInstagramWebhookBody(body) {
  const objectType = String(body?.object || 'unknown');
  const events = extractCommentEvents(body);
  const entryFields = [];
  for (const entry of body?.entry ?? []) {
    for (const change of entry?.changes ?? []) {
      if (change?.field) entryFields.push(String(change.field));
    }
  }

  console.log(
    `[Instagram] webhook object=${objectType} commentEvents=${events.length} fields=${entryFields.join(',') || 'none'}`,
  );

  if (events.length === 0 && entryFields.length > 0) {
    console.warn(
      '[Instagram] webhook recebido mas nenhum evento comments parseado. Confirme assinatura do campo "comments" na Meta.',
    );
  }

  const results = [];
  for (const event of events) {
    try {
      const result = await handleInstagramCommentEvent(event);
      results.push(result);
      if (result?.sent) {
        console.log(`[Instagram] DM enviada commentId=${event.commentId} mediaId=${event.mediaId}`);
      } else if (result?.skipped) {
        console.log(
          `[Instagram] comentário ignorado reason=${result.reason} commentId=${event.commentId}`,
        );
      } else if (result?.failed) {
        console.error(
          `[Instagram] falha DM commentId=${event.commentId} error=${result.error}`,
        );
      }
    } catch (err) {
      console.error('[Instagram] webhook comment', err);
      results.push({ failed: true, error: err.message });
    }
  }

  state.lastWebhook = {
    at: new Date().toISOString(),
    object: objectType,
    fields: entryFields,
    eventCount: events.length,
    summary: summarizeWebhookResults(results),
  };

  return results;
}
