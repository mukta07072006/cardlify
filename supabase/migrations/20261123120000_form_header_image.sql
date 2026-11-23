-- Optional banner image at the top of a project's public form page.
ALTER TABLE public.projects
  ADD COLUMN IF NOT EXISTS form_header_image_url text;

COMMENT ON COLUMN public.projects.form_header_image_url IS
  'Optional banner image shown above the form title on the public submission page.';
