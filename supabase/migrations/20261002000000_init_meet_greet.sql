-- Migration: 20261002000000_init_meet_greet.sql
-- VIP Meet & Greet Management Portal Schema

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  full_name TEXT,
  created_at TIMESTAMPTZ DEFAULT TIMEZONE('utc', NOW()) NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT TIMEZONE('utc', NOW()) NOT NULL
);

CREATE TABLE IF NOT EXISTS public.management_users (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  role TEXT NOT NULL CHECK (role IN ('administrator', 'manager', 'coordinator', 'reviewer')),
  full_name TEXT NOT NULL,
  email TEXT NOT NULL UNIQUE,
  created_at TIMESTAMPTZ DEFAULT TIMEZONE('utc', NOW()) NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT TIMEZONE('utc', NOW()) NOT NULL
);

CREATE TABLE IF NOT EXISTS public.meet_greet_settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  celebrity_name TEXT NOT NULL,
  celebrity_title TEXT NOT NULL,
  celebrity_bio TEXT NOT NULL,
  celebrity_image_url TEXT,
  event_name TEXT NOT NULL,
  event_description TEXT NOT NULL,
  hero_title TEXT NOT NULL,
  hero_subtitle TEXT NOT NULL,
  event_logo_url TEXT,
  brand_primary_color TEXT DEFAULT '#D4AF37' NOT NULL,
  brand_secondary_color TEXT DEFAULT '#0B0D12' NOT NULL,
  support_email TEXT NOT NULL,
  support_phone TEXT,
  support_whatsapp TEXT,
  is_active BOOLEAN DEFAULT true NOT NULL,
  created_at TIMESTAMPTZ DEFAULT TIMEZONE('utc', NOW()) NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT TIMEZONE('utc', NOW()) NOT NULL
);

CREATE TABLE IF NOT EXISTS public.terms_versions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  version TEXT NOT NULL,
  title TEXT NOT NULL,
  content TEXT NOT NULL,
  effective_date DATE DEFAULT CURRENT_DATE NOT NULL,
  is_current BOOLEAN DEFAULT true NOT NULL,
  created_at TIMESTAMPTZ DEFAULT TIMEZONE('utc', NOW()) NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT TIMEZONE('utc', NOW()) NOT NULL
);

CREATE OR REPLACE FUNCTION public.is_management_member(user_id UUID)
RETURNS BOOLEAN
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
STABLE
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.management_users
    WHERE id = user_id
  );
$$;

CREATE OR REPLACE FUNCTION public.is_management_admin_or_manager(user_id UUID)
RETURNS BOOLEAN
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
STABLE
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.management_users
    WHERE id = user_id AND role IN ('administrator', 'manager')
  );
$$;

CREATE OR REPLACE FUNCTION public.handle_updated_at()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.updated_at = TIMEZONE('utc', NOW());
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS set_profiles_updated_at ON public.profiles;
CREATE TRIGGER set_profiles_updated_at
BEFORE UPDATE ON public.profiles
FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

DROP TRIGGER IF EXISTS set_management_users_updated_at ON public.management_users;
CREATE TRIGGER set_management_users_updated_at
BEFORE UPDATE ON public.management_users
FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

DROP TRIGGER IF EXISTS set_meet_greet_settings_updated_at ON public.meet_greet_settings;
CREATE TRIGGER set_meet_greet_settings_updated_at
BEFORE UPDATE ON public.meet_greet_settings
FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

DROP TRIGGER IF EXISTS set_terms_versions_updated_at ON public.terms_versions;
CREATE TRIGGER set_terms_versions_updated_at
BEFORE UPDATE ON public.terms_versions
FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.management_users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.meet_greet_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.terms_versions ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view own profile" ON public.profiles;
CREATE POLICY "Users can view own profile"
  ON public.profiles FOR SELECT
  TO authenticated
  USING (id = auth.uid() OR public.is_management_member(auth.uid()));

DROP POLICY IF EXISTS "Users can update own profile" ON public.profiles;
CREATE POLICY "Users can update own profile"
  ON public.profiles FOR UPDATE
  TO authenticated
  USING (id = auth.uid())
  WITH CHECK (id = auth.uid());

DROP POLICY IF EXISTS "Management users can view own record" ON public.management_users;
CREATE POLICY "Management users can view own record"
  ON public.management_users FOR SELECT
  TO authenticated
  USING (id = auth.uid());

DROP POLICY IF EXISTS "Administrators can view all management users" ON public.management_users;
CREATE POLICY "Administrators can view all management users"
  ON public.management_users FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.management_users mu
      WHERE mu.id = auth.uid() AND mu.role = 'administrator'
    )
  );

DROP POLICY IF EXISTS "Public can view active event settings" ON public.meet_greet_settings;
CREATE POLICY "Public can view active event settings"
  ON public.meet_greet_settings FOR SELECT
  TO anon, authenticated
  USING (is_active = true);

DROP POLICY IF EXISTS "Management can view all event settings" ON public.meet_greet_settings;
CREATE POLICY "Management can view all event settings"
  ON public.meet_greet_settings FOR SELECT
  TO authenticated
  USING (public.is_management_member(auth.uid()));

DROP POLICY IF EXISTS "Authorized management can update event settings" ON public.meet_greet_settings;
CREATE POLICY "Authorized management can update event settings"
  ON public.meet_greet_settings FOR UPDATE
  TO authenticated
  USING (public.is_management_admin_or_manager(auth.uid()))
  WITH CHECK (public.is_management_admin_or_manager(auth.uid()));

DROP POLICY IF EXISTS "Authorized management can insert event settings" ON public.meet_greet_settings;
CREATE POLICY "Authorized management can insert event settings"
  ON public.meet_greet_settings FOR INSERT
  TO authenticated
  WITH CHECK (public.is_management_admin_or_manager(auth.uid()));

DROP POLICY IF EXISTS "Public can view current terms" ON public.terms_versions;
CREATE POLICY "Public can view current terms"
  ON public.terms_versions FOR SELECT
  TO anon, authenticated
  USING (is_current = true);

DROP POLICY IF EXISTS "Management can view all terms versions" ON public.terms_versions;
CREATE POLICY "Management can view all terms versions"
  ON public.terms_versions FOR SELECT
  TO authenticated
  USING (public.is_management_member(auth.uid()));

DROP POLICY IF EXISTS "Authorized management can modify terms" ON public.terms_versions;
CREATE POLICY "Authorized management can modify terms"
  ON public.terms_versions FOR ALL
  TO authenticated
  USING (public.is_management_admin_or_manager(auth.uid()))
  WITH CHECK (public.is_management_admin_or_manager(auth.uid()));
