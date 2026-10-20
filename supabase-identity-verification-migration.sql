ALTER TABLE public.requests
  ADD COLUMN IF NOT EXISTS is_booking_for_someone_else BOOLEAN NOT NULL DEFAULT FALSE,
  ADD COLUMN IF NOT EXISTS meeting_person_name TEXT,
  ADD COLUMN IF NOT EXISTS meeting_person_phone TEXT,
  ADD COLUMN IF NOT EXISTS meeting_person_email TEXT,
  ADD COLUMN IF NOT EXISTS meeting_person_relationship TEXT,
  ADD COLUMN IF NOT EXISTS meeting_address TEXT,
  ADD COLUMN IF NOT EXISTS identity_document_type TEXT,
  ADD COLUMN IF NOT EXISTS identity_document_path TEXT,
  ADD COLUMN IF NOT EXISTS selfie_path TEXT,
  ADD COLUMN IF NOT EXISTS identity_consent BOOLEAN NOT NULL DEFAULT FALSE,
  ADD COLUMN IF NOT EXISTS identity_consent_at TIMESTAMPTZ;

ALTER TABLE public.vendors
  ADD COLUMN IF NOT EXISTS residential_address TEXT,
  ADD COLUMN IF NOT EXISTS identity_document_type TEXT,
  ADD COLUMN IF NOT EXISTS identity_document_path TEXT,
  ADD COLUMN IF NOT EXISTS selfie_path TEXT,
  ADD COLUMN IF NOT EXISTS identity_consent BOOLEAN NOT NULL DEFAULT FALSE,
  ADD COLUMN IF NOT EXISTS identity_consent_at TIMESTAMPTZ;

DROP POLICY IF EXISTS "Allow public operations on requests" ON public.requests;
DROP POLICY IF EXISTS "Allow public operations on vendors" ON public.vendors;
DROP POLICY IF EXISTS "Allow public operations on agreements" ON public.agreements;

REVOKE ALL ON TABLE public.requests FROM anon, authenticated;
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

DROP POLICY IF EXISTS "Block identity files for anonymous users" ON storage.objects;
CREATE POLICY "Block identity files for anonymous users"
  ON storage.objects AS RESTRICTIVE
  FOR ALL TO anon
  USING (bucket_id <> 'identity-verification')
  WITH CHECK (bucket_id <> 'identity-verification');

DROP POLICY IF EXISTS "Block identity files for authenticated users" ON storage.objects;
CREATE POLICY "Block identity files for authenticated users"
  ON storage.objects AS RESTRICTIVE
  FOR ALL TO authenticated
  USING (bucket_id <> 'identity-verification')
  WITH CHECK (bucket_id <> 'identity-verification');
