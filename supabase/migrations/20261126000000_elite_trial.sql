-- =============================================
-- One free month of Elite for every account
-- =============================================

ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS elite_trial_started_at TIMESTAMP WITH TIME ZONE;

COMMENT ON COLUMN public.profiles.elite_trial_started_at IS
  'When the account claimed its one free month of Elite; NULL means never claimed';

-- Self-serve claim used by the pricing page. One month per account, and an
-- account that is already Elite keeps whatever access it already has.
CREATE OR REPLACE FUNCTION public.claim_elite_trial()
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  caller uuid := auth.uid();
  target public.profiles%ROWTYPE;
  expires timestamptz;
BEGIN
  IF caller IS NULL THEN
    RAISE EXCEPTION 'not_authenticated' USING ERRCODE = 'insufficient_privilege';
  END IF;

  SELECT * INTO target FROM public.profiles WHERE user_id = caller FOR UPDATE;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'profile_not_found' USING ERRCODE = 'no_data_found';
  END IF;

  IF target.subscription_tier = 'elite'
     AND (target.elite_expiry_date IS NULL OR target.elite_expiry_date > now()) THEN
    RETURN jsonb_build_object(
      'subscription_tier', 'elite',
      'expires_at', target.elite_expiry_date,
      'already_active', true
    );
  END IF;

  IF target.elite_trial_started_at IS NOT NULL THEN
    RAISE EXCEPTION 'trial_already_claimed' USING ERRCODE = 'check_violation';
  END IF;

  expires := now() + interval '1 month';

  UPDATE public.profiles
  SET subscription_tier = 'elite',
      elite_expiry_date = expires,
      elite_trial_started_at = now(),
      updated_at = now()
  WHERE user_id = caller;

  RETURN jsonb_build_object(
    'subscription_tier', 'elite',
    'expires_at', expires,
    'already_active', false
  );
END;
$$;

GRANT EXECUTE ON FUNCTION public.claim_elite_trial() TO authenticated;
