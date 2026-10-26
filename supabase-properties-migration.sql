ALTER TABLE public.properties
  ADD COLUMN IF NOT EXISTS id TEXT,
  ADD COLUMN IF NOT EXISTS title TEXT,
  ADD COLUMN IF NOT EXISTS location TEXT,
  ADD COLUMN IF NOT EXISTS state TEXT,
  ADD COLUMN IF NOT EXISTS listing_purpose TEXT DEFAULT 'For Sale',
  ADD COLUMN IF NOT EXISTS property_type TEXT DEFAULT 'Residential',
  ADD COLUMN IF NOT EXISTS price TEXT,
  ADD COLUMN IF NOT EXISTS size TEXT,
  ADD COLUMN IF NOT EXISTS title_document TEXT,
  ADD COLUMN IF NOT EXISTS description TEXT,
  ADD COLUMN IF NOT EXISTS image_url TEXT,
  ADD COLUMN IF NOT EXISTS images JSONB DEFAULT '[]'::jsonb,
  ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'available',
  ADD COLUMN IF NOT EXISTS created_at TIMESTAMPTZ DEFAULT TIMEZONE('utc', NOW()),
  ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT TIMEZONE('utc', NOW());

CREATE INDEX IF NOT EXISTS idx_properties_status ON public.properties(status);
CREATE INDEX IF NOT EXISTS idx_properties_created_at ON public.properties(created_at DESC);

REVOKE ALL ON TABLE public.properties FROM anon, authenticated;
GRANT ALL ON TABLE public.properties TO service_role;

NOTIFY pgrst, 'reload schema';
