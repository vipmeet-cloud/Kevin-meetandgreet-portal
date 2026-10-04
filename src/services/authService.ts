import { getSupabase, isSupabaseConfigured } from '../lib/supabase';
import { User, Session, AuthChangeEvent } from '@supabase/supabase-js';

export interface AuthState {
  user: User | null;
  session: Session | null;
  isLoading: boolean;
  error: string | null;
}

export const authService = {
  /**
   * Check if Supabase is properly configured in environment
   */
  isConfigured(): boolean {
    return isSupabaseConfigured();
  },

  /**
   * Sign in using official Supabase Authentication
   */
  async signInWithEmail(email: string, password: string): Promise<{ user: User | null; session: Session | null; error: string | null }> {
    const supabase = getSupabase();
    if (!supabase) {
      return {
        user: null,
        session: null,
        error: 'Supabase authentication is not configured. Please supply valid VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY.',
      };
    }

    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email: email.trim(),
        password,
      });

      if (error) {
        // Professional error normalization without revealing system internals
        if (error.message.toLowerCase().includes('invalid login credentials')) {
          return { user: null, session: null, error: 'Invalid management email or password.' };
        }
        if (error.message.toLowerCase().includes('email not confirmed')) {
          return { user: null, session: null, error: 'Management email address requires confirmation.' };
        }
        return { user: null, session: null, error: error.message || 'Authentication failed. Please verify credentials.' };
      }

      return { user: data.user, session: data.session, error: null };
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'An unexpected authentication error occurred.';
      return { user: null, session: null, error: msg };
    }
  },

  /**
   * Terminate active Supabase session
   */
  async signOut(): Promise<{ error: string | null }> {
    const supabase = getSupabase();
    if (!supabase) {
      return { error: null };
    }

    try {
      const { error } = await supabase.auth.signOut();
      if (error) {
        return { error: error.message };
      }
      return { error: null };
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to terminate session.';
      return { error: msg };
    }
  },

  /**
   * Retrieve active session
   */
  async getSession(): Promise<Session | null> {
    const supabase = getSupabase();
    if (!supabase) return null;

    try {
      const { data } = await supabase.auth.getSession();
      return data.session;
    } catch {
      return null;
    }
  },

  /**
   * Retrieve current user
   */
  async getCurrentUser(): Promise<User | null> {
    const supabase = getSupabase();
    if (!supabase) return null;

    try {
      const { data } = await supabase.auth.getUser();
      return data.user;
    } catch {
      return null;
    }
  },

  /**
   * Subscribe to Supabase auth state changes
   */
  onAuthStateChange(callback: (event: AuthChangeEvent, session: Session | null) => void) {
    const supabase = getSupabase();
    if (!supabase) {
      return { unsubscribe: () => {} };
    }

    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      callback(event, session);
    });

    return {
      unsubscribe: () => subscription.unsubscribe(),
    };
  },
};
