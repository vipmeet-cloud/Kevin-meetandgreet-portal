import { createClient, SupabaseClient } from '@supabase/supabase-js';

// Environment variable extraction
const envUrl = import.meta.env.VITE_SUPABASE_URL || '';
const envAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || '';

// Session storage keys for local dev testing if environment variables cannot be modified directly
const STORAGE_URL_KEY = 'aura_supabase_url_override';
const STORAGE_KEY_KEY = 'aura_supabase_anon_override';

function getActiveUrl(): string {
  try {
    const sessionUrl = sessionStorage.getItem(STORAGE_URL_KEY);
    if (sessionUrl && sessionUrl.trim().length > 0) return sessionUrl.trim();
  } catch {
    // sessionStorage unavailable
  }
  return envUrl.trim();
}

function getActiveAnonKey(): string {
  try {
    const sessionKey = sessionStorage.getItem(STORAGE_KEY_KEY);
    if (sessionKey && sessionKey.trim().length > 0) return sessionKey.trim();
  } catch {
    // sessionStorage unavailable
  }
  return envAnonKey.trim();
}

export function isSupabaseConfigured(): boolean {
  const url = getActiveUrl();
  const key = getActiveAnonKey();
  
  if (!url || !key) return false;
  if (url.includes('your-project-id.supabase.co')) return false;
  if (key.includes('your-anon-public-key-here')) return false;
  
  try {
    const parsed = new URL(url);
    return parsed.protocol === 'https:' || parsed.protocol === 'http:';
  } catch {
    return false;
  }
}

export function getSupabaseUrl(): string {
  return getActiveUrl();
}

export function setCustomSupabaseConfig(url: string, anonKey: string): void {
  try {
    sessionStorage.setItem(STORAGE_URL_KEY, url);
    sessionStorage.setItem(STORAGE_KEY_KEY, anonKey);
    // Reload client instance
    activeClient = null;
  } catch (err) {
    console.error('Failed to save session Supabase configuration', err);
  }
}

export function clearCustomSupabaseConfig(): void {
  try {
    sessionStorage.removeItem(STORAGE_URL_KEY);
    sessionStorage.removeItem(STORAGE_KEY_KEY);
    activeClient = null;
  } catch (err) {
    console.error('Failed to clear session Supabase configuration', err);
  }
}

let activeClient: SupabaseClient | null = null;

export function getSupabase(): SupabaseClient | null {
  if (activeClient) return activeClient;
  
  if (!isSupabaseConfigured()) {
    return null;
  }
  
  try {
    const url = getActiveUrl();
    const key = getActiveAnonKey();
    activeClient = createClient(url, key, {
      auth: {
        autoRefreshToken: true,
        persistSession: true,
        detectSessionInUrl: true,
      },
    });
    return activeClient;
  } catch (err) {
    console.error('Failed to initialize Supabase client:', err);
    return null;
  }
}
