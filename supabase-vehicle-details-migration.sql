ALTER TABLE public.vehicles
  ADD COLUMN IF NOT EXISTS seating_capacity TEXT,
  ADD COLUMN IF NOT EXISTS full_specifications TEXT;
