-- Report review flow columns
ALTER TABLE work_reports
  ADD COLUMN IF NOT EXISTS status TEXT NOT NULL DEFAULT 'pending_review',
  ADD COLUMN IF NOT EXISTS reviewed_by UUID REFERENCES auth.users(id),
  ADD COLUMN IF NOT EXISTS reviewed_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS feedback TEXT;

-- Student-initiated extension requests
CREATE TABLE IF NOT EXISTS deadline_extension_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id UUID NOT NULL REFERENCES auth.users(id),
  reason TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending',
  reviewed_by UUID REFERENCES auth.users(id),
  reviewed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE deadline_extension_requests ENABLE ROW LEVEL SECURITY;

CREATE POLICY "students_insert_own_ext_requests"
  ON deadline_extension_requests FOR INSERT TO authenticated
  WITH CHECK (student_id = auth.uid());

CREATE POLICY "students_select_own_ext_requests"
  ON deadline_extension_requests FOR SELECT TO authenticated
  USING (student_id = auth.uid());

CREATE POLICY "coordinators_select_ext_requests"
  ON deadline_extension_requests FOR SELECT TO authenticated
  USING (get_user_role(auth.uid()) IN ('coordinator', 'admin'));

CREATE POLICY "coordinators_update_ext_requests"
  ON deadline_extension_requests FOR UPDATE TO authenticated
  USING (get_user_role(auth.uid()) IN ('coordinator', 'admin'));

CREATE POLICY "coordinators_update_work_reports"
  ON work_reports FOR UPDATE TO authenticated
  USING (get_user_role(auth.uid()) IN ('coordinator', 'admin'));
