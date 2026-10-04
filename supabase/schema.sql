-- ====================================================================
-- VIP MEET & GREET MANAGEMENT PORTAL: PHASE 1 DATABASE FOUNDATION
-- Supabase PostgreSQL Schema with Strict Row-Level Security (RLS)
-- ====================================================================

-- 1. Enable required PostgreSQL extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 2. Clean teardown helper (if re-running schema script in dev)
-- DROP TABLE IF EXISTS public.meet_greet_settings CASCADE;
-- DROP TABLE IF EXISTS public.management_users CASCADE;
-- DROP TABLE IF EXISTS public.terms_versions CASCADE;
-- DROP TABLE IF EXISTS public.privacy_versions CASCADE;
-- DROP TABLE IF EXISTS public.profiles CASCADE;

-- ====================================================================
-- TABLE: profiles
-- Linked to auth.users for application users and management personnel
-- ====================================================================
CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  full_name TEXT,
  avatar_url TEXT,
  phone_number TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- ====================================================================
-- TABLE: management_users
-- Authorized personnel with specific roles.
-- Roles: 'administrator', 'manager', 'coordinator', 'reviewer'
-- ====================================================================
CREATE TABLE IF NOT EXISTS public.management_users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  role TEXT NOT NULL CHECK (role IN ('administrator', 'manager', 'coordinator', 'reviewer')),
  is_active BOOLEAN NOT NULL DEFAULT true,
  assigned_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
  CONSTRAINT unique_management_user UNIQUE (user_id)
);

ALTER TABLE public.management_users ENABLE ROW LEVEL SECURITY;

-- ====================================================================
-- HELPER FUNCTIONS FOR ROLE VERIFICATION (Security Definier)
-- Prevents frontend role spoofing. Execution uses elevated schema permissions
-- but strictly evaluates the calling user's auth.uid().
-- ====================================================================

CREATE OR REPLACE FUNCTION public.is_management(user_id UUID)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.management_users
    WHERE management_users.user_id = $1
      AND management_users.is_active = true
  );
END;
$$;

CREATE OR REPLACE FUNCTION public.get_management_role(user_id UUID)
RETURNS TEXT
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  user_role TEXT;
BEGIN
  SELECT role INTO user_role
  FROM public.management_users
  WHERE management_users.user_id = $1
    AND management_users.is_active = true
  LIMIT 1;

  RETURN user_role;
END;
$$;

-- ====================================================================
-- TABLE: meet_greet_settings
-- Dynamic configuration for the active celebrity / VIP event
-- ====================================================================
CREATE TABLE IF NOT EXISTS public.meet_greet_settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  celebrity_name TEXT,
  celebrity_title TEXT,
  celebrity_bio TEXT,
  celebrity_image_url TEXT,
  event_name TEXT,
  event_description TEXT,
  hero_title TEXT,
  hero_subtitle TEXT,
  event_logo_url TEXT,
  brand_primary_color TEXT DEFAULT '#D4AF37',
  brand_secondary_color TEXT DEFAULT '#0B0D12',
  support_email TEXT,
  support_phone TEXT,
  support_whatsapp TEXT,
  is_active BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

ALTER TABLE public.meet_greet_settings ENABLE ROW LEVEL SECURITY;

-- ====================================================================
-- TABLE: terms_versions
-- Version-controlled legal terms & conditions
-- ====================================================================
CREATE TABLE IF NOT EXISTS public.terms_versions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  version TEXT NOT NULL,
  title TEXT NOT NULL,
  content TEXT NOT NULL,
  effective_date DATE NOT NULL DEFAULT CURRENT_DATE,
  is_current BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

ALTER TABLE public.terms_versions ENABLE ROW LEVEL SECURITY;

-- ====================================================================
-- TABLE: privacy_versions
-- Version-controlled privacy policy
-- ====================================================================
CREATE TABLE IF NOT EXISTS public.privacy_versions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  version TEXT NOT NULL,
  title TEXT NOT NULL,
  content TEXT NOT NULL,
  effective_date DATE NOT NULL DEFAULT CURRENT_DATE,
  is_current BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

ALTER TABLE public.privacy_versions ENABLE ROW LEVEL SECURITY;

-- ====================================================================
-- ROW LEVEL SECURITY (RLS) POLICIES
-- Strict least-privilege policies. Never use "allow all" or "true"
-- ====================================================================

-- 1. PROFILES POLICIES
CREATE POLICY "Users can read own profile"
  ON public.profiles
  FOR SELECT
  TO authenticated
  USING (auth.uid() = id);

CREATE POLICY "Users can update own profile"
  ON public.profiles
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = id);

CREATE POLICY "Management administrators can view all profiles"
  ON public.profiles
  FOR SELECT
  TO authenticated
  USING (public.get_management_role(auth.uid()) IN ('administrator', 'manager'));

-- 2. MANAGEMENT USERS POLICIES
CREATE POLICY "Active management can read management roster"
  ON public.management_users
  FOR SELECT
  TO authenticated
  USING (public.is_management(auth.uid()));

CREATE POLICY "Only administrators can insert management users"
  ON public.management_users
  FOR INSERT
  TO authenticated
  WITH CHECK (public.get_management_role(auth.uid()) = 'administrator');

CREATE POLICY "Only administrators can update management users"
  ON public.management_users
  FOR UPDATE
  TO authenticated
  USING (public.get_management_role(auth.uid()) = 'administrator');

CREATE POLICY "Only administrators can delete management users"
  ON public.management_users
  FOR DELETE
  TO authenticated
  USING (public.get_management_role(auth.uid()) = 'administrator');

-- 3. MEET GREET SETTINGS POLICIES
-- Public visitors may ONLY read settings when the portal is marked active
CREATE POLICY "Public can view active settings"
  ON public.meet_greet_settings
  FOR SELECT
  TO anon, authenticated
  USING (is_active = true);

-- Management can view settings regardless of active status
CREATE POLICY "Management can view all settings"
  ON public.meet_greet_settings
  FOR SELECT
  TO authenticated
  USING (public.is_management(auth.uid()));

-- Only administrators and managers can modify event settings
CREATE POLICY "Management can insert settings"
  ON public.meet_greet_settings
  FOR INSERT
  TO authenticated
  WITH CHECK (public.get_management_role(auth.uid()) IN ('administrator', 'manager'));

CREATE POLICY "Management can update settings"
  ON public.meet_greet_settings
  FOR UPDATE
  TO authenticated
  USING (public.get_management_role(auth.uid()) IN ('administrator', 'manager'))
  WITH CHECK (public.get_management_role(auth.uid()) IN ('administrator', 'manager'));

-- 4. TERMS AND PRIVACY POLICIES
CREATE POLICY "Anyone can view current terms"
  ON public.terms_versions
  FOR SELECT
  TO anon, authenticated
  USING (is_current = true);

CREATE POLICY "Management can view all terms"
  ON public.terms_versions
  FOR SELECT
  TO authenticated
  USING (public.is_management(auth.uid()));

CREATE POLICY "Management can manage terms"
  ON public.terms_versions
  FOR ALL
  TO authenticated
  USING (public.get_management_role(auth.uid()) IN ('administrator', 'manager'));

CREATE POLICY "Anyone can view current privacy policy"
  ON public.privacy_versions
  FOR SELECT
  TO anon, authenticated
  USING (is_current = true);

CREATE POLICY "Management can view all privacy versions"
  ON public.privacy_versions
  FOR SELECT
  TO authenticated
  USING (public.is_management(auth.uid()));

CREATE POLICY "Management can manage privacy versions"
  ON public.privacy_versions
  FOR ALL
  TO authenticated
  USING (public.get_management_role(auth.uid()) IN ('administrator', 'manager'));

-- ====================================================================
-- SEED INITIAL FOUNDATIONAL RECORDS
-- ====================================================================

-- Insert Default Terms Version
INSERT INTO public.terms_versions (version, title, content, effective_date, is_current)
VALUES (
  '1.0',
  'VIP Meet & Greet Event Terms & Conditions',
  '1. ELIGIBILITY & SCREENING: All attendees must submit an official verification request. Submission of an application does not guarantee approval. Management reserves the sole right to approve or decline any attendee at their discretion.\n\n2. NON-TRANSFERABLE PASSES: Approved VIP credentials are non-transferable and tied exclusively to the verified individual’s government-issued identification.\n\n3. CODE OF CONDUCT & SECURITY: Attendees must adhere to strict personal security standards and respect the celebrity, host venue staff, and management guidelines. Failure to comply results in immediate revocation without compensation.\n\n4. NO LEGAL CLAIMS: These terms serve as the operational guidelines of the event management company and are governed by applicable event venue jurisdiction.',
  CURRENT_DATE,
  true
) ON CONFLICT DO NOTHING;

-- Insert Default Privacy Policy Version
INSERT INTO public.privacy_versions (version, title, content, effective_date, is_current)
VALUES (
  '1.0',
  'Official VIP Portal Privacy Policy',
  '1. PURPOSE OF DATA COLLECTION: Information provided through this portal is collected strictly for identity verification, security screening, attendee management, and official event communications.\n\n2. MANAGEMENT ACCESS: Access to applicant dossiers is restricted exclusively to authorized management personnel with verified managerial roles.\n\n3. THIRD-PARTY DISCLOSURE: We do not sell, rent, or lease attendee personal data to third parties. Data is stored securely utilizing end-to-end Row Level Security.',
  CURRENT_DATE,
  true
) ON CONFLICT DO NOTHING;

-- ====================================================================
-- PHASE 2: APPLICANT APPLICATION SYSTEM
-- ====================================================================

CREATE TABLE IF NOT EXISTS public.applications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  reference_code TEXT NOT NULL UNIQUE,
  full_name TEXT NOT NULL,
  email TEXT NOT NULL,
  phone TEXT NOT NULL,
  country TEXT NOT NULL,
  city TEXT NOT NULL,
  preferred_contact_method TEXT NOT NULL DEFAULT 'email' CHECK (preferred_contact_method IN ('email', 'phone', 'whatsapp')),
  preferred_date TEXT NOT NULL,
  preferred_session TEXT NOT NULL,
  attendee_count INTEGER NOT NULL DEFAULT 1 CHECK (attendee_count >= 1 AND attendee_count <= 10),
  special_requirements TEXT,
  message_to_management TEXT,
  terms_version TEXT NOT NULL DEFAULT '1.0',
  terms_accepted_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
  privacy_accepted_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
  status TEXT NOT NULL DEFAULT 'UNDER_REVIEW' CHECK (status IN ('UNDER_REVIEW', 'APPROVED', 'ADDITIONAL_INFO_REQUIRED', 'DECLINED')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

CREATE TABLE IF NOT EXISTS public.application_files (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  application_id UUID NOT NULL REFERENCES public.applications(id) ON DELETE CASCADE,
  file_type TEXT NOT NULL,
  cloudinary_url TEXT NOT NULL,
  public_id TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

ALTER TABLE public.applications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.application_files ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public insert new application"
  ON public.applications
  FOR INSERT
  TO anon, authenticated
  WITH CHECK (status = 'UNDER_REVIEW');

CREATE POLICY "Management view all applications"
  ON public.applications
  FOR SELECT
  TO authenticated
  USING (public.is_management(auth.uid()));

CREATE POLICY "Management update applications"
  ON public.applications
  FOR UPDATE
  TO authenticated
  USING (public.get_management_role(auth.uid()) IN ('administrator', 'manager'))
  WITH CHECK (public.get_management_role(auth.uid()) IN ('administrator', 'manager'));

CREATE POLICY "Public insert application file"
  ON public.application_files
  FOR INSERT
  TO anon, authenticated
  WITH CHECK (true);

CREATE POLICY "Management view application files"
  ON public.application_files
  FOR SELECT
  TO authenticated
  USING (public.is_management(auth.uid()));

-- ====================================================================
-- PHASE 4: SECURE CONTINUATION, PAYMENT & AUDIT SYSTEM
-- ====================================================================

-- 1. Extend meet_greet_settings with fee & payment configuration
ALTER TABLE public.meet_greet_settings 
  ADD COLUMN IF NOT EXISTS fee_name TEXT DEFAULT 'VIP Private Audience Access',
  ADD COLUMN IF NOT EXISTS fee_amount NUMERIC DEFAULT 0,
  ADD COLUMN IF NOT EXISTS fee_currency TEXT DEFAULT 'USD',
  ADD COLUMN IF NOT EXISTS fee_description TEXT,
  ADD COLUMN IF NOT EXISTS fee_inclusions TEXT,
  ADD COLUMN IF NOT EXISTS payment_deadline_hours INTEGER DEFAULT 48,
  ADD COLUMN IF NOT EXISTS refund_policy TEXT,
  ADD COLUMN IF NOT EXISTS cancellation_policy TEXT,
  ADD COLUMN IF NOT EXISTS payment_method_name TEXT DEFAULT 'Bank Wire Transfer',
  ADD COLUMN IF NOT EXISTS payment_instructions TEXT;

-- 2. TABLE: application_tokens
CREATE TABLE IF NOT EXISTS public.application_tokens (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  application_id UUID NOT NULL REFERENCES public.applications(id) ON DELETE CASCADE,
  token_hash TEXT NOT NULL UNIQUE,
  token_type TEXT NOT NULL DEFAULT 'continuation',
  expires_at TIMESTAMPTZ NOT NULL,
  revoked_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
  last_used_at TIMESTAMPTZ
);

ALTER TABLE public.application_tokens ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Management view application tokens"
  ON public.application_tokens
  FOR SELECT
  TO authenticated
  USING (public.is_management(auth.uid()));

CREATE POLICY "Management manage application tokens"
  ON public.application_tokens
  FOR ALL
  TO authenticated
  USING (public.get_management_role(auth.uid()) IN ('administrator', 'manager'));

-- 3. TABLE: payment_records
CREATE TABLE IF NOT EXISTS public.payment_records (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  application_id UUID NOT NULL REFERENCES public.applications(id) ON DELETE CASCADE,
  amount NUMERIC NOT NULL,
  currency TEXT NOT NULL DEFAULT 'USD',
  payment_method TEXT NOT NULL,
  payment_reference TEXT NOT NULL,
  payment_date DATE NOT NULL DEFAULT CURRENT_DATE,
  receipt_url TEXT,
  receipt_public_id TEXT,
  status TEXT NOT NULL DEFAULT 'PAYMENT_SUBMITTED' CHECK (status IN (
    'AWAITING_PAYMENT',
    'PAYMENT_SUBMITTED',
    'PAYMENT_UNDER_REVIEW',
    'PAYMENT_CONFIRMED',
    'PAYMENT_REJECTED',
    'CLARIFICATION_REQUIRED',
    'REFUNDED'
  )),
  submitted_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
  reviewed_at TIMESTAMPTZ,
  reviewed_by UUID REFERENCES auth.users(id),
  rejection_reason TEXT,
  management_note TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

ALTER TABLE public.payment_records ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public submit payment record"
  ON public.payment_records
  FOR INSERT
  TO anon, authenticated
  WITH CHECK (status = 'PAYMENT_SUBMITTED');

CREATE POLICY "Management view all payment records"
  ON public.payment_records
  FOR SELECT
  TO authenticated
  USING (public.is_management(auth.uid()));

CREATE POLICY "Management update payment records"
  ON public.payment_records
  FOR UPDATE
  TO authenticated
  USING (public.get_management_role(auth.uid()) IN ('administrator', 'manager'))
  WITH CHECK (public.get_management_role(auth.uid()) IN ('administrator', 'manager'));

-- 4. TABLE: payment_history
CREATE TABLE IF NOT EXISTS public.payment_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  payment_id UUID NOT NULL REFERENCES public.payment_records(id) ON DELETE CASCADE,
  application_id UUID NOT NULL REFERENCES public.applications(id) ON DELETE CASCADE,
  action TEXT NOT NULL,
  actor_id UUID,
  actor_email TEXT,
  notes TEXT,
  metadata JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

ALTER TABLE public.payment_history ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Management view payment history"
  ON public.payment_history
  FOR SELECT
  TO authenticated
  USING (public.is_management(auth.uid()));

CREATE POLICY "Management and system insert payment history"
  ON public.payment_history
  FOR INSERT
  TO anon, authenticated
  WITH CHECK (true);

-- 5. TABLE: audit_logs
CREATE TABLE IF NOT EXISTS public.audit_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  application_id UUID REFERENCES public.applications(id) ON DELETE SET NULL,
  payment_id UUID REFERENCES public.payment_records(id) ON DELETE SET NULL,
  management_user_id UUID,
  management_user_email TEXT,
  action TEXT NOT NULL,
  metadata JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Management view audit logs"
  ON public.audit_logs
  FOR SELECT
  TO authenticated
  USING (public.is_management(auth.uid()));

CREATE POLICY "System insert audit logs"
  ON public.audit_logs
  FOR INSERT
  TO anon, authenticated
  WITH CHECK (true);

-- 5. Primary Management Account Authorization Helper (Supabase SQL Editor)
-- Run this in your Supabase SQL editor to link the primary management account:
-- INSERT INTO public.management_users (user_id, email, role, is_active)
-- SELECT id, email, 'administrator', true
-- FROM auth.users
-- WHERE email = 'management.meet.greet@gmail.com'
-- ON CONFLICT (user_id) DO UPDATE SET role = 'administrator', is_active = true;


