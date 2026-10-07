import { SupabaseClient } from '@supabase/supabase-js';
import {
  getSupabaseClient,
  isSupabaseConfigured as isServiceConfigured,
  getSupabaseCredentials,
  setRuntimeSupabaseCredentials,
  clearRuntimeSupabaseCredentials,
} from '../services/supabase';

export function isSupabaseConfigured(): boolean {
  return isServiceConfigured();
}

export function getSupabaseUrl(): string {
  return getSupabaseCredentials().url;
}

export function setCustomSupabaseConfig(url: string, anonKey: string): void {
  setRuntimeSupabaseCredentials(url, anonKey);
}

export function clearCustomSupabaseConfig(): void {
  clearRuntimeSupabaseCredentials();
}

export function getSupabase(): SupabaseClient | null {
  return getSupabaseClient() as SupabaseClient | null;
}
