-- =============================================
-- Form auto-closing + invited read-only viewers
-- =============================================

-- A form can stop accepting responses on a date, after N responses, or both.
ALTER TABLE public.projects
  ADD COLUMN IF NOT EXISTS auto_close_at TIMESTAMP WITH TIME ZONE;

ALTER TABLE public.projects
  ADD COLUMN IF NOT EXISTS max_submissions INTEGER;

ALTER TABLE public.projects
  DROP CONSTRAINT IF EXISTS projects_max_submissions_positive;

ALTER TABLE public.projects
  ADD CONSTRAINT projects_max_submissions_positive
  CHECK (max_submissions IS NULL OR max_submissions > 0);

COMMENT ON COLUMN public.projects.auto_close_at IS
  'Submissions stop at this moment; NULL means no deadline';
COMMENT ON COLUMN public.projects.max_submissions IS
  'Submissions stop once this many exist; NULL means unlimited';

-- Counts are read through SECURITY DEFINER helpers so anonymous visitors can
-- see "closed"/"spots left" without gaining any access to the answers.
CREATE OR REPLACE FUNCTION public.project_submission_count(_project_id uuid)
RETURNS integer
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT count(*)::integer FROM public.submissions WHERE project_id = _project_id;
$$;

CREATE OR REPLACE FUNCTION public.get_project_availability(_project_id uuid)
RETURNS jsonb
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT jsonb_build_object(
    'status', p.status,
    'auto_close_at', p.auto_close_at,
    'max_submissions', p.max_submissions,
    'submission_count', public.project_submission_count(p.id),
    'closed', (
      p.status <> 'active'
      OR (p.auto_close_at IS NOT NULL AND p.auto_close_at <= now())
      OR (
        p.max_submissions IS NOT NULL
        AND public.project_submission_count(p.id) >= p.max_submissions
      )
    )
  )
  FROM public.projects p
  WHERE p.id = _project_id;
$$;

GRANT EXECUTE ON FUNCTION public.project_submission_count(uuid) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.get_project_availability(uuid) TO anon, authenticated;

-- Block writes that slip past a closed public form (stale tab, direct API call).
CREATE OR REPLACE FUNCTION public.enforce_submission_window()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  target public.projects%ROWTYPE;
  taken integer;
BEGIN
  SELECT * INTO target FROM public.projects WHERE id = NEW.project_id;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'project_not_found' USING ERRCODE = 'check_violation';
  END IF;

  IF target.status <> 'active' THEN
    RAISE EXCEPTION 'form_closed' USING ERRCODE = 'check_violation';
  END IF;

  IF target.auto_close_at IS NOT NULL AND target.auto_close_at <= now() THEN
    RAISE EXCEPTION 'form_closed' USING ERRCODE = 'check_violation';
  END IF;

  IF target.max_submissions IS NOT NULL THEN
    SELECT count(*) INTO taken FROM public.submissions WHERE project_id = NEW.project_id;
    IF taken >= target.max_submissions THEN
      RAISE EXCEPTION 'form_full' USING ERRCODE = 'check_violation';
    END IF;
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS enforce_submission_window_trigger ON public.submissions;
CREATE TRIGGER enforce_submission_window_trigger
  BEFORE INSERT ON public.submissions
  FOR EACH ROW
  EXECUTE FUNCTION public.enforce_submission_window();

-- Project owners read their own submissions (guest access adds a second policy below).
DROP POLICY IF EXISTS "Owners can view submissions for their projects" ON public.submissions;
CREATE POLICY "Owners can view submissions for their projects"
  ON public.submissions FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.projects p
      WHERE p.id = submissions.project_id
        AND p.user_id = auth.uid()
    )
  );

-- =============================================
-- Invited viewers: see one project's submissions and export them
-- =============================================
CREATE TABLE IF NOT EXISTS public.project_viewers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  invited_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  invited_by_name TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE (project_id, email)
);

CREATE INDEX IF NOT EXISTS idx_project_viewers_project
  ON public.project_viewers(project_id);
CREATE INDEX IF NOT EXISTS idx_project_viewers_email
  ON public.project_viewers(lower(email));

ALTER TABLE public.project_viewers ENABLE ROW LEVEL SECURITY;

-- SECURITY DEFINER so the submission/project policies can call it without
-- triggering recursive RLS evaluation between the two tables.
CREATE OR REPLACE FUNCTION public.is_project_viewer(_project_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.project_viewers v
    WHERE v.project_id = _project_id
      AND lower(v.email) = lower(coalesce(auth.jwt() ->> 'email', ''))
  );
$$;

DROP POLICY IF EXISTS "Owners can view their project viewers" ON public.project_viewers;
CREATE POLICY "Owners can view their project viewers"
  ON public.project_viewers FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.projects p
      WHERE p.id = project_viewers.project_id
        AND p.user_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "Invited people can see their own access" ON public.project_viewers;
CREATE POLICY "Invited people can see their own access"
  ON public.project_viewers FOR SELECT
  TO authenticated
  USING (lower(email) = lower(coalesce(auth.jwt() ->> 'email', '')));

DROP POLICY IF EXISTS "Owners can invite viewers" ON public.project_viewers;
CREATE POLICY "Owners can invite viewers"
  ON public.project_viewers FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.projects p
      WHERE p.id = project_viewers.project_id
        AND p.user_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "Owners can remove viewers" ON public.project_viewers;
CREATE POLICY "Owners can remove viewers"
  ON public.project_viewers FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.projects p
      WHERE p.id = project_viewers.project_id
        AND p.user_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "Admins can view all project viewers" ON public.project_viewers;
CREATE POLICY "Admins can view all project viewers"
  ON public.project_viewers FOR SELECT
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'::app_role));

-- Owner of the project can do anything listed above; invited viewers only read.
DROP POLICY IF EXISTS "Invited viewers can view project submissions" ON public.submissions;
CREATE POLICY "Invited viewers can view project submissions"
  ON public.submissions FOR SELECT
  TO authenticated
  USING (public.is_project_viewer(project_id));

DROP POLICY IF EXISTS "Invited viewers can view the project" ON public.projects;
CREATE POLICY "Invited viewers can view the project"
  ON public.projects FOR SELECT
  TO authenticated
  USING (public.is_project_viewer(id));

COMMENT ON TABLE public.project_viewers IS
  'Emails invited by a project owner to read that project''s submissions without editing anything';
