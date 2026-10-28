import { config, getMetaGraphBaseUrl, isInstagramConfigured } from './config.js';

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export function graphErrorMessage(payload, fallback = 'Falha na API do Instagram.') {
  const message = payload?.error?.message || payload?.error?.error_user_msg;
  return message ? String(message) : fallback;
}

export function createGraphError(payload, fallback) {
  const err = new Error(graphErrorMessage(payload, fallback));
  err.status = 400;
  err.graphCode = payload?.error?.code;
  err.graphSubcode = payload?.error?.error_subcode;
  return err;
}

async function parseGraphResponse(response) {
  let payload = {};
  try {
    payload = await response.json();
  } catch {
    payload = {};
  }
  if (!response.ok || payload?.error) {
    throw createGraphError(payload, `Instagram Graph API ${response.status}`);
  }
  return payload;
}

export async function graphRequest({
  method = 'GET',
  path,
  search = {},
  body,
  token = config.metaAccessToken,
}) {
  if (!token) {
    const err = new Error('META_ACCESS_TOKEN não configurado.');
    err.status = 500;
    throw err;
  }

  const url = new URL(`${getMetaGraphBaseUrl()}/${String(path).replace(/^\/+/, '')}`);
  for (const [key, value] of Object.entries(search)) {
    if (value == null || value === '') continue;
    url.searchParams.set(key, String(value));
  }
  url.searchParams.set('access_token', token);

  const init = { method, headers: { Accept: 'application/json' } };
  if (body != null && method !== 'GET') {
    init.headers['Content-Type'] = 'application/json';
    init.body = JSON.stringify(body);
  }

  const response = await fetch(url, init);
  return parseGraphResponse(response);
}

export async function graphFormPost({
  path,
  fields = {},
  token = config.metaAccessToken,
}) {
  if (!token) {
    const err = new Error('META_ACCESS_TOKEN não configurado.');
    err.status = 500;
    throw err;
  }

  const url = new URL(`${getMetaGraphBaseUrl()}/${String(path).replace(/^\/+/, '')}`);
  url.searchParams.set('access_token', token);
  const body = new URLSearchParams();
  for (const [key, value] of Object.entries(fields)) {
    if (value == null) continue;
    body.set(key, String(value));
  }

  const response = await fetch(url, {
    method: 'POST',
    headers: {
      Accept: 'application/json',
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body,
  });
  return parseGraphResponse(response);
}

export async function fetchGrantedPermissions(token = config.metaAccessToken) {
  const payload = await graphRequest({
    path: 'me/permissions',
    token,
  });
  return (payload.data || [])
    .filter((item) => String(item?.status).toLowerCase() === 'granted')
    .map((item) => String(item.permission || '').trim())
    .filter(Boolean);
}

export async function fetchTokenProfile(token = config.metaAccessToken) {
  return graphRequest({
    path: 'me',
    search: { fields: 'id,name' },
    token,
  });
}

export async function fetchInstagramAccount(igUserId = config.instagramBusinessAccountId) {
  return graphRequest({
    path: igUserId,
    search: { fields: 'id,username,name' },
  });
}

export async function resolveFacebookPageId(token = config.metaAccessToken) {
  if (config.facebookPageId) return config.facebookPageId;

  try {
    const accounts = await graphRequest({
      path: 'me/accounts',
      search: {
        fields: 'id,name,instagram_business_account',
      },
      token,
    });
    const igId = String(config.instagramBusinessAccountId);
    const match = (accounts.data || []).find(
      (page) => String(page?.instagram_business_account?.id || '') === igId,
    );
    if (match?.id) return String(match.id);
    if (accounts.data?.length === 1 && accounts.data[0]?.id) {
      return String(accounts.data[0].id);
    }
  } catch {
    /* user token sem pages ou já é page token */
  }

  try {
    const me = await graphRequest({
      path: 'me',
      search: { fields: 'id,name' },
      token,
    });
    if (me?.id) return String(me.id);
  } catch {
    /* ignore */
  }

  return '';
}

export async function createImageContainer({ imageUrl, caption, igUserId }) {
  return graphFormPost({
    path: `${igUserId}/media`,
    fields: {
      image_url: imageUrl,
      caption,
    },
  });
}

export async function waitForContainer(creationId, { attempts = 12, delayMs = 1000 } = {}) {
  let lastStatus = '';
  for (let index = 0; index < attempts; index += 1) {
    const payload = await graphRequest({
      path: creationId,
      search: { fields: 'status_code' },
    });
    lastStatus = String(payload.status_code || '').toUpperCase();
    if (lastStatus === 'FINISHED' || lastStatus === '') return payload;
    if (lastStatus === 'ERROR' || lastStatus === 'EXPIRED') {
      const err = new Error('A Meta recusou o contentor da imagem do Instagram.');
      err.status = 400;
      throw err;
    }
    await sleep(delayMs);
  }
  const err = new Error(
    `A imagem ainda não ficou pronta no Instagram (${lastStatus || 'IN_PROGRESS'}). Tente de novo.`,
  );
  err.status = 408;
  throw err;
}

export async function publishMediaContainer({ igUserId, creationId }) {
  return graphFormPost({
    path: `${igUserId}/media_publish`,
    fields: { creation_id: creationId },
  });
}

export async function fetchMediaPermalink(mediaId) {
  try {
    return await graphRequest({
      path: mediaId,
      search: { fields: 'id,permalink,timestamp' },
    });
  } catch {
    return { id: mediaId, permalink: null, timestamp: null };
  }
}

export async function sendPrivateReply({ commentId, message, pageId }) {
  const recipient = { comment_id: commentId };
  const payload = { recipient, message: { text: message } };
  const target = pageId || 'me';

  try {
    return await graphRequest({
      method: 'POST',
      path: `${target}/messages`,
      body: payload,
    });
  } catch (err) {
    if (target !== 'me') {
      try {
        return await graphRequest({
          method: 'POST',
          path: 'me/messages',
          body: payload,
        });
      } catch {
        /* fallback abaixo */
      }
    }
    return graphRequest({
      method: 'POST',
      path: `${commentId}/private_replies`,
      body: { message },
    }).catch(() => {
      throw err;
    });
  }
}

export function assertInstagramPublishReady() {
  if (!isInstagramConfigured()) {
    const err = new Error(
      'Instagram não configurado. Defina META_ACCESS_TOKEN e INSTAGRAM_BUSINESS_ACCOUNT_ID.',
    );
    err.status = 500;
    throw err;
  }
}
