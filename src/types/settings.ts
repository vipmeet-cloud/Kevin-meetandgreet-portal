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
  payment_method_name?: string | null;
  payment_instructions?: string | null;
  payment_methods?: Array<{ name: string; details: string }> | null;

  // Bitcoin & Crypto Configuration
  bitcoin_enabled?: boolean | null;
  bitcoin_wallet_address?: string | null;
  bitcoin_image_url?: string | null;
  bitcoin_network?: string | null;
  bitcoin_instructions?: string | null;

  // Gift Card Configuration
  gift_card_enabled?: boolean | null;
  gift_card_types?: string | null;
  gift_card_instructions?: string | null;

  // Cloudinary Direct Config
  cloudinary_cloud_name?: string | null;
  cloudinary_upload_preset?: string | null;

  // Website Favicon & Visual Identity
  site_favicon_url?: string | null;

  // Supabase Runtime Config Overrides
  supabase_url?: string | null;
  supabase_anon_key?: string | null;
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

  // Bitcoin & Cryptocurrency
  bitcoin_enabled: boolean;
  bitcoin_wallet_address: string;
  bitcoin_image_url: string;
  bitcoin_network: string;
  bitcoin_instructions: string;

  // Gift Card
  gift_card_enabled: boolean;
  gift_card_types: string;
  gift_card_instructions: string;

  // Cloudinary Direct Config
  cloudinary_cloud_name: string;
  cloudinary_upload_preset: string;

  // Website Favicon & Identity
  site_favicon_url: string;

  // Supabase Runtime Config Overrides
  supabase_url: string;
  supabase_anon_key: string;
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

export interface CelebrityPreset {
  id: string;
  name: string;
  title: string;
  bio: string;
  imageUrl: string;
  eventName: string;
  eventDescription: string;
  heroTitle: string;
  heroSubtitle: string;
  badge: string;
}

export const CELEBRITY_PRESETS: CelebrityPreset[] = [
  {
    id: 'yungblud',
    name: 'Yungblud',
    title: 'Global Alternative Rock Icon & Musician',
    bio: 'Dominic Harrison, known professionally as Yungblud, is an internationally acclaimed British rock and alternative artist renowned for electrifying live performances, multi-charting albums, and a passionate worldwide community.',
    imageUrl: 'https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?w=1200&auto=format&fit=crop&q=80',
    eventName: 'VIP Backstage Salon & Acoustic Reception',
    eventDescription: 'An intimate, strictly limited private audience and backstage VIP reception with Yungblud.',
    heroTitle: 'VIP Backstage Access & Private Audience',
    heroSubtitle: 'Exclusive VIP Access & Personal Reception with Yungblud',
    badge: 'Rock / Alternative Icon',
  },
  {
    id: 'kevin_costner',
    name: 'Kevin Costner',
    title: 'Academy Award-Winning Actor & Filmmaker',
    bio: 'Legendary Hollywood actor, director, and producer renowned for iconic roles across cinema history and acclaimed dramatic storytelling.',
    imageUrl: '/src/assets/images/celebrity_portrait_sample_1790961557943.jpg',
    eventName: 'Exclusive VIP Private Audience & Reception',
    eventDescription: 'An intimate, strictly limited private audience and reception with Kevin Costner.',
    heroTitle: 'An Evening of Distinction & Private Audience',
    heroSubtitle: 'Exclusive VIP Access & Personal Reception with Kevin Costner',
    badge: 'Hollywood Legend',
  },
  {
    id: 'keanu_reeves',
    name: 'Keanu Reeves',
    title: 'Beloved Cultural Icon, Actor & Musician',
    bio: 'Globally celebrated film icon renowned for groundbreaking cinematic sagas, heartfelt humility, and passionate cultural philanthropy.',
    imageUrl: 'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=1200&auto=format&fit=crop&q=80',
    eventName: 'Exclusive VIP Private Lounge & Conversation',
    eventDescription: 'An intimate, strictly limited private audience and conversation reception with Keanu Reeves.',
    heroTitle: 'Exclusive Private Audience & Evening',
    heroSubtitle: 'Exclusive VIP Access & Personal Reception with Keanu Reeves',
    badge: 'Cultural Icon',
  },
  {
    id: 'post_malone',
    name: 'Post Malone',
    title: 'Multi-Diamond Recording Artist & Performer',
    bio: 'Record-shattering global superstar known for cross-genre innovation, heartfelt musicianship, and chart-topping historic anthems.',
    imageUrl: 'https://images.unsplash.com/photo-1516450360452-9312f5e86fc7?w=1200&auto=format&fit=crop&q=80',
    eventName: 'VIP Greenroom & Intimate Gathering',
    eventDescription: 'An exclusive private audience and VIP greenroom reception with Post Malone.',
    heroTitle: 'Exclusive VIP Greenroom Experience',
    heroSubtitle: 'Exclusive VIP Access & Personal Reception with Post Malone',
    badge: 'Diamond Recording Artist',
  },
  {
    id: 'billie_eilish',
    name: 'Billie Eilish',
    title: 'Grammy & Academy Award-Winning Artist',
    bio: 'Visionary singer-songwriter whose generational sound and intimate lyricism have redefined modern music on a global scale.',
    imageUrl: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=1200&auto=format&fit=crop&q=80',
    eventName: 'VIP Private Salon & Acoustic Session',
    eventDescription: 'A quiet, exclusive private gathering and VIP reception with Billie Eilish.',
    heroTitle: 'Private VIP Audience & Intimate Salon',
    heroSubtitle: 'Exclusive VIP Access & Personal Reception with Billie Eilish',
    badge: 'Grammy & Oscar Winner',
  },
];
