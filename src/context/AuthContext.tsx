import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { User, Session } from '@supabase/supabase-js';
import { ManagementUserProfile, AuthState, AuthStatus } from '../types/auth';
import { getSupabaseClient, isSupabaseConfigured } from '../services/supabase';
import { 
  loginManagement, 
  logoutManagement, 
  fetchCurrentManagementProfile,
  updateManagementProfile,
  subscribeToAuthChanges
} from '../services/auth';

interface AuthContextType extends AuthState {
  login: (email: string, password: string) => Promise<{ success: boolean; error: string | null }>;
  logout: () => Promise<void>;
  refreshAuth: () => Promise<void>;
  updateProfile: (updates: { full_name?: string; phone_number?: string; avatar_url?: string }) => Promise<{ success: boolean; error: string | null }>;
}

const AuthContext = createContext<AuthContextType>({
  status: 'AUTHENTICATING',
  user: null,
  session: null,
  managementProfile: null,
  isLoading: true,
  isAuthorizedManagement: false,
  error: null,
  login: async () => ({ success: false, error: 'Auth context not initialized' }),
  logout: async () => {},
  refreshAuth: async () => {},
  updateProfile: async () => ({ success: false, error: 'Auth context not initialized' }),
});

export function useAuth() {
  return useContext(AuthContext);
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [status, setStatus] = useState<AuthStatus>('AUTHENTICATING');
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [managementProfile, setManagementProfile] = useState<ManagementUserProfile | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Loading flag is true whenever authenticating session or loading profile
  const isLoading = status === 'AUTHENTICATING' || status === 'AUTHENTICATED_LOADING_PROFILE';

  // Management clearance verified strictly when profile is loaded and linked to the auth UUID
  const isAuthorizedManagement = Boolean(
    status === 'AUTHENTICATED_PROFILE_LOADED' &&
    managementProfile &&
    user &&
    managementProfile.id === user.id &&
    ['administrator', 'manager', 'coordinator', 'reviewer'].includes(managementProfile.role)
  );

  const refreshAuth = useCallback(async () => {
    setError(null);
    setStatus('AUTHENTICATING');

    const supabase = getSupabaseClient();
    if (!supabase || !isSupabaseConfigured()) {
      setUser(null);
      setSession(null);
      setManagementProfile(null);
      setStatus('UNAUTHENTICATED');
      return;
    }

    try {
      // 1. Restore authenticated Supabase session
      const { data: sessionData, error: sessionErr } = await supabase.auth.getSession();
      
      if (sessionErr || !sessionData.session?.user) {
        setUser(null);
        setSession(null);
        setManagementProfile(null);
        setStatus('UNAUTHENTICATED');
        return;
      }

      const activeUser = sessionData.session.user;
      const activeSession = sessionData.session;
      setUser(activeUser);
      setSession(activeSession);

      // 2. Transition state to AUTHENTICATED + LOADING MANAGEMENT PROFILE
      setStatus('AUTHENTICATED_LOADING_PROFILE');

      // 3. Fetch database-backed management profile permanently linked to activeUser.id
      const profile = await fetchCurrentManagementProfile(activeUser.id, activeSession.access_token);

      if (profile && ['administrator', 'manager', 'coordinator', 'reviewer'].includes(profile.role)) {
        setManagementProfile(profile);
        setStatus('AUTHENTICATED_PROFILE_LOADED');
      } else {
        setManagementProfile(null);
        setStatus('UNAUTHENTICATED');
      }
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Auth refresh failed';
      setError(message);
      setUser(null);
      setSession(null);
      setManagementProfile(null);
      setStatus('UNAUTHENTICATED');
    }
  }, []);

  useEffect(() => {
    refreshAuth();

    // Supabase Auth listener for cross-tab, page-refresh, and token-refresh events
    const { unsubscribe } = subscribeToAuthChanges(async (event, currentSession) => {
      if (currentSession?.user) {
        setUser(currentSession.user);
        setSession(currentSession);
        setStatus('AUTHENTICATED_LOADING_PROFILE');

        const profile = await fetchCurrentManagementProfile(currentSession.user.id, currentSession.access_token);
        if (profile && ['administrator', 'manager', 'coordinator', 'reviewer'].includes(profile.role)) {
          setManagementProfile(profile);
          setStatus('AUTHENTICATED_PROFILE_LOADED');
        } else {
          setManagementProfile(null);
          setStatus('UNAUTHENTICATED');
        }
      } else if (event === 'SIGNED_OUT') {
        setUser(null);
        setSession(null);
        setManagementProfile(null);
        setStatus('UNAUTHENTICATED');
      }
    });

    return () => {
      unsubscribe();
    };
  }, [refreshAuth]);

  const login = async (email: string, password: string) => {
    setError(null);
    setStatus('AUTHENTICATING');

    const result = await loginManagement(email, password);

    if (result.error || !result.user || !result.profile) {
      const errText = result.error || 'Authentication credentials not recognized or insufficient privileges.';
      setError(errText);
      setStatus('UNAUTHENTICATED');
      return { success: false, error: errText };
    }

    setUser(result.user);
    setSession(result.session);
    setManagementProfile(result.profile);
    setStatus('AUTHENTICATED_PROFILE_LOADED');

    return { success: true, error: null };
  };

  const logout = async () => {
    setStatus('AUTHENTICATING');
    await logoutManagement();
    setUser(null);
    setSession(null);
    setManagementProfile(null);
    setError(null);
    setStatus('UNAUTHENTICATED');
  };

  const updateProfile = async (updates: { full_name?: string; phone_number?: string; avatar_url?: string }) => {
    const res = await updateManagementProfile(updates);
    if (res.error) {
      return { success: false, error: res.error };
    }
    if (res.profile) {
      setManagementProfile(res.profile);
      return { success: true, error: null };
    }
    return { success: false, error: 'Failed to update profile' };
  };

  return (
    <AuthContext.Provider
      value={{
        status,
        user,
        session,
        managementProfile,
        isLoading,
        isAuthorizedManagement,
        error,
        login,
        logout,
        refreshAuth,
        updateProfile,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

