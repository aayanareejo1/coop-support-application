
-- Create role enum
CREATE TYPE public.app_role AS ENUM ('student', 'coordinator', 'supervisor', 'admin');

-- Create profiles table
CREATE TABLE public.profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL UNIQUE,
  full_name TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Create user_roles table
CREATE TABLE public.user_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  role app_role NOT NULL,
  UNIQUE (user_id, role)
);

-- Application status enum
CREATE TYPE public.application_status AS ENUM ('pending', 'provisional', 'accepted', 'rejected');

-- Applications table
CREATE TABLE public.applications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  name TEXT NOT NULL,
  student_number TEXT NOT NULL,
  email TEXT NOT NULL,
  status application_status NOT NULL DEFAULT 'pending',
  reviewer_notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Work reports table
CREATE TABLE public.work_reports (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  file_path TEXT NOT NULL,
  file_name TEXT NOT NULL,
  submitted_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Evaluations table
CREATE TABLE public.evaluations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  supervisor_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  student_name TEXT NOT NULL,
  student_number TEXT NOT NULL,
  eval_type TEXT NOT NULL CHECK (eval_type IN ('pdf', 'form')),
  file_path TEXT,
  file_name TEXT,
  rating INTEGER CHECK (rating BETWEEN 1 AND 5),
  comments TEXT,
  recommendation TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Deadlines table
CREATE TABLE public.deadlines (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  deadline_date TIMESTAMPTZ NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Enable RLS on all tables
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.applications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.work_reports ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.evaluations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.deadlines ENABLE ROW LEVEL SECURITY;

-- Security definer function for role checking
CREATE OR REPLACE FUNCTION public.has_role(_user_id UUID, _role app_role)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = _user_id AND role = _role
  )
$$;

-- Helper to get user role
CREATE OR REPLACE FUNCTION public.get_user_role(_user_id UUID)
RETURNS app_role
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT role FROM public.user_roles
  WHERE user_id = _user_id
  LIMIT 1
$$;

-- Updated_at trigger function
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

CREATE TRIGGER update_profiles_updated_at BEFORE UPDATE ON public.profiles FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_applications_updated_at BEFORE UPDATE ON public.applications FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Auto-create profile on signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (user_id, full_name)
  VALUES (NEW.id, COALESCE(NEW.raw_user_meta_data->>'full_name', ''));
  INSERT INTO public.user_roles (user_id, role)
  VALUES (NEW.id, COALESCE((NEW.raw_user_meta_data->>'role')::app_role, 'student'));
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- PROFILES POLICIES
CREATE POLICY "Users can view own profile" ON public.profiles FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Coordinators and admins can view all profiles" ON public.profiles FOR SELECT USING (
  public.has_role(auth.uid(), 'coordinator') OR public.has_role(auth.uid(), 'admin')
);
CREATE POLICY "Users can update own profile" ON public.profiles FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own profile" ON public.profiles FOR INSERT WITH CHECK (auth.uid() = user_id);

-- USER_ROLES POLICIES
CREATE POLICY "Users can view own role" ON public.user_roles FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Coordinators and admins can view all roles" ON public.user_roles FOR SELECT USING (
  public.has_role(auth.uid(), 'coordinator') OR public.has_role(auth.uid(), 'admin')
);

-- APPLICATIONS POLICIES
CREATE POLICY "Students can view own application" ON public.applications FOR SELECT USING (auth.uid() = student_id);
CREATE POLICY "Students can insert own application" ON public.applications FOR INSERT WITH CHECK (auth.uid() = student_id);
CREATE POLICY "Coordinators and admins can view all applications" ON public.applications FOR SELECT USING (
  public.has_role(auth.uid(), 'coordinator') OR public.has_role(auth.uid(), 'admin')
);
CREATE POLICY "Coordinators and admins can update applications" ON public.applications FOR UPDATE USING (
  public.has_role(auth.uid(), 'coordinator') OR public.has_role(auth.uid(), 'admin')
);

-- WORK_REPORTS POLICIES
CREATE POLICY "Students can view own reports" ON public.work_reports FOR SELECT USING (auth.uid() = student_id);
CREATE POLICY "Students can insert own reports" ON public.work_reports FOR INSERT WITH CHECK (auth.uid() = student_id);
CREATE POLICY "Coordinators and admins can view all reports" ON public.work_reports FOR SELECT USING (
  public.has_role(auth.uid(), 'coordinator') OR public.has_role(auth.uid(), 'admin')
);

-- EVALUATIONS POLICIES
CREATE POLICY "Supervisors can view own evaluations" ON public.evaluations FOR SELECT USING (auth.uid() = supervisor_id);
CREATE POLICY "Supervisors can insert own evaluations" ON public.evaluations FOR INSERT WITH CHECK (auth.uid() = supervisor_id);
CREATE POLICY "Coordinators and admins can view all evaluations" ON public.evaluations FOR SELECT USING (
  public.has_role(auth.uid(), 'coordinator') OR public.has_role(auth.uid(), 'admin')
);

-- DEADLINES POLICIES
CREATE POLICY "Everyone can view deadlines" ON public.deadlines FOR SELECT TO authenticated USING (true);
CREATE POLICY "Coordinators and admins can manage deadlines" ON public.deadlines FOR ALL USING (
  public.has_role(auth.uid(), 'coordinator') OR public.has_role(auth.uid(), 'admin')
);

-- Storage buckets
INSERT INTO storage.buckets (id, name, public) VALUES ('reports', 'reports', false);
INSERT INTO storage.buckets (id, name, public) VALUES ('evaluations', 'evaluations', false);

-- Storage policies for reports
CREATE POLICY "Students can upload own reports" ON storage.objects FOR INSERT WITH CHECK (
  bucket_id = 'reports' AND auth.uid()::text = (storage.foldername(name))[1]
);
CREATE POLICY "Students can view own reports" ON storage.objects FOR SELECT USING (
  bucket_id = 'reports' AND auth.uid()::text = (storage.foldername(name))[1]
);
CREATE POLICY "Coordinators and admins can view all reports" ON storage.objects FOR SELECT USING (
  bucket_id = 'reports' AND (public.has_role(auth.uid(), 'coordinator') OR public.has_role(auth.uid(), 'admin'))
);

-- Storage policies for evaluations
CREATE POLICY "Supervisors can upload evaluations" ON storage.objects FOR INSERT WITH CHECK (
  bucket_id = 'evaluations' AND auth.uid()::text = (storage.foldername(name))[1]
);
CREATE POLICY "Supervisors can view own evaluations" ON storage.objects FOR SELECT USING (
  bucket_id = 'evaluations' AND auth.uid()::text = (storage.foldername(name))[1]
);
CREATE POLICY "Coordinators and admins can view all evaluations" ON storage.objects FOR SELECT USING (
  bucket_id = 'evaluations' AND (public.has_role(auth.uid(), 'coordinator') OR public.has_role(auth.uid(), 'admin'))
);

-- Insert default report deadline
INSERT INTO public.deadlines (name, deadline_date) VALUES ('Work-Term Report Submission', now() + interval '90 days');
