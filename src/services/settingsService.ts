import { getSupabase } from '../lib/supabase';
import { MeetGreetSettings, PublicMeetGreetSettings } from '../types';

export interface SaveSettingsResult {
  success: boolean;
  data: MeetGreetSettings | null;
  error: string | null;
}

export const settingsService = {
  /**
   * Fetch active public celebrity/event configuration.
   * Public visitors may ONLY read settings when is_active is true.
   */
  async fetchPublicSettings(): Promise<{ settings: PublicMeetGreetSettings | null; error: string | null }> {
    const supabase = getSupabase();
    if (!supabase) {
      return { settings: null, error: 'Database unconfigured' };
    }

    try {
      const { data, error } = await supabase
        .from('meet_greet_settings')
        .select(`
          id,
          celebrity_name,
          celebrity_title,
          celebrity_bio,
          celebrity_image_url,
          event_name,
          event_description,
          hero_title,
          hero_subtitle,
          event_logo_url,
          brand_primary_color,
          brand_secondary_color,
          support_email,
          support_phone,
          support_whatsapp,
          is_active
        `)
        .eq('is_active', true)
        .order('updated_at', { ascending: false })
        .limit(1)
        .maybeSingle();

      if (error) {
        console.error('Error fetching public settings:', error);
        return { settings: null, error: 'Unable to load event details.' };
      }

      return { settings: data as PublicMeetGreetSettings | null, error: null };
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Unable to connect to service.';
      return { settings: null, error: msg };
    }
  },

  /**
   * Fetch current configuration for authorized management view (includes draft/inactive settings).
   */
  async fetchManagementSettings(): Promise<{ settings: MeetGreetSettings | null; error: string | null }> {
    const supabase = getSupabase();
    if (!supabase) {
      return { settings: null, error: 'Database unconfigured' };
    }

    try {
      const { data, error } = await supabase
        .from('meet_greet_settings')
        .select('*')
        .order('updated_at', { ascending: false })
        .limit(1)
        .maybeSingle();

      if (error) {
        console.error('Error fetching management settings:', error);
        return { settings: null, error: 'Unable to retrieve settings from database.' };
      }

      return { settings: data as MeetGreetSettings | null, error: null };
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to retrieve settings.';
      return { settings: null, error: msg };
    }
  },

  /**
   * Persist celebrity and event configuration into Supabase.
   * Enforces validation before sending to the database.
   */
  async saveSettings(payload: Partial<MeetGreetSettings>): Promise<SaveSettingsResult> {
    // 1. Validation
    if (!payload.celebrity_name || payload.celebrity_name.trim().length === 0) {
      return { success: false, data: null, error: 'Celebrity name is required.' };
    }
    if (!payload.event_name || payload.event_name.trim().length === 0) {
      return { success: false, data: null, error: 'Event name is required.' };
    }
    if (!payload.hero_title || payload.hero_title.trim().length === 0) {
      return { success: false, data: null, error: 'Hero title is required.' };
    }
    if (payload.support_email && !payload.support_email.includes('@')) {
      return { success: false, data: null, error: 'Please enter a valid support email address.' };
    }

    const supabase = getSupabase();
    if (!supabase) {
      return { success: false, data: null, error: 'Supabase client is not connected. Please verify environment keys.' };
    }

    try {
      const sanitized = {
        celebrity_name: payload.celebrity_name.trim(),
        celebrity_title: payload.celebrity_title?.trim() || '',
        celebrity_bio: payload.celebrity_bio?.trim() || '',
        celebrity_image_url: payload.celebrity_image_url?.trim() || '',
        event_name: payload.event_name.trim(),
        event_description: payload.event_description?.trim() || '',
        hero_title: payload.hero_title.trim(),
        hero_subtitle: payload.hero_subtitle?.trim() || '',
        event_logo_url: payload.event_logo_url?.trim() || '',
        brand_primary_color: payload.brand_primary_color || '#D4AF37',
        brand_secondary_color: payload.brand_secondary_color || '#0B0D12',
        support_email: payload.support_email?.trim() || '',
        support_phone: payload.support_phone?.trim() || '',
        support_whatsapp: payload.support_whatsapp?.trim() || '',
        is_active: Boolean(payload.is_active),
        updated_at: new Date().toISOString(),
      };

      if (payload.id) {
        // Update existing record
        const { data, error } = await supabase
          .from('meet_greet_settings')
          .update(sanitized)
          .eq('id', payload.id)
          .select()
          .single();

        if (error) {
          console.error('Update settings error:', error);
          return { success: false, data: null, error: 'Failed to update settings. Please check management permissions.' };
        }

        return { success: true, data: data as MeetGreetSettings, error: null };
      } else {
        // Insert new record
        const { data, error } = await supabase
          .from('meet_greet_settings')
          .insert([sanitized])
          .select()
          .single();

        if (error) {
          console.error('Insert settings error:', error);
          return { success: false, data: null, error: 'Failed to create settings record. Ensure RLS policies allow insertion.' };
        }

        return { success: true, data: data as MeetGreetSettings, error: null };
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'An unexpected error occurred while saving.';
      return { success: false, data: null, error: msg };
    }
  },
};
