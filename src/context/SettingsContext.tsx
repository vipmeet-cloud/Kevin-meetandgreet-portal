import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { MeetGreetSettings } from '../types/settings';
import { fetchActiveMeetGreetSettings } from '../services/settings';
import { isSupabaseConfigured } from '../services/supabase';

interface SettingsContextType {
  settings: MeetGreetSettings | null;
  isLoading: boolean;
  error: string | null;
  isPortalConfigured: boolean;
  refreshSettings: () => Promise<void>;
}

const SettingsContext = createContext<SettingsContextType>({
  settings: null,
  isLoading: true,
  error: null,
  isPortalConfigured: false,
  refreshSettings: async () => {},
});

export function useSettings() {
  return useContext(SettingsContext);
}

export function SettingsProvider({ children }: { children: React.ReactNode }) {
  const [settings, setSettings] = useState<MeetGreetSettings | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const refreshSettings = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);
      const { data, error: fetchErr } = await fetchActiveMeetGreetSettings();

      if (data) {
        setSettings(data);

        // Dynamically apply custom brand colors if configured
        if (typeof document !== 'undefined') {
          if (data.brand_primary_color) {
            document.documentElement.style.setProperty('--color-brand-primary', data.brand_primary_color);
          }
          if (data.brand_secondary_color) {
            document.documentElement.style.setProperty('--color-brand-secondary', data.brand_secondary_color);
          }
        }
      } else if (fetchErr) {
        setError(fetchErr);
      }
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Failed to retrieve event configuration';
      setError(message);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    refreshSettings();
  }, [refreshSettings]);

  const isPortalConfigured = Boolean(
    settings &&
    settings.celebrity_name &&
    settings.celebrity_name.trim().length > 0 &&
    settings.is_active
  );

  return (
    <SettingsContext.Provider
      value={{
        settings,
        isLoading,
        error,
        isPortalConfigured,
        refreshSettings,
      }}
    >
      {children}
    </SettingsContext.Provider>
  );
}
