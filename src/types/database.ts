export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export type ManagementRole = 'administrator' | 'manager' | 'coordinator' | 'reviewer';

export interface Database {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string;
          email: string;
          full_name: string | null;
          avatar_url?: string | null;
          phone_number?: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id: string;
          email: string;
          full_name?: string | null;
          avatar_url?: string | null;
          phone_number?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          email?: string;
          full_name?: string | null;
          avatar_url?: string | null;
          phone_number?: string | null;
          created_at?: string;
          updated_at?: string;
        };
      };
      management_users: {
        Row: {
          id: string;
          user_id: string;
          role: ManagementRole;
          email: string;
          is_active: boolean;
          assigned_by?: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          role: ManagementRole;
          email: string;
          is_active?: boolean;
          assigned_by?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          role?: ManagementRole;
          email?: string;
          is_active?: boolean;
          assigned_by?: string | null;
          created_at?: string;
          updated_at?: string;
        };
      };
      meet_greet_settings: {
        Row: {
          id: string;
          celebrity_name: string;
          celebrity_title: string;
          celebrity_bio: string;
          celebrity_image_url: string | null;
          event_name: string;
          event_description: string;
          hero_title: string;
          hero_subtitle: string;
          event_logo_url: string | null;
          brand_primary_color: string;
          brand_secondary_color: string;
          support_email: string;
          support_phone: string | null;
          support_whatsapp: string | null;
          is_active: boolean;
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
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          celebrity_name: string;
          celebrity_title: string;
          celebrity_bio: string;
          celebrity_image_url?: string | null;
          event_name: string;
          event_description: string;
          hero_title: string;
          hero_subtitle: string;
          event_logo_url?: string | null;
          brand_primary_color?: string;
          brand_secondary_color?: string;
          support_email: string;
          support_phone?: string | null;
          support_whatsapp?: string | null;
          is_active?: boolean;
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
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          celebrity_name?: string;
          celebrity_title?: string;
          celebrity_bio?: string;
          celebrity_image_url?: string | null;
          event_name?: string;
          event_description?: string;
          hero_title?: string;
          hero_subtitle?: string;
          event_logo_url?: string | null;
          brand_primary_color?: string;
          brand_secondary_color?: string;
          support_email?: string;
          support_phone?: string | null;
          support_whatsapp?: string | null;
          is_active?: boolean;
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
          created_at?: string;
          updated_at?: string;
        };
      };
      terms_versions: {
        Row: {
          id: string;
          version: string;
          title: string;
          content: string;
          effective_date: string;
          is_current: boolean;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          version: string;
          title: string;
          content: string;
          effective_date?: string;
          is_current?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          version?: string;
          title?: string;
          content?: string;
          effective_date?: string;
          is_current?: boolean;
          created_at?: string;
          updated_at?: string;
        };
      };
      applications: {
        Row: {
          id: string;
          reference_code: string;
          full_name: string;
          email: string;
          phone: string;
          country: string;
          city: string;
          preferred_contact_method: string;
          preferred_date: string;
          preferred_session: string;
          attendee_count: number;
          special_requirements: string | null;
          message_to_management: string | null;
          terms_version: string;
          terms_accepted_at: string;
          privacy_accepted_at: string;
          status: string;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          reference_code: string;
          full_name: string;
          email: string;
          phone: string;
          country: string;
          city: string;
          preferred_contact_method?: string;
          preferred_date: string;
          preferred_session: string;
          attendee_count?: number;
          special_requirements?: string | null;
          message_to_management?: string | null;
          terms_version?: string;
          terms_accepted_at?: string;
          privacy_accepted_at?: string;
          status?: string;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          reference_code?: string;
          full_name?: string;
          email?: string;
          phone?: string;
          country?: string;
          city?: string;
          preferred_contact_method?: string;
          preferred_date?: string;
          preferred_session?: string;
          attendee_count?: number;
          special_requirements?: string | null;
          message_to_management?: string | null;
          terms_version?: string;
          terms_accepted_at?: string;
          privacy_accepted_at?: string;
          status?: string;
          created_at?: string;
          updated_at?: string;
        };
      };
      application_files: {
        Row: {
          id: string;
          application_id: string;
          file_type: string;
          cloudinary_url: string;
          public_id: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          application_id: string;
          file_type: string;
          cloudinary_url: string;
          public_id?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          application_id?: string;
          file_type?: string;
          cloudinary_url?: string;
          public_id?: string | null;
          created_at?: string;
        };
      };
    };
    Views: {
      [_ in never]: never;
    };
    Functions: {
      is_management_member: {
        Args: { user_id: string };
        Returns: boolean;
      };
      is_management_admin_or_manager: {
        Args: { user_id: string };
        Returns: boolean;
      };
    };
    Enums: {
      management_role: ManagementRole;
    };
    CompositeTypes: {
      [_ in never]: never;
    };
  };
}
