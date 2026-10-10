-- ==============================================================================
-- ALLFIX Services Xpress — Supabase Database Schema
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

-- ==============================================================================
-- Row Level Security (RLS) Configuration
-- Enable public reads and inserts for operational platform workflows
-- ==============================================================================
ALTER TABLE public.requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.vendors ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.agreements ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.messages ENABLE ROW LEVEL SECURITY;

-- Allow anon service operations (insert and select for web API)
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
END $$;
