-- ====================================================================
-- VIP MEET & GREET: PHASE 2 APPLICATION SYSTEM EXTENSION
-- Tables: applications, application_files
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

-- Indices for performance & duplicate detection
CREATE INDEX IF NOT EXISTS idx_applications_email ON public.applications(email);
CREATE INDEX IF NOT EXISTS idx_applications_reference ON public.applications(reference_code);
CREATE INDEX IF NOT EXISTS idx_applications_status ON public.applications(status);
CREATE INDEX IF NOT EXISTS idx_applications_created ON public.applications(created_at DESC);

-- Enable RLS
ALTER TABLE public.applications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.application_files ENABLE ROW LEVEL SECURITY;

-- 1. Public Insertion: Applicants can insert their application, enforcing status = 'UNDER_REVIEW'
DROP POLICY IF EXISTS "Public insert new application" ON public.applications;
CREATE POLICY "Public insert new application"
  ON public.applications
  FOR INSERT
  TO anon, authenticated
  WITH CHECK (status = 'UNDER_REVIEW');

-- 2. Management Access: Authorized management can read all applicant dossiers
DROP POLICY IF EXISTS "Management view all applications" ON public.applications;
CREATE POLICY "Management view all applications"
  ON public.applications
  FOR SELECT
  TO authenticated
  USING (public.is_management(auth.uid()));

-- 3. Management Updates: Only management administrators and managers can update application status
DROP POLICY IF EXISTS "Management update applications" ON public.applications;
CREATE POLICY "Management update applications"
  ON public.applications
  FOR UPDATE
  TO authenticated
  USING (public.get_management_role(auth.uid()) IN ('administrator', 'manager'))
  WITH CHECK (public.get_management_role(auth.uid()) IN ('administrator', 'manager'));

-- 4. Application Files Policies
DROP POLICY IF EXISTS "Public insert application file" ON public.application_files;
CREATE POLICY "Public insert application file"
  ON public.application_files
  FOR INSERT
  TO anon, authenticated
  WITH CHECK (true);

DROP POLICY IF EXISTS "Management view application files" ON public.application_files;
CREATE POLICY "Management view application files"
  ON public.application_files
  FOR SELECT
  TO authenticated
  USING (public.is_management(auth.uid()));
