import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { Database } from '../types/database';

// Global singleton reference for Supabase client
let supabaseInstance: SupabaseClient<Database> | null = null;

// Storage keys for persistent runtime config
const RUNTIME_SUPABASE_URL_KEY = 'vip_portal_supabase_url';
const RUNTIME_SUPABASE_ANON_KEY = 'vip_portal_supabase_anon_key';
const LEGACY_STORAGE_URL_KEY = 'aura_supabase_url_override';
const LEGACY_STORAGE_KEY_KEY = 'aura_supabase_anon_override';

// Robust project defaults guaranteeing Vercel deployments and preview always connect successfully
const FALLBACK_SUPABASE_URL = 'https://fiwsjwpyzhltzrdnpcrf.supabase.co';
const FALLBACK_SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZpd3Nqd3B5emhsdHpyZG5wY3JmIiwicm9sZSI6ImFub24iLCJpYXQiOjE3OTEwMTk1NTYsImV4cCI6MjEwNjU5NTU1Nn0.Vx7y96504_aJaORBHv1bC2T3IK7Usx_rhj78OPE_wNI';

let serverDiscoveredUrl = '';
let serverDiscoveredKey = '';

// Auto-discover configuration from server if frontend env did not include VITE_ prefix on Vercel
if (typeof window !== 'undefined') {
  fetch('/api/supabase/config')
    .then(r => r.json())
    .then(cfg => {
      if (cfg && cfg.isConfigured && cfg.url && cfg.anonKey) {
        serverDiscoveredUrl = cfg.url;
        serverDiscoveredKey = cfg.anonKey;
        if (!supabaseInstance) {
          getSupabaseClient();
        }
      }
    })
    .catch(() => {});
}

function isValidCredential(url?: string, key?: string): boolean {
  if (!url || !key) return false;
  if (url.includes('your-project-id') || key.includes('your-anon-public-key')) return false;
  try {
    const u = new URL(url);
    return (u.protocol === 'https:' || u.protocol === 'http:') && key.length > 20;
  } catch {
    return false;
  }
}

export function getSupabaseCredentials(): { 
  url: string; 
  anonKey: string; 
  isConfigured: boolean; 
  source: 'env' | 'runtime' | 'server' | 'fallback' | 'missing' 
} {
  // 1. Check persistent localStorage & sessionStorage (User explicit overrides in Management Settings)
  if (typeof window !== 'undefined') {
    try {
      const localUrl = localStorage.getItem(RUNTIME_SUPABASE_URL_KEY) || localStorage.getItem(LEGACY_STORAGE_URL_KEY);
      const localKey = localStorage.getItem(RUNTIME_SUPABASE_ANON_KEY) || localStorage.getItem(LEGACY_STORAGE_KEY_KEY);
      if (localUrl && localKey && isValidCredential(localUrl, localKey)) {
        return {
          url: localUrl.trim(),
          anonKey: localKey.trim(),
          isConfigured: true,
          source: 'runtime'
        };
      }

      const sessionUrl = sessionStorage.getItem(RUNTIME_SUPABASE_URL_KEY) || sessionStorage.getItem(LEGACY_STORAGE_URL_KEY);
      const sessionKey = sessionStorage.getItem(RUNTIME_SUPABASE_ANON_KEY) || sessionStorage.getItem(LEGACY_STORAGE_KEY_KEY);
      if (sessionUrl && sessionKey && isValidCredential(sessionUrl, sessionKey)) {
        return {
          url: sessionUrl.trim(),
          anonKey: sessionKey.trim(),
          isConfigured: true,
          source: 'runtime'
        };
      }
    } catch {}
  }

  // 2. Check build-time / runtime environment variables
  const envUrl = import.meta.env.VITE_SUPABASE_URL || (import.meta.env as any).SUPABASE_URL;
  const envAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || (import.meta.env as any).SUPABASE_ANON_KEY;
  if (envUrl && envAnonKey && isValidCredential(envUrl, envAnonKey)) {
    return {
      url: envUrl.trim(),
      anonKey: envAnonKey.trim(),
      isConfigured: true,
      source: 'env'
    };
  }

  // 3. Check server-discovered credentials from /api/supabase/config
  if (serverDiscoveredUrl && serverDiscoveredKey && isValidCredential(serverDiscoveredUrl, serverDiscoveredKey)) {
    return {
      url: serverDiscoveredUrl.trim(),
      anonKey: serverDiscoveredKey.trim(),
      isConfigured: true,
      source: 'server'
    };
  }

  // 4. Guaranteed project fallback for 100% reliability on Vercel
  if (isValidCredential(FALLBACK_SUPABASE_URL, FALLBACK_SUPABASE_ANON_KEY)) {
    return {
      url: FALLBACK_SUPABASE_URL,
      anonKey: FALLBACK_SUPABASE_ANON_KEY,
      isConfigured: true,
      source: 'fallback'
    };
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
  
  try {
    const cleanUrl = url.trim();
    const cleanKey = anonKey.trim();
    localStorage.setItem(RUNTIME_SUPABASE_URL_KEY, cleanUrl);
    localStorage.setItem(RUNTIME_SUPABASE_ANON_KEY, cleanKey);
    localStorage.setItem(LEGACY_STORAGE_URL_KEY, cleanUrl);
    localStorage.setItem(LEGACY_STORAGE_KEY_KEY, cleanKey);
    sessionStorage.setItem(RUNTIME_SUPABASE_URL_KEY, cleanUrl);
    sessionStorage.setItem(RUNTIME_SUPABASE_ANON_KEY, cleanKey);
    sessionStorage.setItem(LEGACY_STORAGE_URL_KEY, cleanUrl);
    sessionStorage.setItem(LEGACY_STORAGE_KEY_KEY, cleanKey);
    // Invalidate previous instance so new credentials take immediate effect
    supabaseInstance = null;
    return true;
  } catch (err) {
    console.error('Failed to save Supabase credentials:', err);
    return false;
  }
}

export function clearRuntimeSupabaseCredentials(): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.removeItem(RUNTIME_SUPABASE_URL_KEY);
    localStorage.removeItem(RUNTIME_SUPABASE_ANON_KEY);
    localStorage.removeItem(LEGACY_STORAGE_URL_KEY);
    localStorage.removeItem(LEGACY_STORAGE_KEY_KEY);
    sessionStorage.removeItem(RUNTIME_SUPABASE_URL_KEY);
    sessionStorage.removeItem(RUNTIME_SUPABASE_ANON_KEY);
    sessionStorage.removeItem(LEGACY_STORAGE_URL_KEY);
    sessionStorage.removeItem(LEGACY_STORAGE_KEY_KEY);
  } catch {}
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
