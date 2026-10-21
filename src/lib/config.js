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
