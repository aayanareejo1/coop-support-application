
-- Add new enum values for provisional decisions
ALTER TYPE application_status ADD VALUE IF NOT EXISTS 'provisional_accepted';
ALTER TYPE application_status ADD VALUE IF NOT EXISTS 'provisional_rejected';

-- Add decision timestamps to applications
ALTER TABLE public.applications ADD COLUMN IF NOT EXISTS provisional_decision_at TIMESTAMPTZ;
ALTER TABLE public.applications ADD COLUMN IF NOT EXISTS final_decision_at TIMESTAMPTZ;

-- Deadline extensions table
CREATE TABLE public.deadline_extensions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  new_deadline TIMESTAMPTZ NOT NULL,
  reason TEXT,
  granted_by UUID REFERENCES auth.users(id) NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.deadline_extensions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Students can view own extensions" ON public.deadline_extensions
  FOR SELECT USING (auth.uid() = student_id);
CREATE POLICY "Coordinators and admins can manage extensions" ON public.deadline_extensions
  FOR ALL USING (public.has_role(auth.uid(), 'coordinator') OR public.has_role(auth.uid(), 'admin'));

-- Placement issues table
CREATE TABLE public.placement_issues (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  reason TEXT NOT NULL,
  flagged_by UUID REFERENCES auth.users(id) NOT NULL,
  resolved BOOLEAN NOT NULL DEFAULT false,
  resolved_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.placement_issues ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Coordinators and admins can manage placement issues" ON public.placement_issues
  FOR ALL USING (public.has_role(auth.uid(), 'coordinator') OR public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Students can view own placement issues" ON public.placement_issues
  FOR SELECT USING (auth.uid() = student_id);

-- Email reminder logs table
CREATE TABLE public.reminder_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  recipient_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  recipient_email TEXT NOT NULL,
  reminder_type TEXT NOT NULL CHECK (reminder_type IN ('report', 'evaluation')),
  sent_by UUID REFERENCES auth.users(id) NOT NULL,
  sent_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.reminder_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Coordinators and admins can manage reminder logs" ON public.reminder_logs
  FOR ALL USING (public.has_role(auth.uid(), 'coordinator') OR public.has_role(auth.uid(), 'admin'));

-- Report templates bucket
INSERT INTO storage.buckets (id, name, public) VALUES ('templates', 'templates', true)
ON CONFLICT (id) DO NOTHING;

CREATE POLICY "Anyone can view templates" ON storage.objects
  FOR SELECT USING (bucket_id = 'templates');
CREATE POLICY "Coordinators can manage templates" ON storage.objects
  FOR INSERT WITH CHECK (
    bucket_id = 'templates' AND (public.has_role(auth.uid(), 'coordinator') OR public.has_role(auth.uid(), 'admin'))
  );
CREATE POLICY "Coordinators can update templates" ON storage.objects
  FOR UPDATE USING (
    bucket_id = 'templates' AND (public.has_role(auth.uid(), 'coordinator') OR public.has_role(auth.uid(), 'admin'))
  );
CREATE POLICY "Coordinators can delete templates" ON storage.objects
  FOR DELETE USING (
    bucket_id = 'templates' AND (public.has_role(auth.uid(), 'coordinator') OR public.has_role(auth.uid(), 'admin'))
  );
