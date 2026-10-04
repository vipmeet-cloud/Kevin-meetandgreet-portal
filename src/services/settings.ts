import { getSupabaseClient } from './supabase';
import { MeetGreetSettings, SettingsFormData, MeetGreetSettingsInsert, MeetGreetSettingsUpdate } from '../types/settings';

const LOCAL_SETTINGS_KEY = 'aura_vip_meet_greet_settings';

function getStoredLocalSettings(): MeetGreetSettings | null {
  try {
    const raw = localStorage.getItem(LOCAL_SETTINGS_KEY);
    if (raw) return JSON.parse(raw);
  } catch {}
  return null;
}

function saveStoredLocalSettings(data: any): MeetGreetSettings {
  const record: MeetGreetSettings = {
    id: data.id || `set_${Date.now()}`,
    created_at: data.created_at || new Date().toISOString(),
    updated_at: new Date().toISOString(),
    celebrity_name: data.celebrity_name || 'Kevin Costner',
    celebrity_title: data.celebrity_title || 'Academy Award-Winning Actor & Filmmaker',
    celebrity_bio: data.celebrity_bio || 'Legendary Hollywood actor, director, and producer renowned for iconic roles across cinema history.',
    celebrity_image_url: data.celebrity_image_url || null,
    event_name: data.event_name || 'Exclusive VIP Private Audience & Reception',
    event_description: data.event_description || 'An intimate, strictly limited private audience and reception with Kevin Costner.',
    hero_title: data.hero_title || 'An Evening of Distinction & Private Audience',
    hero_subtitle: data.hero_subtitle || 'Exclusive VIP Access & Personal Reception with Kevin Costner',
    event_logo_url: data.event_logo_url || null,
    brand_primary_color: data.brand_primary_color || '#D4AF37',
    brand_secondary_color: data.brand_secondary_color || '#080A0F',
    support_email: data.support_email || 'management.meet.greet@gmail.com',
    support_phone: data.support_phone || null,
    support_whatsapp: data.support_whatsapp || null,
    is_active: data.is_active !== undefined ? data.is_active : true,
    fee_name: data.fee_name || 'VIP Private Audience & Credentials Fee',
    fee_amount: data.fee_amount !== undefined ? data.fee_amount : 2500,
    fee_currency: data.fee_currency || 'USD',
    fee_description: data.fee_description || 'Exclusive VIP accreditation fee for private salon audience.',
    fee_inclusions: data.fee_inclusions || 'Includes private audience session, verified attendee credential, and security concierge support.',
    payment_deadline_hours: data.payment_deadline_hours || 48,
    refund_policy: data.refund_policy || 'Full refund available up to 72 hours prior to scheduled session.',
    cancellation_policy: data.cancellation_policy || 'Cancellations within 48 hours are subject to management review.',
    payment_instructions: data.payment_instructions || 'Please remit payment via bank transfer using your reference code.',
  };
  try {
    localStorage.setItem(LOCAL_SETTINGS_KEY, JSON.stringify(record));
  } catch {}
  return record;
}

export async function fetchActiveMeetGreetSettings(): Promise<{
  data: MeetGreetSettings | null;
  error: string | null;
}> {
  const supabase = getSupabaseClient();
  if (supabase) {
    try {
      const { data, error } = await supabase
        .from('meet_greet_settings')
        .select('*')
        .eq('is_active', true)
        .order('updated_at', { ascending: false })
        .limit(1)
        .maybeSingle();

      if (!error && data) {
        saveStoredLocalSettings(data);
        return { data: data as MeetGreetSettings | null, error: null };
      }
    } catch {}
  }

  // Check localStorage fallback
  const local = getStoredLocalSettings();
  if (local) {
    return { data: local, error: null };
  }

  // Default seed fallback
  const seeded = saveStoredLocalSettings({});
  return { data: seeded, error: null };
}

export async function fetchManagementMeetGreetSettings(): Promise<{
  data: MeetGreetSettings | null;
  error: string | null;
}> {
  const supabase = getSupabaseClient();
  if (supabase) {
    try {
      const { data, error } = await supabase
        .from('meet_greet_settings')
        .select('*')
        .order('updated_at', { ascending: false })
        .limit(1)
        .maybeSingle();

      if (!error && data) {
        saveStoredLocalSettings(data);
        return { data: data as MeetGreetSettings | null, error: null };
      }
    } catch {}
  }

  const local = getStoredLocalSettings();
  if (local) return { data: local, error: null };

  const seeded = saveStoredLocalSettings({});
  return { data: seeded, error: null };
}

export async function saveMeetGreetSettings(
  formData: SettingsFormData,
  existingId?: string
): Promise<{
  data: MeetGreetSettings | null;
  error: string | null;
}> {
  const payload = {
    celebrity_name: formData.celebrity_name.trim(),
    celebrity_title: formData.celebrity_title.trim(),
    celebrity_bio: formData.celebrity_bio.trim(),
    celebrity_image_url: formData.celebrity_image_url?.trim() || null,
    event_name: formData.event_name.trim(),
    event_description: formData.event_description.trim(),
    hero_title: formData.hero_title.trim(),
    hero_subtitle: formData.hero_subtitle.trim(),
    event_logo_url: formData.event_logo_url?.trim() || null,
    brand_primary_color: formData.brand_primary_color.trim(),
    brand_secondary_color: formData.brand_secondary_color.trim(),
    support_email: formData.support_email.trim().toLowerCase(),
    support_phone: formData.support_phone?.trim() || null,
    support_whatsapp: formData.support_whatsapp?.trim() || null,
    is_active: formData.is_active,

    // Phase 4 Fee fields
    fee_name: formData.fee_name?.trim() || null,
    fee_amount: formData.fee_amount !== '' && formData.fee_amount !== undefined ? Number(formData.fee_amount) : null,
    fee_currency: formData.fee_currency?.trim() || 'USD',
    fee_description: formData.fee_description?.trim() || null,
    fee_inclusions: formData.fee_inclusions?.trim() || null,
    payment_deadline_hours: formData.payment_deadline_hours !== '' && formData.payment_deadline_hours !== undefined ? Number(formData.payment_deadline_hours) : 48,
    refund_policy: formData.refund_policy?.trim() || null,
    cancellation_policy: formData.cancellation_policy?.trim() || null,
    payment_instructions: formData.payment_instructions?.trim() || null,
  };

  const localSaved = saveStoredLocalSettings({ ...payload, id: existingId });

  const supabase = getSupabaseClient();
  if (supabase) {
    try {
      if (existingId) {
        const { data, error } = await (supabase.from('meet_greet_settings') as any)
          .update(payload)
          .eq('id', existingId)
          .select('*')
          .single();

        if (!error && data) {
          saveStoredLocalSettings(data);
          return { data: data as MeetGreetSettings, error: null };
        }
      } else {
        const { data, error } = await (supabase.from('meet_greet_settings') as any)
          .insert(payload)
          .select('*')
          .single();

        if (!error && data) {
          saveStoredLocalSettings(data);
          return { data: data as MeetGreetSettings, error: null };
        }
      }
    } catch (err: unknown) {
      console.warn('Supabase settings save notice, using local store:', err);
    }
  }

  return { data: localSaved, error: null };
}
