-- 1. Coordinator assignment + placement status on applications
ALTER TABLE applications
  ADD COLUMN IF NOT EXISTS assigned_coordinator_id UUID REFERENCES auth.users(id),
  ADD COLUMN IF NOT EXISTS placement_status TEXT;

-- Replace broad update policy with assignment-aware one
DROP POLICY IF EXISTS "Coordinators and admins can update applications" ON public.applications;

CREATE POLICY "Coordinators and admins can update applications" ON public.applications FOR UPDATE
  USING (
    public.has_role(auth.uid(), 'admin')
    OR (
      public.has_role(auth.uid(), 'coordinator')
      AND (assigned_coordinator_id IS NULL OR assigned_coordinator_id = auth.uid())
    )
  );

-- 2. Supervisor-student link requests
CREATE TABLE IF NOT EXISTS supervisor_student_links (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  supervisor_id UUID NOT NULL REFERENCES auth.users(id),
  student_number TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending',
  reviewed_by UUID REFERENCES auth.users(id),
  reviewed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE supervisor_student_links ENABLE ROW LEVEL SECURITY;

CREATE POLICY "supervisors_insert_own_links" ON supervisor_student_links FOR INSERT TO authenticated
  WITH CHECK (supervisor_id = auth.uid());
CREATE POLICY "supervisors_select_own_links" ON supervisor_student_links FOR SELECT TO authenticated
  USING (supervisor_id = auth.uid());
CREATE POLICY "coordinators_select_links" ON supervisor_student_links FOR SELECT TO authenticated
  USING (get_user_role(auth.uid()) IN ('coordinator', 'admin'));
CREATE POLICY "coordinators_update_links" ON supervisor_student_links FOR UPDATE TO authenticated
  USING (get_user_role(auth.uid()) IN ('coordinator', 'admin'));

-- 3. Student employer evaluations
CREATE TABLE IF NOT EXISTS employer_evaluations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id UUID NOT NULL REFERENCES auth.users(id),
  employer_name TEXT NOT NULL,
  job_title TEXT,
  rating INTEGER CHECK (rating BETWEEN 1 AND 5),
  comments TEXT,
  submitted_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE employer_evaluations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "students_insert_own_employer_evals" ON employer_evaluations FOR INSERT TO authenticated
  WITH CHECK (student_id = auth.uid());
CREATE POLICY "students_select_own_employer_evals" ON employer_evaluations FOR SELECT TO authenticated
  USING (student_id = auth.uid());
CREATE POLICY "coordinators_select_employer_evals" ON employer_evaluations FOR SELECT TO authenticated
  USING (get_user_role(auth.uid()) IN ('coordinator', 'admin'));
