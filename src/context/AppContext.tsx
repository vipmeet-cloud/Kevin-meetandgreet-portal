import React, { createContext, useContext, useState, useEffect, ReactNode, useCallback } from 'react';
import { User, Session } from '@supabase/supabase-js';
import { ManagementRole, ManagementUser, PublicMeetGreetSettings } from '../types';
import { authService } from '../services/authService';
import { managementService } from '../services/managementService';
import { settingsService } from '../services/settingsService';
import { isSupabaseConfigured } from '../lib/supabase';

interface AppContextType {
  user: User | null;
  session: Session | null;
  managementRole: ManagementRole | null;
  managementUser: ManagementUser | null;
  isManagement: boolean;
  isAuthLoading: boolean;
  publicSettings: PublicMeetGreetSettings | null;
  isSettingsLoading: boolean;
  supabaseConfigured: boolean;
  refreshSettings: () => Promise<void>;
  refreshAuth: () => Promise<void>;
  signOut: () => Promise<void>;
  toastMessage: string | null;
  showToast: (msg: string) => void;
}

const AppContext = createContext<AppContextType | null>(null);

export const AppProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [managementRole, setManagementRole] = useState<ManagementRole | null>(null);
  const [managementUser, setManagementUser] = useState<ManagementUser | null>(null);
  const [isManagement, setIsManagement] = useState<boolean>(false);
  const [isAuthLoading, setIsAuthLoading] = useState<boolean>(true);

  const [publicSettings, setPublicSettings] = useState<PublicMeetGreetSettings | null>(null);
  const [isSettingsLoading, setIsSettingsLoading] = useState<boolean>(true);
  const [supabaseConfigured, setSupabaseConfigured] = useState<boolean>(isSupabaseConfigured());
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const showToast = useCallback((msg: string) => {
    setToastMessage(msg);
    setTimeout(() => {
      setToastMessage((current) => (current === msg ? null : current));
    }, 4000);
  }, []);

  const refreshSettings = useCallback(async () => {
    setIsSettingsLoading(true);
    try {
      const { settings } = await settingsService.fetchPublicSettings();
      setPublicSettings(settings);
    } catch (err) {
      console.error('Failed to load settings:', err);
      setPublicSettings(null);
    } finally {
      setIsSettingsLoading(false);
    }
  }, []);

  const verifyRoleForUser = useCallback(async (activeUser: User | null) => {
    if (!activeUser) {
      setManagementRole(null);
      setManagementUser(null);
      setIsManagement(false);
      return;
    }

    try {
      const verification = await managementService.verifyManagementAccess(activeUser.id);
      if (verification.isAuthorized && verification.role) {
        setManagementRole(verification.role);
        setManagementUser(verification.managementUser);
        setIsManagement(true);
      } else {
        setManagementRole(null);
        setManagementUser(null);
        setIsManagement(false);
      }
    } catch {
      setManagementRole(null);
      setManagementUser(null);
      setIsManagement(false);
    }
  }, []);

  const refreshAuth = useCallback(async () => {
    setIsAuthLoading(true);
    setSupabaseConfigured(isSupabaseConfigured());
    try {
      const currentSession = await authService.getSession();
      setSession(currentSession);
      const currentUser = currentSession?.user ?? null;
      setUser(currentUser);
      await verifyRoleForUser(currentUser);
    } catch {
      setUser(null);
      setSession(null);
      setIsManagement(false);
    } finally {
      setIsAuthLoading(false);
    }
  }, [verifyRoleForUser]);

  useEffect(() => {
    refreshAuth();
    refreshSettings();

    const { unsubscribe } = authService.onAuthStateChange(async (_event, newSession) => {
      setSession(newSession);
      const newUser = newSession?.user ?? null;
      setUser(newUser);
      await verifyRoleForUser(newUser);
    });

    return () => {
      unsubscribe();
    };
  }, [refreshAuth, refreshSettings, verifyRoleForUser]);

  const signOut = async () => {
    await authService.signOut();
    setUser(null);
    setSession(null);
    setManagementRole(null);
    setManagementUser(null);
    setIsManagement(false);
    showToast('Signed out of management portal.');
  };

  return (
    <AppContext.Provider
      value={{
        user,
        session,
        managementRole,
        managementUser,
        isManagement,
        isAuthLoading,
        publicSettings,
        isSettingsLoading,
        supabaseConfigured,
        refreshSettings,
        refreshAuth,
        signOut,
        toastMessage,
        showToast,
      }}
    >
      {children}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-50 animate-fade-in flex items-center gap-3 px-5 py-3 rounded-xl bg-slate-900 border border-[#D4AF37]/40 text-slate-100 shadow-2xl text-sm font-medium">
          <span className="w-2 h-2 rounded-full bg-[#D4AF37] animate-pulse" />
          {toastMessage}
        </div>
      )}
    </AppContext.Provider>
  );
};

export const useApp = () => {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error('useApp must be used within an AppProvider');
  }
  return context;
};
