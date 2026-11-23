-- =============================================
-- Project delivery modes + Google-Forms-style fields
-- =============================================

-- A project can now deliver a card, a form, or both.
ALTER TABLE public.projects
  ADD COLUMN IF NOT EXISTS project_mode TEXT NOT NULL DEFAULT 'card'
  CHECK (project_mode IN ('card', 'form', 'both'));

ALTER TABLE public.projects ADD COLUMN IF NOT EXISTS form_title TEXT;
ALTER TABLE public.projects ADD COLUMN IF NOT EXISTS form_description TEXT;

-- Questions collected by a form project
CREATE TABLE IF NOT EXISTS public.form_fields (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
  label TEXT NOT NULL,
  field_type TEXT NOT NULL DEFAULT 'short_text'
    CHECK (field_type IN ('short_text', 'long_text', 'email', 'number', 'date', 'dropdown', 'radio', 'checkbox')),
  placeholder TEXT,
  help_text TEXT,
  required BOOLEAN NOT NULL DEFAULT false,
  options JSONB NOT NULL DEFAULT '[]'::jsonb,
  position INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_form_fields_project_position
  ON public.form_fields(project_id, position);

ALTER TABLE public.form_fields ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view form fields for their projects"
  ON public.form_fields FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.projects
      WHERE projects.id = form_fields.project_id
      AND projects.user_id = auth.uid()
    )
  );

CREATE POLICY "Public can view form fields for active projects"
  ON public.form_fields FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.projects
      WHERE projects.id = form_fields.project_id
      AND projects.status = 'active'
    )
  );

CREATE POLICY "Users can insert form fields for their projects"
  ON public.form_fields FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.projects
      WHERE projects.id = form_fields.project_id
      AND projects.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can update form fields for their projects"
  ON public.form_fields FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM public.projects
      WHERE projects.id = form_fields.project_id
      AND projects.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can delete form fields for their projects"
  ON public.form_fields FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM public.projects
      WHERE projects.id = form_fields.project_id
      AND projects.user_id = auth.uid()
    )
  );

-- Admins can read every form definition
CREATE POLICY "Admins can view all form fields"
  ON public.form_fields FOR SELECT
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'::app_role));

COMMENT ON COLUMN public.projects.project_mode IS 'Delivery mode: card, form, or both';
COMMENT ON TABLE public.form_fields IS 'Questions rendered on a project submission form; answers are stored in submissions.field_values';
