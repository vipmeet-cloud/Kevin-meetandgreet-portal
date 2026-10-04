-- ====================================================================
-- VIP MEET & GREET MANAGEMENT PORTAL: PHASE 3 DATABASE SCHEMA UPDATE
-- Management Application Review, Approval Workflow, Continuation Tokens & Audit Logs
-- ====================================================================

-- 1. Ensure status check constraint allows Phase 3 internal statuses
ALTER TABLE public.applications 
  DROP CONSTRAINT IF EXISTS applications_status_check;

ALTER TABLE public.applications 
  ADD CONSTRAINT applications_status_check 
  CHECK (status IN (
    'UNDER_REVIEW', 
    'APPROVED_AWAITING_COMPLETION', 
    'APPROVED', 
    'INFORMATION_REQUIRED', 
    'ADDITIONAL_INFO_REQUIRED', 
    'DECLINED'
  ));

-- 2. Add continuation token, decline reason, and management response columns
ALTER TABLE public.applications
  ADD COLUMN IF NOT EXISTS continuation_token TEXT UNIQUE,
  ADD COLUMN IF NOT EXISTS continuation_token_expires_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS decline_reason TEXT,
  ADD COLUMN IF NOT EXISTS information_requested_message TEXT,
  ADD COLUMN IF NOT EXISTS management_notes TEXT,
  ADD COLUMN IF NOT EXISTS approved_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS approved_by UUID REFERENCES auth.users(id),
  ADD COLUMN IF NOT EXISTS declined_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS declined_by UUID REFERENCES auth.users(id);

-- Create index for fast continuation token lookups
CREATE INDEX IF NOT EXISTS idx_applications_continuation_token 
  ON public.applications(continuation_token) 
  WHERE continuation_token IS NOT NULL;

-- 3. Audit Logs Table
CREATE TABLE IF NOT EXISTS public.audit_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  action TEXT NOT NULL,
  application_id UUID REFERENCES public.applications(id) ON DELETE CASCADE,
  management_user_id UUID REFERENCES auth.users(id),
  management_user_email TEXT,
  metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

CREATE INDEX IF NOT EXISTS idx_audit_logs_application_id 
  ON public.audit_logs(application_id);

CREATE INDEX IF NOT EXISTS idx_audit_logs_created_at 
  ON public.audit_logs(created_at DESC);

-- Enable RLS on audit_logs
ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;

-- Management users can view audit logs
CREATE POLICY "Management view audit logs"
  ON public.audit_logs
  FOR SELECT
  TO authenticated
  USING (public.is_management(auth.uid()));

-- Management users can insert audit logs
CREATE POLICY "Management insert audit logs"
  ON public.audit_logs
  FOR INSERT
  TO authenticated
  WITH CHECK (public.is_management(auth.uid()));

-- Continuation token verification: allow public to read specific token record for /continue/:token
CREATE POLICY "Public verify continuation token"
  ON public.applications
  FOR SELECT
  TO anon, authenticated
  USING (
    continuation_token IS NOT NULL 
    AND continuation_token_expires_at > timezone('utc'::text, now())
  );
