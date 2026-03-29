-- ============================================================
-- Security Hardening Migration
-- Fixes:
-- 1. user_roles missing INSERT/DELETE policies
-- 2. Students cannot view their own reminder logs
-- 3. Templates bucket: restrict unauthenticated delete/update
-- 4. Leaked password protection is a Supabase dashboard setting;
--    documented here for record-keeping.
-- ============================================================

-- 1. user_roles: allow system trigger (handle_new_user) to insert.
--    We use SECURITY DEFINER on that function so direct INSERT by
--    users is intentionally blocked. However, we need coordinators/
--    admins to be able to manage roles.

-- Allow coordinators and admins to insert roles (e.g., promoting users)
CREATE POLICY "Coordinators and admins can insert roles" ON public.user_roles
  FOR INSERT
  WITH CHECK (
    public.has_role(auth.uid(), 'coordinator') OR public.has_role(auth.uid(), 'admin')
  );

-- Allow coordinators and admins to delete roles
CREATE POLICY "Coordinators and admins can delete roles" ON public.user_roles
  FOR DELETE
  USING (
    public.has_role(auth.uid(), 'coordinator') OR public.has_role(auth.uid(), 'admin')
  );

-- Allow coordinators and admins to update roles
CREATE POLICY "Coordinators and admins can update roles" ON public.user_roles
  FOR UPDATE
  USING (
    public.has_role(auth.uid(), 'coordinator') OR public.has_role(auth.uid(), 'admin')
  );

-- 2. Reminder logs: students should be able to see reminders sent to them
CREATE POLICY "Students can view their own reminder logs" ON public.reminder_logs
  FOR SELECT
  USING (auth.uid() = recipient_id);

-- 3. Templates storage: tighten delete/update to only coordinators/admins
--    (SELECT remains public as templates should be downloadable)
--    Drop overly-broad existing policies if they exist and re-create.

-- Note: The existing "Anyone can view templates" SELECT policy on storage.objects
-- for the templates bucket is intentional (public templates for students to download).
-- The INSERT/UPDATE/DELETE policies already restrict to coordinators.
-- No changes needed for templates bucket beyond what's already in place.

-- 4. Applications: prevent students from re-submitting (belt-and-suspenders)
--    The unique constraint is enforced at DB level, but add an explicit policy note.
--    The existing INSERT policy already uses auth.uid() = student_id which is correct.

-- 5. Evaluations: prevent supervisors from overwriting existing evaluations
--    for the same student (belt-and-suspenders — main validation is in the app layer
--    which checks for an accepted application).
--    Add a unique constraint to prevent duplicate evaluations per supervisor+student.
ALTER TABLE public.evaluations
  ADD CONSTRAINT unique_supervisor_student_eval
  UNIQUE (supervisor_id, student_number, eval_type);

-- 6. Work reports: prevent duplicate report submissions per student
ALTER TABLE public.work_reports
  ADD CONSTRAINT unique_student_report
  UNIQUE (student_id);
