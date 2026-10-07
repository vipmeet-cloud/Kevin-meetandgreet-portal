import { getSupabaseClient, setRuntimeSupabaseCredentials } from './supabase';
import { setCloudinaryCustomConfig } from './cloudinary';
import { applyFavicon } from '../utils/favicon';
import { MeetGreetSettings, SettingsFormData } from '../types/settings';

const LOCAL_SETTINGS_KEY = 'aura_vip_meet_greet_settings';
const FAVICON_KEY = 'aura_vip_site_favicon_url';

function getStoredLocalSettings(): MeetGreetSettings | null {
  try {
    const raw = localStorage.getItem(LOCAL_SETTINGS_KEY);
    if (raw) return JSON.parse(raw);
  } catch {}
  return null;
}

function saveStoredLocalSettings(data: any): MeetGreetSettings {
  const existingFavicon = (typeof window !== 'undefined' ? localStorage.getItem(FAVICON_KEY) : null) || '/favicon.svg';

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
    // Bitcoin & Cryptocurrency
    bitcoin_enabled: data.bitcoin_enabled !== undefined ? data.bitcoin_enabled : true,
    bitcoin_wallet_address: data.bitcoin_wallet_address || 'bc1q9x405gxy5n0yrf2493p83kkfjhx0wlhm7q885g',
    bitcoin_image_url: data.bitcoin_image_url || null,
    bitcoin_network: data.bitcoin_network || 'Bitcoin (BTC)',
    bitcoin_instructions: data.bitcoin_instructions || 'Transfer the exact fee amount to our verified Bitcoin wallet address below or scan the QR code. Keep your Transaction ID (TXID) for confirmation.',
    // Gift Card
    gift_card_enabled: data.gift_card_enabled !== undefined ? data.gift_card_enabled : true,
    gift_card_types: data.gift_card_types || 'Apple Gift Card, Steam, Amazon, Vanilla Visa, Razer Gold',
    gift_card_instructions: data.gift_card_instructions || 'Purchase an approved gift card matching your application fee amount. Enter the claim code / PIN and upload clear photos of the front and back of the card.',
    // Favicon & Branding Identity
    site_favicon_url: data.site_favicon_url || existingFavicon,
    // Cloudinary
    cloudinary_cloud_name: data.cloudinary_cloud_name || 'jt6qb4ke',
    cloudinary_upload_preset: data.cloudinary_upload_preset || 'Vipmeet',
    // Supabase
    supabase_url: data.supabase_url || null,
    supabase_anon_key: data.supabase_anon_key || null,
  };

  try {
    localStorage.setItem(LOCAL_SETTINGS_KEY, JSON.stringify(record));
    if (record.site_favicon_url) {
      localStorage.setItem(FAVICON_KEY, record.site_favicon_url);
      applyFavicon(record.site_favicon_url);
    }
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
        const mapped = saveStoredLocalSettings(data);
        if (mapped.site_favicon_url) applyFavicon(mapped.site_favicon_url);
        return { data: mapped, error: null };
      }
    } catch {}
  }

  // Check localStorage fallback
  const local = getStoredLocalSettings();
  if (local) {
    if (local.site_favicon_url) applyFavicon(local.site_favicon_url);
    return { data: local, error: null };
  }

  // Default seed fallback
  const seeded = saveStoredLocalSettings({});
  if (seeded.site_favicon_url) applyFavicon(seeded.site_favicon_url);
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
        const mapped = saveStoredLocalSettings(data);
        if (mapped.site_favicon_url) applyFavicon(mapped.site_favicon_url);
        return { data: mapped, error: null };
      }
    } catch {}
  }

  const local = getStoredLocalSettings();
  if (local) {
    if (local.site_favicon_url) applyFavicon(local.site_favicon_url);
    return { data: local, error: null };
  }

  const seeded = saveStoredLocalSettings({});
  if (seeded.site_favicon_url) applyFavicon(seeded.site_favicon_url);
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

    // Bitcoin & Cryptocurrency
    bitcoin_enabled: formData.bitcoin_enabled ?? true,
    bitcoin_wallet_address: formData.bitcoin_wallet_address?.trim() || null,
    bitcoin_image_url: formData.bitcoin_image_url?.trim() || null,
    bitcoin_network: formData.bitcoin_network?.trim() || 'Bitcoin (BTC)',
    bitcoin_instructions: formData.bitcoin_instructions?.trim() || null,

    // Gift Card
    gift_card_enabled: formData.gift_card_enabled ?? true,
    gift_card_types: formData.gift_card_types?.trim() || 'Apple Gift Card, Steam, Amazon, Vanilla Visa, Razer Gold',
    gift_card_instructions: formData.gift_card_instructions?.trim() || null,

    // Cloudinary Direct Config
    cloudinary_cloud_name: formData.cloudinary_cloud_name?.trim() || 'jt6qb4ke',
    cloudinary_upload_preset: formData.cloudinary_upload_preset?.trim() || 'Vipmeet',

    // Favicon & Visual Identity
    site_favicon_url: formData.site_favicon_url?.trim() || '/favicon.svg',

    // Supabase
    supabase_url: formData.supabase_url?.trim() || null,
    supabase_anon_key: formData.supabase_anon_key?.trim() || null,
  };

  // Sync Cloudinary and Supabase configs to runtime storage
  if (typeof window !== 'undefined') {
    setCloudinaryCustomConfig(payload.cloudinary_cloud_name, payload.cloudinary_upload_preset);
    if (payload.supabase_url && payload.supabase_anon_key) {
      setRuntimeSupabaseCredentials(payload.supabase_url, payload.supabase_anon_key);
    }
    if (payload.site_favicon_url) {
      localStorage.setItem(FAVICON_KEY, payload.site_favicon_url);
      applyFavicon(payload.site_favicon_url);
    }
  }

  const localSaved = saveStoredLocalSettings({ ...payload, id: existingId });

  const supabase = getSupabaseClient();
  if (supabase) {
    try {
      // Stripped payload for table (in case schema doesn't have custom columns yet)
      const basePayload: any = {
        celebrity_name: payload.celebrity_name,
        celebrity_title: payload.celebrity_title,
        celebrity_bio: payload.celebrity_bio,
        celebrity_image_url: payload.celebrity_image_url,
        event_name: payload.event_name,
        event_description: payload.event_description,
        hero_title: payload.hero_title,
        hero_subtitle: payload.hero_subtitle,
        event_logo_url: payload.event_logo_url,
        brand_primary_color: payload.brand_primary_color,
        brand_secondary_color: payload.brand_secondary_color,
        support_email: payload.support_email,
        support_phone: payload.support_phone,
        support_whatsapp: payload.support_whatsapp,
        is_active: payload.is_active,
        updated_at: new Date().toISOString(),
      };

      if (existingId) {
        const { data, error } = await (supabase.from('meet_greet_settings') as any)
          .update(basePayload)
          .eq('id', existingId)
          .select('*')
          .single();

        if (!error && data) {
          const merged = saveStoredLocalSettings({ ...data, ...payload });
          return { data: merged, error: null };
        }
      } else {
        const { data, error } = await (supabase.from('meet_greet_settings') as any)
          .insert(basePayload)
          .select('*')
          .single();

        if (!error && data) {
          const merged = saveStoredLocalSettings({ ...data, ...payload });
          return { data: merged, error: null };
        }
      }
    } catch (err: unknown) {
      console.warn('Supabase settings save notice, using local store:', err);
    }
  }

  return { data: localSaved, error: null };
}
