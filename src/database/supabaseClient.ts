import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { Database } from '../types/database';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;
const forceMock = import.meta.env.VITE_USE_MOCK_AUTH === 'true' || import.meta.env.VITE_USE_MOCK_DATABASE === 'true';

export const isSupabaseConfigured = Boolean(supabaseUrl && supabaseAnonKey && !forceMock);

// Safe diagnostic info: only logs booleans, never logs secret values, keys, or URLs
console.info('[Supabase Init Config]', {
  hasUrl: Boolean(supabaseUrl),
  hasAnonKey: Boolean(supabaseAnonKey),
  forceMock: Boolean(forceMock),
  isSupabaseConfigured,
});

export const supabase: SupabaseClient<any> | null = isSupabaseConfigured
  ? createClient<any>(supabaseUrl as string, supabaseAnonKey as string, {
      auth: {
        autoRefreshToken: true,
        persistSession: true,
        detectSessionInUrl: true,
      },
    })
  : null;
