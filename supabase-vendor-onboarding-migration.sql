-- Vendor onboarding support for existing Supabase projects.
-- Safe to run more than once. The server uses the service-role key for writes.

CREATE TABLE IF NOT EXISTS public.vendors (
  id TEXT PRIMARY KEY,
  full_name TEXT NOT NULL,
  business_name TEXT,
  phone TEXT NOT NULL,
  email TEXT,
  category TEXT NOT NULL,
  specialties JSONB NOT NULL DEFAULT '[]'::jsonb,
  experience_years TEXT,
  operating_areas TEXT,
  reg_number TEXT,
  address TEXT,
  residential_address TEXT,
  identity_document_type TEXT,
  identity_document_path TEXT,
  selfie_path TEXT,
  identity_consent BOOLEAN NOT NULL DEFAULT FALSE,
  identity_consent_at TIMESTAMPTZ,
  verification_status TEXT DEFAULT 'pending',
  admin_notes TEXT,
  agreement_id TEXT,
  terms_version TEXT DEFAULT 'v1.0',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE public.vendors
  ADD COLUMN IF NOT EXISTS full_name TEXT,
  ADD COLUMN IF NOT EXISTS business_name TEXT,
  ADD COLUMN IF NOT EXISTS phone TEXT,
  ADD COLUMN IF NOT EXISTS email TEXT,
  ADD COLUMN IF NOT EXISTS category TEXT,
  ADD COLUMN IF NOT EXISTS specialties JSONB DEFAULT '[]'::jsonb,
  ADD COLUMN IF NOT EXISTS experience_years TEXT,
  ADD COLUMN IF NOT EXISTS operating_areas TEXT,
  ADD COLUMN IF NOT EXISTS reg_number TEXT,
  ADD COLUMN IF NOT EXISTS address TEXT,
  ADD COLUMN IF NOT EXISTS residential_address TEXT,
  ADD COLUMN IF NOT EXISTS identity_document_type TEXT,
  ADD COLUMN IF NOT EXISTS identity_document_path TEXT,
  ADD COLUMN IF NOT EXISTS selfie_path TEXT,
  ADD COLUMN IF NOT EXISTS identity_consent BOOLEAN NOT NULL DEFAULT FALSE,
  ADD COLUMN IF NOT EXISTS identity_consent_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS verification_status TEXT DEFAULT 'pending',
  ADD COLUMN IF NOT EXISTS admin_notes TEXT,
  ADD COLUMN IF NOT EXISTS agreement_id TEXT,
  ADD COLUMN IF NOT EXISTS terms_version TEXT DEFAULT 'v1.0',
  ADD COLUMN IF NOT EXISTS created_at TIMESTAMPTZ DEFAULT NOW(),
  ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT NOW();

CREATE INDEX IF NOT EXISTS idx_vendors_verification ON public.vendors (verification_status);
CREATE INDEX IF NOT EXISTS idx_vendors_created_at ON public.vendors (created_at DESC);

CREATE TABLE IF NOT EXISTS public.agreements (
  id TEXT PRIMARY KEY,
  user_name TEXT NOT NULL,
  contact TEXT NOT NULL,
  agreement_type TEXT NOT NULL,
  version TEXT DEFAULT 'v1.0',
  status BOOLEAN DEFAULT TRUE,
  context TEXT,
  ip TEXT,
  user_agent TEXT,
  related_entity_id TEXT,
  accepted_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.vendors ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.agreements ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Allow all on vendors" ON public.vendors;
DROP POLICY IF EXISTS "Allow public operations on vendors" ON public.vendors;
DROP POLICY IF EXISTS "Allow all on agreements" ON public.agreements;
DROP POLICY IF EXISTS "Allow public operations on agreements" ON public.agreements;
REVOKE ALL ON TABLE public.vendors FROM anon, authenticated;
REVOKE ALL ON TABLE public.agreements FROM anon, authenticated;

INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'identity-verification',
  'identity-verification',
  FALSE,
  4194304,
  ARRAY['image/jpeg', 'image/png', 'image/webp', 'application/pdf']
)
ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  public = FALSE,
  file_size_limit = EXCLUDED.file_size_limit,
  allowed_mime_types = EXCLUDED.allowed_mime_types;

-- Identity documents must only be accessed by the server using its service key.
DROP POLICY IF EXISTS "Block identity files for anonymous users" ON storage.objects;
CREATE POLICY "Block identity files for anonymous users"
  ON storage.objects AS RESTRICTIVE FOR ALL TO anon
  USING (bucket_id <> 'identity-verification')
  WITH CHECK (bucket_id <> 'identity-verification');

DROP POLICY IF EXISTS "Block identity files for authenticated users" ON storage.objects;
CREATE POLICY "Block identity files for authenticated users"
  ON storage.objects AS RESTRICTIVE FOR ALL TO authenticated
  USING (bucket_id <> 'identity-verification')
  WITH CHECK (bucket_id <> 'identity-verification');
