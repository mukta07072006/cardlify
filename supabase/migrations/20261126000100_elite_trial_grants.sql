-- Restrict the free Elite claim to signed-in accounts. Postgres grants
-- EXECUTE to PUBLIC by default, so revoke that before granting it back.
REVOKE ALL ON FUNCTION public.claim_elite_trial() FROM PUBLIC;
REVOKE ALL ON FUNCTION public.claim_elite_trial() FROM anon;
GRANT EXECUTE ON FUNCTION public.claim_elite_trial() TO authenticated;
