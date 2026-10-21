import { createClient } from '@supabase/supabase-js';
import { config, isSupabaseConfigured } from './config.js';

export function getServiceClient() {
  if (!isSupabaseConfigured()) {
    throw new Error('Supabase não configurado. Defina SUPABASE_URL e SUPABASE_SERVICE_ROLE_KEY.');
  }

  return createClient(config.supabaseUrl, config.supabaseServiceRoleKey, {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
    },
  });
}
