import { getSupabaseClient, setRuntimeSupabaseCredentials } from './supabase';
import { setCloudinaryCustomConfig } from './cloudinary';
import { applyFavicon } from '../utils/favicon';
import { MeetGreetSettings, SettingsFormData } from '../types/settings';

const LOCAL_SETTINGS_KEY = 'aura_vip_meet_greet_settings';
const FAVICON_KEY = 'aura_vip_site_favicon_url';

function isUuid(val: unknown): boolean {
  if (typeof val !== 'string') return false;
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(val.trim());
}

function getStoredLocalSettings(): MeetGreetSettings | null {
  try {
    const raw = localStorage.getItem(LOCAL_SETTINGS_KEY);
    if (raw) return JSON.parse(raw);
  } catch {}
  return null;
}

function extractConfigFromInstructions(rawInstructions?: string | null): {
  cleanInstructions: string;
  config: Record<string, any>;
} {
  if (!rawInstructions) return { cleanInstructions: '', config: {} };

  const match = rawInstructions.match(/<!--VIP_CONFIG:(.*?)-->/);
  if (!match) {
    return { cleanInstructions: rawInstructions.trim(), config: {} };
  }

  try {
    const parsed = JSON.parse(match[1]);
    const clean = rawInstructions.replace(/<!--VIP_CONFIG:(.*?)-->/, '').trim();
    return { cleanInstructions: clean, config: parsed };
  } catch {
    return { cleanInstructions: rawInstructions.trim(), config: {} };
  }
}

function packInstructionsWithConfig(cleanInstructions: string, config: Record<string, any>): string {
  const jsonStr = JSON.stringify(config);
  const clean = (cleanInstructions || '').trim();
  return clean ? `${clean}\n\n<!--VIP_CONFIG:${jsonStr}-->` : `<!--VIP_CONFIG:${jsonStr}-->`;
}

function unpackSettingsRecord(data: any): MeetGreetSettings {
  const { cleanInstructions, config } = extractConfigFromInstructions(data.payment_instructions);

  const existingFavicon = config.site_favicon_url || data.site_favicon_url || '/favicon.svg';

  const record: MeetGreetSettings = {
    id: data.id || `set_${Date.now()}`,
    created_at: data.created_at || new Date().toISOString(),
    updated_at: data.updated_at || new Date().toISOString(),
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
    fee_amount: data.fee_amount !== undefined && data.fee_amount !== null ? Number(data.fee_amount) : 2500,
    fee_currency: data.fee_currency || 'USD',
    fee_description: data.fee_description || 'Exclusive VIP accreditation fee for private salon audience.',
    fee_inclusions: data.fee_inclusions || 'Includes private audience session, verified attendee credential, and security concierge support.',
    payment_deadline_hours: data.payment_deadline_hours || 48,
    refund_policy: data.refund_policy || 'Full refund available up to 72 hours prior to scheduled session.',
    cancellation_policy: data.cancellation_policy || 'Cancellations within 48 hours are subject to management review.',
    payment_method_name: data.payment_method_name || 'Bank Wire Transfer',
    payment_instructions: cleanInstructions || 'Please remit payment via bank transfer using your reference code.',
    
    // Bitcoin & Cryptocurrency (Restored from database metadata)
    bitcoin_enabled: config.bitcoin_enabled !== undefined ? config.bitcoin_enabled : (data.bitcoin_enabled !== undefined ? data.bitcoin_enabled : true),
    bitcoin_wallet_address: config.bitcoin_wallet_address || data.bitcoin_wallet_address || 'bc1q9x405gxy5n0yrf2493p83kkfjhx0wlhm7q885g',
    bitcoin_image_url: config.bitcoin_image_url || data.bitcoin_image_url || null,
    bitcoin_network: config.bitcoin_network || data.bitcoin_network || 'Bitcoin (BTC)',
    bitcoin_instructions: config.bitcoin_instructions || data.bitcoin_instructions || 'Transfer the exact fee amount to our verified Bitcoin wallet address below or scan the QR code. Keep your Transaction ID (TXID) for confirmation.',
    
    // Gift Card (Restored from database metadata)
    gift_card_enabled: config.gift_card_enabled !== undefined ? config.gift_card_enabled : (data.gift_card_enabled !== undefined ? data.gift_card_enabled : true),
    gift_card_types: config.gift_card_types || data.gift_card_types || 'Apple Gift Card, Steam, Amazon, Vanilla Visa, Razer Gold',
    gift_card_instructions: config.gift_card_instructions || data.gift_card_instructions || 'Purchase an approved gift card matching your application fee amount. Enter the claim code / PIN and upload clear photos of the front and back of the card.',
    
    // Favicon & Branding Identity
    site_favicon_url: existingFavicon,
    
    // Cloudinary
    cloudinary_cloud_name: config.cloudinary_cloud_name || data.cloudinary_cloud_name || 'jt6qb4ke',
    cloudinary_upload_preset: config.cloudinary_upload_preset || data.cloudinary_upload_preset || 'Vipmeet',
    
    // Supabase
    supabase_url: data.supabase_url || null,
    supabase_anon_key: data.supabase_anon_key || null,
  };

  try {
    if (typeof window !== 'undefined') {
      localStorage.setItem(LOCAL_SETTINGS_KEY, JSON.stringify(record));
      if (record.site_favicon_url) {
        localStorage.setItem(FAVICON_KEY, record.site_favicon_url);
        applyFavicon(record.site_favicon_url);
      }
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
        const mapped = unpackSettingsRecord(data);
        if (mapped.site_favicon_url) applyFavicon(mapped.site_favicon_url);
        return { data: mapped, error: null };
      }
    } catch {}
  }

  // Fallback cache if completely offline
  const local = getStoredLocalSettings();
  if (local) {
    if (local.site_favicon_url) applyFavicon(local.site_favicon_url);
    return { data: local, error: null };
  }

  const seeded = unpackSettingsRecord({});
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
        const mapped = unpackSettingsRecord(data);
        if (mapped.site_favicon_url) applyFavicon(mapped.site_favicon_url);
        return { data: mapped, error: null };
      }
    } catch (err: unknown) {
      console.warn('Supabase fetch settings error:', err);
    }
  }

  const local = getStoredLocalSettings();
  if (local) {
    if (local.site_favicon_url) applyFavicon(local.site_favicon_url);
    return { data: local, error: null };
  }

  const seeded = unpackSettingsRecord({});
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
  const supabase = getSupabaseClient();
  if (!supabase) {
    return { data: null, error: 'Database client not connected.' };
  }

  // Pack secondary configs into metadata tag inside instructions
  const configMetadata = {
    bitcoin_enabled: formData.bitcoin_enabled ?? true,
    bitcoin_wallet_address: formData.bitcoin_wallet_address?.trim() || 'bc1q9v3n92x7wz4k8t5y2m0p1a3d6f8h0j4l7c9s2x',
    bitcoin_image_url: formData.bitcoin_image_url?.trim() || null,
    bitcoin_network: formData.bitcoin_network?.trim() || 'Bitcoin (BTC)',
    bitcoin_instructions: formData.bitcoin_instructions?.trim() || null,
    gift_card_enabled: formData.gift_card_enabled ?? true,
    gift_card_types: formData.gift_card_types?.trim() || 'Apple Gift Card, Steam, Amazon, Vanilla Visa, Razer Gold',
    gift_card_instructions: formData.gift_card_instructions?.trim() || null,
    cloudinary_cloud_name: formData.cloudinary_cloud_name?.trim() || 'jt6qb4ke',
    cloudinary_upload_preset: formData.cloudinary_upload_preset?.trim() || 'Vipmeet',
    site_favicon_url: formData.site_favicon_url?.trim() || '/favicon.svg',
  };

  const packedInstructions = packInstructionsWithConfig(
    formData.payment_instructions || '',
    configMetadata
  );

  const basePayload = {
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

    // Phase 4 Fee fields - strictly saved to Supabase
    fee_name: formData.fee_name?.trim() || 'VIP Private Audience Credentials Fee',
    fee_amount: formData.fee_amount !== '' && formData.fee_amount !== undefined ? Number(formData.fee_amount) : 2500,
    fee_currency: formData.fee_currency?.trim() || 'USD',
    fee_description: formData.fee_description?.trim() || null,
    fee_inclusions: formData.fee_inclusions?.trim() || null,
    payment_deadline_hours: formData.payment_deadline_hours !== '' && formData.payment_deadline_hours !== undefined ? Number(formData.payment_deadline_hours) : 48,
    refund_policy: formData.refund_policy?.trim() || null,
    cancellation_policy: formData.cancellation_policy?.trim() || null,
    payment_method_name: 'Bank Wire Transfer',
    payment_instructions: packedInstructions,
    updated_at: new Date().toISOString(),
  };

  try {
    // 1. Try updating existing active row by ID or locate first row
    let targetRowId = existingId && isUuid(existingId) ? existingId : null;

    if (!targetRowId) {
      const { data: activeRow } = await (supabase.from('meet_greet_settings') as any)
        .select('id')
        .order('updated_at', { ascending: false })
        .limit(1)
        .maybeSingle();

      if (activeRow?.id) {
        targetRowId = activeRow.id;
      }
    }

    let savedData: any = null;

    if (targetRowId) {
      const { data, error } = await (supabase.from('meet_greet_settings') as any)
        .update(basePayload)
        .eq('id', targetRowId)
        .select('*')
        .single();

      if (error) {
        return { data: null, error: `Failed to update settings in Supabase: ${error.message}` };
      }
      savedData = data;
    } else {
      const { data, error } = await (supabase.from('meet_greet_settings') as any)
        .insert(basePayload)
        .select('*')
        .single();

      if (error) {
        return { data: null, error: `Failed to insert settings into Supabase: ${error.message}` };
      }
      savedData = data;
    }

    // Unpack database record and update runtime favicon
    const result = unpackSettingsRecord(savedData);
    if (result.site_favicon_url) {
      applyFavicon(result.site_favicon_url);
    }
    return { data: result, error: null };
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Database update failed';
    return { data: null, error: msg };
  }
}
