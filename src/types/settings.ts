import { Database } from './database';

export type MeetGreetSettings = Database['public']['Tables']['meet_greet_settings']['Row'] & {
  fee_name?: string | null;
  fee_amount?: number | null;
  fee_currency?: string | null;
  fee_description?: string | null;
  fee_inclusions?: string | null;
  payment_deadline_hours?: number | null;
  refund_policy?: string | null;
  cancellation_policy?: string | null;
  payment_instructions?: string | null;
  payment_methods?: Array<{ name: string; details: string }> | null;
};
export type MeetGreetSettingsInsert = Database['public']['Tables']['meet_greet_settings']['Insert'];
export type MeetGreetSettingsUpdate = Database['public']['Tables']['meet_greet_settings']['Update'];

export interface SettingsFormData {
  celebrity_name: string;
  celebrity_title: string;
  celebrity_bio: string;
  celebrity_image_url: string;
  event_name: string;
  event_description: string;
  hero_title: string;
  hero_subtitle: string;
  event_logo_url: string;
  brand_primary_color: string;
  brand_secondary_color: string;
  support_email: string;
  support_phone: string;
  support_whatsapp: string;
  is_active: boolean;

  // Phase 4: Fee & Payment Configuration
  fee_name: string;
  fee_amount: number | '';
  fee_currency: string;
  fee_description: string;
  fee_inclusions: string;
  payment_deadline_hours: number | '';
  refund_policy: string;
  cancellation_policy: string;
  payment_instructions: string;
}

export interface SettingsValidationErrors {
  celebrity_name?: string;
  celebrity_title?: string;
  celebrity_bio?: string;
  event_name?: string;
  event_description?: string;
  hero_title?: string;
  hero_subtitle?: string;
  support_email?: string;
  brand_primary_color?: string;
  brand_secondary_color?: string;
  celebrity_image_url?: string;
  event_logo_url?: string;
  support_phone?: string;
  support_whatsapp?: string;
  fee_name?: string;
  fee_amount?: string;
  fee_currency?: string;
}
