-- One-time email verification challenges for service bookings.
-- Run this in the Supabase SQL editor before enabling OTP in a Vercel deployment.
CREATE TABLE IF NOT EXISTS public.email_otp_challenges (
  challenge_id TEXT PRIMARY KEY,
  email TEXT NOT NULL,
  phone TEXT NOT NULL,
  code_hash TEXT NOT NULL,
  attempts INTEGER NOT NULL DEFAULT 0 CHECK (attempts >= 0),
  expires_at TIMESTAMPTZ NOT NULL,
  consumed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_email_otp_challenges_expires_at
  ON public.email_otp_challenges (expires_at);

ALTER TABLE public.email_otp_challenges ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON public.email_otp_challenges FROM anon, authenticated;
GRANT ALL ON public.email_otp_challenges TO service_role;

CREATE OR REPLACE FUNCTION public.verify_allfix_email_otp(
  p_challenge_id TEXT,
  p_code_hash TEXT
) RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  challenge public.email_otp_challenges%ROWTYPE;
BEGIN
  SELECT * INTO challenge
    FROM public.email_otp_challenges
    WHERE challenge_id = p_challenge_id
    FOR UPDATE;

  IF NOT FOUND OR challenge.consumed_at IS NOT NULL OR
     challenge.expires_at <= NOW() OR challenge.attempts >= 5 THEN
    RETURN FALSE;
  END IF;

  IF challenge.code_hash <> p_code_hash THEN
    UPDATE public.email_otp_challenges
      SET attempts = attempts + 1
      WHERE challenge_id = p_challenge_id;
    RETURN FALSE;
  END IF;

  UPDATE public.email_otp_challenges
    SET consumed_at = NOW()
    WHERE challenge_id = p_challenge_id;
  RETURN TRUE;
END;
$$;

REVOKE ALL ON FUNCTION public.verify_allfix_email_otp(TEXT, TEXT) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.verify_allfix_email_otp(TEXT, TEXT) TO service_role;
