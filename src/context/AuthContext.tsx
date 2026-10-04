import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { User, Session } from '@supabase/supabase-js';
import { ManagementUserProfile, AuthState } from '../types/auth';
import { getSupabaseClient, isSupabaseConfigured } from '../services/supabase';
import { 
  loginManagement, 
  logoutManagement, 
  fetchCurrentManagementProfile,
  getStoredManagementSession 
} from '../services/auth';

interface AuthContextType extends AuthState {
  login: (email: string, password: string) => Promise<{ success: boolean; error: string | null }>;
  logout: () => Promise<void>;
  refreshAuth: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  session: null,
  managementProfile: null,
  isLoading: true,
  isAuthorizedManagement: false,
  error: null,
  login: async () => ({ success: false, error: 'Auth context not initialized' }),
  logout: async () => {},
  refreshAuth: async () => {},
});

export function useAuth() {
  return useContext(AuthContext);
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [managementProfile, setManagementProfile] = useState<ManagementUserProfile | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const isAuthorizedManagement = Boolean(
    managementProfile &&
    ['administrator', 'manager', 'coordinator', 'reviewer'].includes(managementProfile.role)
  );

  const refreshAuth = useCallback(async () => {
    // 1. Check local stored session first
    const stored = getStoredManagementSession();
    if (stored) {
      setUser(stored.user);
      setSession(stored.session);
      setManagementProfile(stored.profile);
      setIsLoading(false);
      return;
    }

    if (!isSupabaseConfigured()) {
      setIsLoading(false);
      return;
    }

    const supabase = getSupabaseClient();
    if (!supabase) {
      setIsLoading(false);
      return;
    }

    try {
      const { data: sessionData, error: sessionErr } = await supabase.auth.getSession();
      if (sessionErr || !sessionData.session) {
        setUser(null);
        setSession(null);
        setManagementProfile(null);
        setIsLoading(false);
        return;
      }

      setSession(sessionData.session);
      setUser(sessionData.session.user);

      // Verify management profile from management_users table
      const profile = await fetchCurrentManagementProfile();
      setManagementProfile(profile);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Auth refresh failed';
      setError(message);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    refreshAuth();

    const supabase = getSupabaseClient();
    if (!supabase) return;

    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, currentSession) => {
      setSession(currentSession);
      setUser(currentSession?.user || null);

      if (currentSession?.user) {
        const profile = await fetchCurrentManagementProfile();
        setManagementProfile(profile);
      } else {
        setManagementProfile(null);
      }
      setIsLoading(false);
    });

    return () => {
      subscription.unsubscribe();
    };
  }, [refreshAuth]);

  const login = async (email: string, password: string) => {
    setError(null);
    setIsLoading(true);

    const result = await loginManagement(email, password);

    if (result.error) {
      setError(result.error);
      setIsLoading(false);
      return { success: false, error: result.error };
    }

    setUser(result.user);
    setSession(result.session);
    setManagementProfile(result.profile);
    setIsLoading(false);

    return { success: true, error: null };
  };

  const logout = async () => {
    setIsLoading(true);
    await logoutManagement();
    setUser(null);
    setSession(null);
    setManagementProfile(null);
    setError(null);
    setIsLoading(false);
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        session,
        managementProfile,
        isLoading,
        isAuthorizedManagement,
        error,
        login,
        logout,
        refreshAuth,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}
