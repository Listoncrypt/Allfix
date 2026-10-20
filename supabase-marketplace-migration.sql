CREATE TABLE IF NOT EXISTS public.vehicles (
  id TEXT PRIMARY KEY,
  title TEXT NOT NULL,
  make TEXT,
  model TEXT,
  year TEXT,
  vehicle_type TEXT DEFAULT 'SUV / Jeep',
  price TEXT,
  mileage TEXT,
  seating_capacity TEXT,
  transmission TEXT DEFAULT 'Automatic',
  fuel_type TEXT DEFAULT 'Petrol',
  condition TEXT DEFAULT 'Foreign Used (Tokunbo)',
  color TEXT,
  location TEXT NOT NULL,
  description TEXT,
  full_specifications TEXT,
  image_url TEXT,
  images JSONB NOT NULL DEFAULT '[]'::jsonb,
  status TEXT DEFAULT 'available',
  created_at TIMESTAMPTZ NOT NULL DEFAULT TIMEZONE('utc', NOW()),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT TIMEZONE('utc', NOW())
);

ALTER TABLE public.vehicles
  ADD COLUMN IF NOT EXISTS images JSONB NOT NULL DEFAULT '[]'::jsonb,
  ADD COLUMN IF NOT EXISTS seating_capacity TEXT,
  ADD COLUMN IF NOT EXISTS full_specifications TEXT;

CREATE TABLE IF NOT EXISTS public.marketing_requests (
  id TEXT PRIMARY KEY,
  asset_type TEXT NOT NULL CHECK (asset_type IN ('property', 'car')),
  owner_name TEXT NOT NULL,
  phone TEXT NOT NULL,
  email TEXT,
  location TEXT NOT NULL,
  price TEXT,
  description TEXT,
  images JSONB NOT NULL DEFAULT '[]'::jsonb,
  property_type TEXT,
  listing_purpose TEXT,
  title_document TEXT,
  land_size TEXT,
  car_type TEXT,
  car_colour TEXT,
  car_make_model_year TEXT,
  custom_duty_paid TEXT,
  car_condition TEXT,
  accident_history TEXT,
  engine_gear_status TEXT,
  first_body TEXT,
  status TEXT NOT NULL DEFAULT 'pending_review',
  admin_notes TEXT,
  agreement_id TEXT,
  published_listing_id TEXT,
  terms_version TEXT NOT NULL DEFAULT 'v1.0',
  created_at TIMESTAMPTZ NOT NULL DEFAULT TIMEZONE('utc', NOW()),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT TIMEZONE('utc', NOW())
);

ALTER TABLE public.marketing_requests
  ADD COLUMN IF NOT EXISTS published_listing_id TEXT;

CREATE TABLE IF NOT EXISTS public.vendor_works (
  id TEXT PRIMARY KEY,
  job_type TEXT NOT NULL,
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  vendor_name TEXT,
  vendor_id TEXT,
  location TEXT,
  image_url TEXT,
  images JSONB NOT NULL DEFAULT '[]'::jsonb,
  status TEXT NOT NULL DEFAULT 'published',
  created_at TIMESTAMPTZ NOT NULL DEFAULT TIMEZONE('utc', NOW()),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT TIMEZONE('utc', NOW())
);

CREATE INDEX IF NOT EXISTS idx_vehicles_status ON public.vehicles(status);
CREATE INDEX IF NOT EXISTS idx_vehicles_created_at ON public.vehicles(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_marketing_requests_type ON public.marketing_requests(asset_type);
CREATE INDEX IF NOT EXISTS idx_marketing_requests_status ON public.marketing_requests(status);
CREATE INDEX IF NOT EXISTS idx_marketing_requests_created_at ON public.marketing_requests(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_vendor_works_job_type ON public.vendor_works(job_type);
CREATE INDEX IF NOT EXISTS idx_vendor_works_status ON public.vendor_works(status);
CREATE INDEX IF NOT EXISTS idx_vendor_works_created_at ON public.vendor_works(created_at DESC);

ALTER TABLE public.vehicles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.marketing_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.vendor_works ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Allow public operations on vehicles" ON public.vehicles;
DROP POLICY IF EXISTS "Allow public operations on marketing_requests" ON public.marketing_requests;
DROP POLICY IF EXISTS "Allow public operations on vendor_works" ON public.vendor_works;

REVOKE ALL ON TABLE public.vehicles FROM anon, authenticated;
REVOKE ALL ON TABLE public.marketing_requests FROM anon, authenticated;
REVOKE ALL ON TABLE public.vendor_works FROM anon, authenticated;
GRANT ALL ON TABLE public.vehicles TO service_role;
GRANT ALL ON TABLE public.marketing_requests TO service_role;
GRANT ALL ON TABLE public.vendor_works TO service_role;

NOTIFY pgrst, 'reload schema';
