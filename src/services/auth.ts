import { User, Session, AuthChangeEvent } from '@supabase/supabase-js';
import { getSupabaseClient } from './supabase';
import { ManagementUserProfile } from '../types/auth';

/**
 * Standard authorized management credentials for reference & quick fill
 */
export const PRIMARY_MANAGEMENT_CREDENTIALS = {
  email: 'management.meet.greet@gmail.com',
  aliasEmail: 'management.meet&greet@gmail.com',
  password: 'Management@KevinCostner2026',
};

/**
 * Fetches the current management profile from Supabase for a given user UUID.
 * The relationship is strictly database-backed:
 *   public.management_users.user_id = auth.users.id
 *   public.profiles.id = auth.users.id
 */
export async function fetchCurrentManagementProfile(
  userId?: string,
  accessToken?: string
): Promise<ManagementUserProfile | null> {
  const supabase = getSupabaseClient();
  if (!supabase) return null;

  try {
    let targetUserId = userId;
    let targetEmail = '';
    let targetToken = accessToken;

    if (!targetUserId || !targetToken) {
      const { data: sessionData } = await supabase.auth.getSession();
      if (!sessionData.session?.user) {
        return null;
      }
      targetUserId = sessionData.session.user.id;
      targetEmail = sessionData.session.user.email || '';
      targetToken = sessionData.session.access_token;
    }

    if (!targetUserId) return null;

    // 1. Query public.management_users by user_id under Row-Level Security
    const { data: mgmtUser } = await (supabase.from('management_users') as any)
      .select('id, user_id, email, role, is_active, created_at, updated_at')
      .eq('user_id', targetUserId)
      .eq('is_active', true)
      .maybeSingle();

    // 2. Query public.profiles by id (which equals auth.users.id) under Row-Level Security
    const { data: profileRow } = await (supabase.from('profiles') as any)
      .select('id, email, full_name, avatar_url, phone_number, created_at, updated_at')
      .eq('id', targetUserId)
      .maybeSingle();

    // 3. If management_users record is present, return the fully formed profile
    if (mgmtUser && ['administrator', 'manager', 'coordinator', 'reviewer'].includes(mgmtUser.role)) {
      return {
        id: targetUserId,
        user_id: targetUserId,
        email: mgmtUser.email || targetEmail,
        full_name: profileRow?.full_name || 'Executive VIP Event Management',
        role: mgmtUser.role,
        created_at: profileRow?.created_at || mgmtUser.created_at,
        updated_at: profileRow?.updated_at || mgmtUser.updated_at,
        avatar_url: profileRow?.avatar_url || null,
        phone_number: profileRow?.phone_number || null,
      };
    }

    // 4. If management record is missing in database for authorized personnel, invoke server self-heal
    if (targetToken) {
      try {
        const res = await fetch('/api/auth/ensure-management', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${targetToken}`,
          },
          body: JSON.stringify({ token: targetToken }),
        });

        if (res.ok) {
          const result = await res.json();
          if (result.success && result.profile) {
            return {
              id: targetUserId,
              user_id: targetUserId,
              email: result.profile.email,
              full_name: result.profile.full_name || 'Executive VIP Event Management',
              role: result.profile.role || 'administrator',
              created_at: result.profile.created_at || new Date().toISOString(),
              updated_at: result.profile.updated_at || new Date().toISOString(),
              avatar_url: null,
              phone_number: null,
            };
          }
        }
      } catch {}
    }

    return null;
  } catch (err) {
    console.warn('Error fetching management profile from Supabase:', err);
    return null;
  }
}

/**
 * Authenticates the management user strictly against Supabase Auth.
 * Supabase Auth is the ONLY source of truth.
 */
export async function loginManagement(
  email: string,
  password: string
): Promise<{ 
  user: User | null; 
  session: Session | null; 
  profile: ManagementUserProfile | null; 
  error: string | null 
}> {
  const cleanEmail = email.trim().toLowerCase();
  const cleanPassword = password.trim();
  const supabase = getSupabaseClient();

  if (!supabase) {
    return {
      user: null,
      session: null,
      profile: null,
      error: 'Supabase client is not available. Please verify environment connection.',
    };
  }

  try {
    // 1. Authenticate with Supabase Auth
    const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
      email: cleanEmail,
      password: cleanPassword,
    });

    if (authError || !authData.user || !authData.session) {
      const msg = authError?.message || 'Invalid management credentials.';
      if (msg.toLowerCase().includes('invalid login credentials')) {
        return {
          user: null,
          session: null,
          profile: null,
          error: 'Invalid management email or password. Please verify credentials.',
        };
      }
      return {
        user: null,
        session: null,
        profile: null,
        error: msg,
      };
    }

    const authUser = authData.user;
    const authSession = authData.session;

    // 2. Obtain real database-backed management profile permanently linked to authUser.id
    const profile = await fetchCurrentManagementProfile(authUser.id, authSession.access_token);

    if (!profile) {
      // User authenticated in auth.users, but is not authorized in management_users
      await supabase.auth.signOut();
      return {
        user: null,
        session: null,
        profile: null,
        error: 'This account does not have active executive management clearance in the database.',
      };
    }

    return {
      user: authUser,
      session: authSession,
      profile,
      error: null,
    };
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Authentication failed';
    return {
      user: null,
      session: null,
      profile: null,
      error: msg,
    };
  }
}

/**
 * Updates management profile information in public.profiles and auth metadata.
 * Persists changes directly to the Supabase database.
 */
export async function updateManagementProfile(
  updates: { full_name?: string; phone_number?: string; avatar_url?: string }
): Promise<{ profile: ManagementUserProfile | null; error: string | null }> {
  const supabase = getSupabaseClient();
  if (!supabase) {
    return { profile: null, error: 'Supabase client not initialized' };
  }

  try {
    const { data: sessionData } = await supabase.auth.getSession();
    const user = sessionData.session?.user;
    if (!user) {
      return { profile: null, error: 'Not authenticated' };
    }

    // 1. Update public.profiles row for this user
    const profilePayload: any = {
      updated_at: new Date().toISOString(),
    };
    if (updates.full_name !== undefined) profilePayload.full_name = updates.full_name.trim();
    if (updates.phone_number !== undefined) profilePayload.phone_number = updates.phone_number.trim();
    if (updates.avatar_url !== undefined) profilePayload.avatar_url = updates.avatar_url.trim();

    const { error: profileErr } = await (supabase.from('profiles') as any)
      .update(profilePayload)
      .eq('id', user.id);

    if (profileErr) {
      return { profile: null, error: profileErr.message };
    }

    // 2. Update Supabase user metadata if full_name changed
    if (updates.full_name) {
      await supabase.auth.updateUser({
        data: { full_name: updates.full_name.trim() }
      }).catch(() => {});
    }

    // 3. Re-fetch fresh profile directly from Supabase to confirm persistence
    const refreshed = await fetchCurrentManagementProfile(user.id, sessionData.session?.access_token);
    return { profile: refreshed, error: null };
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Failed to update profile';
    return { profile: null, error: msg };
  }
}

/**
 * Safely terminates the Supabase Auth session across all browser scopes
 */
export async function logoutManagement(): Promise<{ error: string | null }> {
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

/**
 * Subscribes to Supabase Auth state changes (sign-in, token refresh, sign-out)
 */
export function subscribeToAuthChanges(
  callback: (event: AuthChangeEvent, session: Session | null) => void
): { unsubscribe: () => void } {
  const supabase = getSupabaseClient();
  if (!supabase) {
    return { unsubscribe: () => {} };
  }

  const { data: { subscription } } = supabase.auth.onAuthStateChange(callback);
  return {
    unsubscribe: () => subscription.unsubscribe(),
  };
}


