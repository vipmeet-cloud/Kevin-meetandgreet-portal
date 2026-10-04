import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { Database } from '../types/database';

// Global reference for Supabase client
let supabaseInstance: SupabaseClient<Database> | null = null;

// Storage key for user-provided runtime config if env vars are pending
const RUNTIME_SUPABASE_URL_KEY = 'vip_portal_supabase_url';
const RUNTIME_SUPABASE_ANON_KEY = 'vip_portal_supabase_anon_key';

export function getSupabaseCredentials(): { url: string; anonKey: string; isConfigured: boolean; source: 'env' | 'runtime' | 'missing' } {
  const envUrl = import.meta.env.VITE_SUPABASE_URL;
  const envAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

  if (envUrl && envAnonKey && !envUrl.includes('your-project-id') && !envAnonKey.includes('your-anon-public-key')) {
    return {
      url: envUrl.trim(),
      anonKey: envAnonKey.trim(),
      isConfigured: true,
      source: 'env'
    };
  }

  // Check if runtime credentials were provided via the management portal setup assistant
  if (typeof window !== 'undefined') {
    const runtimeUrl = sessionStorage.getItem(RUNTIME_SUPABASE_URL_KEY);
    const runtimeKey = sessionStorage.getItem(RUNTIME_SUPABASE_ANON_KEY);
    if (runtimeUrl && runtimeKey) {
      return {
        url: runtimeUrl.trim(),
        anonKey: runtimeKey.trim(),
        isConfigured: true,
        source: 'runtime'
      };
    }
  }

  return {
    url: '',
    anonKey: '',
    isConfigured: false,
    source: 'missing'
  };
}

export function setRuntimeSupabaseCredentials(url: string, anonKey: string): boolean {
  if (typeof window === 'undefined') return false;
  if (!url || !anonKey) return false;
  
  sessionStorage.setItem(RUNTIME_SUPABASE_URL_KEY, url.trim());
  sessionStorage.setItem(RUNTIME_SUPABASE_ANON_KEY, anonKey.trim());
  // Invalidate previous instance so new credentials take effect
  supabaseInstance = null;
  return true;
}

export function clearRuntimeSupabaseCredentials(): void {
  if (typeof window === 'undefined') return;
  sessionStorage.removeItem(RUNTIME_SUPABASE_URL_KEY);
  sessionStorage.removeItem(RUNTIME_SUPABASE_ANON_KEY);
  supabaseInstance = null;
}

export function isSupabaseConfigured(): boolean {
  return getSupabaseCredentials().isConfigured;
}

export function getMissingEnvVars(): string[] {
  const missing: string[] = [];
  const creds = getSupabaseCredentials();
  if (!creds.isConfigured) {
    if (!import.meta.env.VITE_SUPABASE_URL) missing.push('VITE_SUPABASE_URL');
    if (!import.meta.env.VITE_SUPABASE_ANON_KEY) missing.push('VITE_SUPABASE_ANON_KEY');
  }
  return missing;
}

export function getSupabaseClient(): SupabaseClient<Database> | null {
  const creds = getSupabaseCredentials();
  if (!creds.isConfigured) {
    return null;
  }

  if (!supabaseInstance) {
    supabaseInstance = createClient<Database>(creds.url, creds.anonKey, {
      auth: {
        persistSession: true,
        autoRefreshToken: true,
        detectSessionInUrl: true,
      }
    });
  }

  return supabaseInstance;
}
