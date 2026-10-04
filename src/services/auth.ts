import { User, Session, AuthChangeEvent } from '@supabase/supabase-js';
import { getSupabaseClient } from './supabase';
import { ManagementUserProfile } from '../types/auth';

export const PRIMARY_MANAGEMENT_CREDENTIALS = {
  email: 'management.meet.greet@gmail.com',
  aliasEmail: 'management.meet&greet@gmail.com',
  password: 'Management@KevinCostner2026',
  profile: {
    id: 'admin_primary_management_001',
    email: 'management.meet.greet@gmail.com',
    full_name: 'Kevin Costner Event Management',
    role: 'administrator' as const,
    created_at: '2026-01-01T00:00:00.000Z',
    updated_at: '2026-01-01T00:00:00.000Z',
  }
};

const LOCAL_SESSION_KEY = 'vip_portal_management_session';

export function getStoredManagementSession(): { user: User; session: Session; profile: ManagementUserProfile } | null {
  try {
    const raw = localStorage.getItem(LOCAL_SESSION_KEY);
    if (raw) return JSON.parse(raw);
  } catch {}
  return null;
}

export function saveStoredManagementSession(data: { user: User; session: Session; profile: ManagementUserProfile }) {
  try {
    localStorage.setItem(LOCAL_SESSION_KEY, JSON.stringify(data));
  } catch {}
}

export function clearStoredManagementSession() {
  try {
    localStorage.removeItem(LOCAL_SESSION_KEY);
  } catch {}
}

export async function loginManagement(
  email: string,
  password: string
): Promise<{ user: User | null; session: Session | null; profile: ManagementUserProfile | null; error: string | null }> {
  const cleanEmail = email.trim().toLowerCase();
  const supabase = getSupabaseClient();

  // 1. Check if matches Primary Configured Management Credentials
  const isPrimaryEmailMatch =
    cleanEmail === PRIMARY_MANAGEMENT_CREDENTIALS.email.toLowerCase() ||
    cleanEmail === PRIMARY_MANAGEMENT_CREDENTIALS.aliasEmail.toLowerCase();
  const isPrimaryPasswordMatch = password === PRIMARY_MANAGEMENT_CREDENTIALS.password;

  if (isPrimaryEmailMatch && isPrimaryPasswordMatch) {
    const primaryUser: User = {
      id: PRIMARY_MANAGEMENT_CREDENTIALS.profile.id,
      app_metadata: { provider: 'email' },
      user_metadata: { full_name: PRIMARY_MANAGEMENT_CREDENTIALS.profile.full_name },
      aud: 'authenticated',
      created_at: PRIMARY_MANAGEMENT_CREDENTIALS.profile.created_at,
      email: PRIMARY_MANAGEMENT_CREDENTIALS.email,
      phone: '',
      role: 'authenticated',
      updated_at: PRIMARY_MANAGEMENT_CREDENTIALS.profile.updated_at,
    };

    const primarySession: Session = {
      access_token: `admin_session_${Date.now()}`,
      token_type: 'bearer',
      expires_in: 86400 * 7,
      expires_at: Math.floor(Date.now() / 1000) + 86400 * 7,
      refresh_token: `admin_refresh_${Date.now()}`,
      user: primaryUser,
    };

    const result = {
      user: primaryUser,
      session: primarySession,
      profile: PRIMARY_MANAGEMENT_CREDENTIALS.profile,
      error: null
    };

    saveStoredManagementSession(result);

    // Attempt background Supabase sign-in if connected
    if (supabase) {
      try {
        await supabase.auth.signInWithPassword({ email: cleanEmail, password });
      } catch {}
    }

    return result;
  }

  // 2. If Supabase is connected, attempt remote sign-in
  if (supabase) {
    try {
      const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
        email: cleanEmail,
        password,
      });

      if (authError) {
        if (authError.message.includes('Invalid login credentials')) {
          return { user: null, session: null, profile: null, error: 'Invalid management email or password.' };
        }
        return { user: null, session: null, profile: null, error: authError.message };
      }

      if (!authData.user) {
        return { user: null, session: null, profile: null, error: 'Authentication failed. Please try again.' };
      }

      // Query management_users table with RLS
      const { data: managementData, error: managementError } = await supabase
        .from('management_users')
        .select('id, email, full_name, role, created_at, updated_at')
        .eq('id', authData.user.id)
        .maybeSingle();

      if (managementError || !managementData) {
        await supabase.auth.signOut();
        return {
          user: null,
          session: null,
          profile: null,
          error: 'Unauthorized. This account does not possess authorized management privileges.'
        };
      }

      const result = {
        user: authData.user,
        session: authData.session,
        profile: managementData as ManagementUserProfile,
        error: null
      };

      saveStoredManagementSession(result);
      return result;
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'An unexpected error occurred during management sign-in.';
      return { user: null, session: null, profile: null, error: message };
    }
  }

  return {
    user: null,
    session: null,
    profile: null,
    error: 'Invalid management email or password.'
  };
}

export async function fetchCurrentManagementProfile(): Promise<ManagementUserProfile | null> {
  const stored = getStoredManagementSession();
  if (stored) return stored.profile;

  const supabase = getSupabaseClient();
  if (!supabase) return null;

  try {
    const { data: sessionData } = await supabase.auth.getSession();
    if (!sessionData.session?.user) return null;

    const { data, error } = await supabase
      .from('management_users')
      .select('id, email, full_name, role, created_at, updated_at')
      .eq('id', sessionData.session.user.id)
      .maybeSingle();

    if (error || !data) return null;
    return data as ManagementUserProfile;
  } catch {
    return null;
  }
}

export async function logoutManagement(): Promise<{ error: string | null }> {
  clearStoredManagementSession();
  const supabase = getSupabaseClient();
  if (!supabase) return { error: null };

  try {
    const { error } = await supabase.auth.signOut();
    return { error: error ? error.message : null };
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Sign-out error';
    return { error: message };
  }
}

export function subscribeToAuthChanges(
  callback: (event: AuthChangeEvent, session: Session | null) => void
): { unsubscribe: () => void } {
  const supabase = getSupabaseClient();
  if (!supabase) {
    return { unsubscribe: () => {} };
  }

  const { data: { subscription } } = supabase.auth.onAuthStateChange(callback);
  return {
    unsubscribe: () => subscription.unsubscribe()
  };
}
