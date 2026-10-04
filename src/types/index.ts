export type ManagementRole = 'administrator' | 'manager' | 'coordinator' | 'reviewer';

export interface MeetGreetSettings {
  id: string;
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
  created_at?: string;
  updated_at?: string;
}

export type PublicMeetGreetSettings = Pick<
  MeetGreetSettings,
  | 'id'
  | 'celebrity_name'
  | 'celebrity_title'
  | 'celebrity_bio'
  | 'celebrity_image_url'
  | 'event_name'
  | 'event_description'
  | 'hero_title'
  | 'hero_subtitle'
  | 'event_logo_url'
  | 'brand_primary_color'
  | 'brand_secondary_color'
  | 'support_email'
  | 'support_phone'
  | 'support_whatsapp'
  | 'is_active'
>;

export interface ManagementUser {
  id: string;
  user_id: string;
  email: string;
  role: ManagementRole;
  is_active: boolean;
  assigned_by?: string | null;
  created_at?: string;
  updated_at?: string;
}

export interface Profile {
  id: string;
  email: string;
  full_name?: string | null;
  avatar_url?: string | null;
  phone_number?: string | null;
  created_at?: string;
  updated_at?: string;
}

export interface TermsVersion {
  id: string;
  version: string;
  title: string;
  content: string;
  effective_date: string;
  is_current: boolean;
  created_at?: string;
}

export interface PrivacyVersion {
  id: string;
  version: string;
  title: string;
  content: string;
  effective_date: string;
  is_current: boolean;
  created_at?: string;
}

export interface ServiceIntegrationStatus {
  supabaseConfigured: boolean;
  supabaseConnected: boolean;
  supabaseUrl: string;
  cloudinaryConfigured: boolean;
  resendConfigured: boolean;
  hasActiveSettings: boolean;
}
