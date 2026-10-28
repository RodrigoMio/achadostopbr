function trimEnv(value) {
  return String(value || '').trim();
}

export const config = {
  port: Number(process.env.PORT) || 3000,
  authPath: process.env.AUTH_PATH || 'auth_info',
  sessionSecret: process.env.SESSION_SECRET || '',
  supabaseUrl: process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL || '',
  supabaseServiceRoleKey: process.env.SUPABASE_SERVICE_ROLE_KEY || '',
  geminiApiKey: process.env.GEMINI_API_KEY || '',
  /** ID do modelo (obrigatório na API). Use `auto` para o alias gemini-flash-latest. */
  geminiModel: process.env.GEMINI_MODEL || 'gemini-3.6-flash',
  geminiModelFallbacks:
    process.env.GEMINI_MODEL_FALLBACKS || 'gemini-3.5-flash-lite,gemini-3.6-flash,gemini-3.8-flash',
  // Referências estáticas: o bundler do Next.js só injeta process.env.NOME_LITERAL.
  metaAccessToken: trimEnv(process.env.META_ACCESS_TOKEN),
  metaAppSecret: trimEnv(
    process.env.META_APP_SECRET ||
      process.env.FACEBOOK_APP_SECRET ||
      process.env.INSTAGRAM_APP_SECRET,
  ),
  metaWebhookVerifyToken: trimEnv(
    process.env.META_WEBHOOK_VERIFY_TOKEN ||
      process.env.WEBHOOK_VERIFY_TOKEN ||
      process.env.INSTAGRAM_VERIFY_TOKEN,
  ),
  instagramBusinessAccountId: trimEnv(process.env.INSTAGRAM_BUSINESS_ACCOUNT_ID),
  facebookPageId: trimEnv(
    process.env.FACEBOOK_PAGE_ID || process.env.META_PAGE_ID || process.env.PAGE_ID,
  ),
  metaGraphVersion: trimEnv(process.env.META_GRAPH_API_VERSION) || 'v21.0',
  metaGraphHost: trimEnv(process.env.META_GRAPH_HOST) || 'https://graph.facebook.com',
};

export function getGeminiModelCandidates() {
  const primaryRaw = config.geminiModel.trim();
  const primary =
    primaryRaw === 'auto' || primaryRaw === 'latest' ? 'gemini-flash-latest' : primaryRaw;
  const fallbacks = config.geminiModelFallbacks
    .split(',')
    .map((item) => item.trim())
    .filter(Boolean);
  return [...new Set([primary, ...fallbacks])];
}

export function isSupabaseConfigured() {
  return Boolean(config.supabaseUrl && config.supabaseServiceRoleKey);
}

export function isGeminiConfigured() {
  return Boolean(config.geminiApiKey);
}

/** Railway/vitrine: não inicia Baileys. Nunca ligue no localhost do admin. */
export function isPublicOnly() {
  const value = String(process.env.PUBLIC_ONLY || '').trim().toLowerCase();
  return value === 'true' || value === '1' || value === 'yes';
}

export function isInstagramConfigured() {
  return Boolean(config.metaAccessToken && config.instagramBusinessAccountId);
}

export function isInstagramWebhookConfigured() {
  return Boolean(config.metaAppSecret && config.metaWebhookVerifyToken);
}

export function getMetaGraphBaseUrl() {
  const host = config.metaGraphHost.replace(/\/+$/, '');
  const version = config.metaGraphVersion.replace(/^\/+|\/+$/g, '');
  return `${host}/${version}`;
}
