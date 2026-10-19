-- ==============================================================================
-- ALLFIX Services Xpress — Supabase Database Schema & Realtime Setup
-- Run this script in your Supabase Project SQL Editor (https://supabase.com/dashboard)
-- ==============================================================================

-- 1. Enable UUID Extension (if needed)
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 2. Customer Service Requests Table
CREATE TABLE IF NOT EXISTS public.requests (
  id TEXT PRIMARY KEY,
  customer_name TEXT NOT NULL,
  phone TEXT NOT NULL,
  email TEXT,
  category TEXT NOT NULL,
  service TEXT,
  location TEXT,
  urgency TEXT DEFAULT 'Medium',
  preferred_date TEXT,
  description TEXT NOT NULL,
  bedrooms TEXT,
  preferred_locations JSONB DEFAULT '[]'::jsonb,
  property_budget TEXT,
  property_timeline TEXT,
  car_type TEXT,
  car_model_year TEXT,
  is_electric_vehicle TEXT,
  car_colours JSONB DEFAULT '[]'::jsonb,
  car_budget TEXT,
  property_types JSONB DEFAULT '[]'::jsonb,
  property_type_other TEXT,
  construction_description TEXT,
  land_size TEXT,
  land_size_other TEXT,
  land_status TEXT,
  status TEXT DEFAULT 'pending_matching',
  admin_notes TEXT,
  agreement_id TEXT,
  terms_version TEXT DEFAULT 'v1.0',
  created_at TIMESTAMPTZ DEFAULT TIMEZONE('utc', NOW()),
  updated_at TIMESTAMPTZ DEFAULT TIMEZONE('utc', NOW())
);

-- Upgrade existing requests table with any missing columns (Safe & Non-destructive)
ALTER TABLE public.requests ADD COLUMN IF NOT EXISTS bedrooms TEXT;
ALTER TABLE public.requests ADD COLUMN IF NOT EXISTS preferred_locations JSONB DEFAULT '[]'::jsonb;
ALTER TABLE public.requests ADD COLUMN IF NOT EXISTS property_budget TEXT;
ALTER TABLE public.requests ADD COLUMN IF NOT EXISTS property_timeline TEXT;
ALTER TABLE public.requests ADD COLUMN IF NOT EXISTS car_type TEXT;
ALTER TABLE public.requests ADD COLUMN IF NOT EXISTS car_model_year TEXT;
ALTER TABLE public.requests ADD COLUMN IF NOT EXISTS is_electric_vehicle TEXT;
ALTER TABLE public.requests ADD COLUMN IF NOT EXISTS car_colours JSONB DEFAULT '[]'::jsonb;
ALTER TABLE public.requests ADD COLUMN IF NOT EXISTS car_budget TEXT;

-- Index for speedy queries by status and date
CREATE INDEX IF NOT EXISTS idx_requests_status ON public.requests(status);
CREATE INDEX IF NOT EXISTS idx_requests_created_at ON public.requests(created_at DESC);

-- 3. Vendor Onboarding Table
CREATE TABLE IF NOT EXISTS public.vendors (
  id TEXT PRIMARY KEY,
  full_name TEXT NOT NULL,
  business_name TEXT,
  phone TEXT NOT NULL,
  email TEXT,
  category TEXT NOT NULL,
  specialties JSONB DEFAULT '[]'::jsonb,
  experience_years TEXT,
  operating_areas TEXT,
  reg_number TEXT,
  address TEXT,
  verification_status TEXT DEFAULT 'pending',
  admin_notes TEXT,
  agreement_id TEXT,
  terms_version TEXT DEFAULT 'v1.0',
  created_at TIMESTAMPTZ DEFAULT TIMEZONE('utc', NOW()),
  updated_at TIMESTAMPTZ DEFAULT TIMEZONE('utc', NOW())
);

CREATE INDEX IF NOT EXISTS idx_vendors_verification ON public.vendors(verification_status);

-- 4. Terms & Conditions Compliance Audit Table
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
  accepted_at TIMESTAMPTZ DEFAULT TIMEZONE('utc', NOW())
);

CREATE INDEX IF NOT EXISTS idx_agreements_type ON public.agreements(agreement_type);

-- 5. Contact Inquiries Table
CREATE TABLE IF NOT EXISTS public.messages (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  email TEXT,
  phone TEXT,
  subject TEXT,
  message TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT TIMEZONE('utc', NOW())
);

-- 6. Available Properties & Land Table
CREATE TABLE IF NOT EXISTS public.properties (
  id TEXT PRIMARY KEY,
  title TEXT NOT NULL,
  location TEXT NOT NULL,
  property_type TEXT DEFAULT 'Residential',
  price TEXT,
  size TEXT,
  title_document TEXT,
  description TEXT,
  image_url TEXT,
  images JSONB DEFAULT '[]'::jsonb,
  status TEXT DEFAULT 'available',
  created_at TIMESTAMPTZ DEFAULT TIMEZONE('utc', NOW()),
  updated_at TIMESTAMPTZ DEFAULT TIMEZONE('utc', NOW())
);

ALTER TABLE public.properties ADD COLUMN IF NOT EXISTS images JSONB DEFAULT '[]'::jsonb;

CREATE INDEX IF NOT EXISTS idx_properties_status ON public.properties(status);
CREATE INDEX IF NOT EXISTS idx_properties_created_at ON public.properties(created_at DESC);

-- 7. Available Automobiles & Vehicles Table
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
  images JSONB DEFAULT '[]'::jsonb,
  status TEXT DEFAULT 'available',
  created_at TIMESTAMPTZ DEFAULT TIMEZONE('utc', NOW()),
  updated_at TIMESTAMPTZ DEFAULT TIMEZONE('utc', NOW())
);

ALTER TABLE public.vehicles ADD COLUMN IF NOT EXISTS images JSONB DEFAULT '[]'::jsonb;
ALTER TABLE public.vehicles ADD COLUMN IF NOT EXISTS seating_capacity TEXT;
ALTER TABLE public.vehicles ADD COLUMN IF NOT EXISTS full_specifications TEXT;

CREATE INDEX IF NOT EXISTS idx_vehicles_status ON public.vehicles(status);
CREATE INDEX IF NOT EXISTS idx_vehicles_created_at ON public.vehicles(created_at DESC);

-- 8. Owner Asset Marketing Submissions Table (Properties & Vehicles)
CREATE TABLE IF NOT EXISTS public.marketing_requests (
  id TEXT PRIMARY KEY,                       -- e.g. 'MKT-PROP-XXXX' or 'MKT-CAR-XXXX'
  asset_type TEXT NOT NULL,                  -- 'property' or 'car'
  owner_name TEXT NOT NULL,
  phone TEXT NOT NULL,
  email TEXT,
  location TEXT NOT NULL,
  price TEXT,
  description TEXT,
  images JSONB DEFAULT '[]'::jsonb,
  -- Property-specific fields:
  property_type TEXT,
  listing_purpose TEXT,                      -- 'For Sale', 'For Rent / Lease'
  title_document TEXT,
  land_size TEXT,
  -- Car-specific fields:
  car_type TEXT,
  car_colour TEXT,
  car_make_model_year TEXT,
  custom_duty_paid TEXT,                     -- 'Yes', 'No'
  car_condition TEXT,                        -- 'Brand New', 'Fairly Used (Tokunbo)', 'Fairly Used (Nigerian)'
  accident_history TEXT,                     -- 'Accident Free', 'Accidented'
  engine_gear_status TEXT,                   -- 'Untempered engine and gear', 'Tempered engine and gear'
  first_body TEXT,                           -- 'Yes', 'No'
  -- Management & Compliance:
  status TEXT DEFAULT 'pending_review',      -- 'pending_review', 'contacted', 'inspected', 'published', 'rejected'
  admin_notes TEXT,
  agreement_id TEXT,
  terms_version TEXT DEFAULT 'v1.0',
  created_at TIMESTAMPTZ DEFAULT TIMEZONE('utc', NOW()),
  updated_at TIMESTAMPTZ DEFAULT TIMEZONE('utc', NOW())
);

CREATE INDEX IF NOT EXISTS idx_marketing_requests_type ON public.marketing_requests(asset_type);
CREATE INDEX IF NOT EXISTS idx_marketing_requests_status ON public.marketing_requests(status);
CREATE INDEX IF NOT EXISTS idx_marketing_requests_created_at ON public.marketing_requests(created_at DESC);

-- 8. Vendor Handiwork & Completed Jobs Showcase (public.vendor_works)
CREATE TABLE IF NOT EXISTS public.vendor_works (
  id TEXT PRIMARY KEY,
  job_type TEXT NOT NULL,                     -- 'Plumbing', 'Carpentry', 'Electrical', 'Painting & Tiling', etc.
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  vendor_name TEXT,
  vendor_id TEXT,
  location TEXT,
  image_url TEXT,
  images JSONB DEFAULT '[]'::jsonb,
  status TEXT DEFAULT 'published',            -- 'published', 'archived', 'draft'
  created_at TIMESTAMPTZ DEFAULT TIMEZONE('utc', NOW()),
  updated_at TIMESTAMPTZ DEFAULT TIMEZONE('utc', NOW())
);

CREATE INDEX IF NOT EXISTS idx_vendor_works_job_type ON public.vendor_works(job_type);
CREATE INDEX IF NOT EXISTS idx_vendor_works_status ON public.vendor_works(status);
CREATE INDEX IF NOT EXISTS idx_vendor_works_created_at ON public.vendor_works(created_at DESC);

-- ==============================================================================
-- Row Level Security (RLS) Configuration
-- ==============================================================================
ALTER TABLE public.requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.vendors ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.agreements ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.properties ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.vehicles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.marketing_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.vendor_works ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Allow public operations on requests') THEN
    CREATE POLICY "Allow public operations on requests" ON public.requests FOR ALL USING (true) WITH CHECK (true);
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Allow public operations on vendors') THEN
    CREATE POLICY "Allow public operations on vendors" ON public.vendors FOR ALL USING (true) WITH CHECK (true);
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Allow public operations on agreements') THEN
    CREATE POLICY "Allow public operations on agreements" ON public.agreements FOR ALL USING (true) WITH CHECK (true);
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Allow public operations on messages') THEN
    CREATE POLICY "Allow public operations on messages" ON public.messages FOR ALL USING (true) WITH CHECK (true);
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Allow public operations on properties') THEN
    CREATE POLICY "Allow public operations on properties" ON public.properties FOR ALL USING (true) WITH CHECK (true);
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Allow public operations on vehicles') THEN
    CREATE POLICY "Allow public operations on vehicles" ON public.vehicles FOR ALL USING (true) WITH CHECK (true);
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Allow public operations on marketing_requests') THEN
    CREATE POLICY "Allow public operations on marketing_requests" ON public.marketing_requests FOR ALL USING (true) WITH CHECK (true);
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Allow public operations on vendor_works') THEN
    CREATE POLICY "Allow public operations on vendor_works" ON public.vendor_works FOR ALL USING (true) WITH CHECK (true);
  END IF;
END $$;

-- ==============================================================================
-- 7. Supabase Realtime Replication Setup (Fail-Safe & Idempotent)
-- ==============================================================================
DO $$
BEGIN
  -- 1. requests
  IF EXISTS (SELECT 1 FROM pg_tables WHERE schemaname = 'public' AND tablename = 'requests') THEN
    BEGIN
      ALTER PUBLICATION supabase_realtime ADD TABLE public.requests;
    EXCEPTION WHEN duplicate_object THEN
    END;
    ALTER TABLE public.requests REPLICA IDENTITY FULL;
  END IF;

  -- 2. vendors
  IF EXISTS (SELECT 1 FROM pg_tables WHERE schemaname = 'public' AND tablename = 'vendors') THEN
    BEGIN
      ALTER PUBLICATION supabase_realtime ADD TABLE public.vendors;
    EXCEPTION WHEN duplicate_object THEN
    END;
    ALTER TABLE public.vendors REPLICA IDENTITY FULL;
  END IF;

  -- 3. agreements
  IF EXISTS (SELECT 1 FROM pg_tables WHERE schemaname = 'public' AND tablename = 'agreements') THEN
    BEGIN
      ALTER PUBLICATION supabase_realtime ADD TABLE public.agreements;
    EXCEPTION WHEN duplicate_object THEN
    END;
    ALTER TABLE public.agreements REPLICA IDENTITY FULL;
  END IF;

  -- 4. messages
  IF EXISTS (SELECT 1 FROM pg_tables WHERE schemaname = 'public' AND tablename = 'messages') THEN
    BEGIN
      ALTER PUBLICATION supabase_realtime ADD TABLE public.messages;
    EXCEPTION WHEN duplicate_object THEN
    END;
    ALTER TABLE public.messages REPLICA IDENTITY FULL;
  END IF;

  -- 5. properties
  IF EXISTS (SELECT 1 FROM pg_tables WHERE schemaname = 'public' AND tablename = 'properties') THEN
    BEGIN
      ALTER PUBLICATION supabase_realtime ADD TABLE public.properties;
    EXCEPTION WHEN duplicate_object THEN
    END;
    ALTER TABLE public.properties REPLICA IDENTITY FULL;
  END IF;

  -- 6. vehicles
  IF EXISTS (SELECT 1 FROM pg_tables WHERE schemaname = 'public' AND tablename = 'vehicles') THEN
    BEGIN
      ALTER PUBLICATION supabase_realtime ADD TABLE public.vehicles;
    EXCEPTION WHEN duplicate_object THEN
    END;
    ALTER TABLE public.vehicles REPLICA IDENTITY FULL;
  END IF;

  -- 7. marketing_requests
  IF EXISTS (SELECT 1 FROM pg_tables WHERE schemaname = 'public' AND tablename = 'marketing_requests') THEN
    BEGIN
      ALTER PUBLICATION supabase_realtime ADD TABLE public.marketing_requests;
    EXCEPTION WHEN duplicate_object THEN
    END;
    ALTER TABLE public.marketing_requests REPLICA IDENTITY FULL;
  END IF;

  -- 8. vendor_works
  IF EXISTS (SELECT 1 FROM pg_tables WHERE schemaname = 'public' AND tablename = 'vendor_works') THEN
    BEGIN
      ALTER PUBLICATION supabase_realtime ADD TABLE public.vendor_works;
    EXCEPTION WHEN duplicate_object THEN
    END;
    ALTER TABLE public.vendor_works REPLICA IDENTITY FULL;
  END IF;
END $$;
