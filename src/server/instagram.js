import {
  config,
  isInstagramConfigured,
  isInstagramWebhookConfigured,
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
    username: state.username,
    lastError: state.lastError,
    checkedAt: state.checkedAt,
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

  state.checkedAt = new Date().toISOString();
  return getInstagramPublicState();
}

export async function publishProductToInstagram({
  product,
  caption,
  idUsers,
  publicAppBaseUrl,
}) {
  assertInstagramPublishReady();

  const publicBase = resolvePublicAppBaseUrl(publicAppBaseUrl || '');
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

function extractCommentEvents(body) {
  const events = [];
  const entries = Array.isArray(body?.entry) ? body.entry : [];
  for (const entry of entries) {
    const changes = Array.isArray(entry?.changes) ? entry.changes : [];
    for (const change of changes) {
      if (String(change?.field || '') !== 'comments') continue;
      const value = change.value || {};
      const text = value.text ?? value.message ?? '';
      const commentId = value.id || value.comment_id;
      const commenterId =
        value.from?.id || value.from?.username || value.igsid || '';
      const mediaId = value.media?.id || value.media_id || value.post_id;
      if (!commentId) continue;
      events.push({
        commentId: String(commentId),
        commenterId: String(commenterId || ''),
        text: String(text || ''),
        mediaId: mediaId ? String(mediaId) : '',
      });
    }
  }
  return events;
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
  const events = extractCommentEvents(body);
  const results = [];
  for (const event of events) {
    try {
      results.push(await handleInstagramCommentEvent(event));
    } catch (err) {
      console.error('[Instagram] webhook comment', err);
      results.push({ failed: true, error: err.message });
    }
  }
  return results;
}
