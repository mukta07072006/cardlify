-- On form + card projects the organiser decides whether a photo is required.
ALTER TABLE public.projects
  ADD COLUMN IF NOT EXISTS photo_required BOOLEAN NOT NULL DEFAULT true;

COMMENT ON COLUMN public.projects.photo_required IS
  'When false, a submission may be sent without a photo; the card is generated without one.';
