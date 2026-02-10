-- =============================================
-- Card Creator Hub - Complete Database Schema
-- Consolidated Migration (20260205000000)
-- =============================================

-- Create app_role enum for admin roles
CREATE TYPE public.app_role AS ENUM ('admin', 'user');

-- Create subscription_tier enum
CREATE TYPE public.subscription_tier AS ENUM ('free', 'elite');

-- Security definer function to check roles (prevents recursive RLS)
CREATE OR REPLACE FUNCTION public.has_role(_user_id uuid, _role app_role)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_roles
    WHERE user_id = _user_id
      AND role = _role
  )
$$;

-- Security definer function to check subscription tier
CREATE OR REPLACE FUNCTION public.get_subscription_tier(_user_id uuid)
RETURNS subscription_tier
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT CASE 
    WHEN subscription_tier = 'elite' AND (elite_expiry_date IS NULL OR elite_expiry_date > now()) 
    THEN 'elite'::subscription_tier
    ELSE 'free'::subscription_tier
  END
  FROM public.profiles 
  WHERE user_id = _user_id
$$;

-- Function to check if elite subscription is still valid
CREATE OR REPLACE FUNCTION public.is_elite_subscription_valid(_user_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.profiles
    WHERE user_id = _user_id
      AND subscription_tier = 'elite'
      AND (elite_expiry_date IS NULL OR elite_expiry_date > now())
  )
$$;

-- Add a trigger to automatically downgrade expired elite subscriptions
CREATE OR REPLACE FUNCTION public.check_subscription_expiry()
RETURNS TRIGGER AS $$
BEGIN
  -- If subscription is elite but expiry date has passed, downgrade to free
  IF NEW.subscription_tier = 'elite' AND NEW.elite_expiry_date IS NOT NULL AND NEW.elite_expiry_date <= now() THEN
    NEW.subscription_tier := 'free';
    NEW.elite_expiry_date := NULL;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Function to update timestamps
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

-- Function to handle new user signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (user_id, name, email)
  VALUES (NEW.id, COALESCE(NEW.raw_user_meta_data->>'name', split_part(NEW.email, '@', 1)), NEW.email);
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Create profiles table for organizers
CREATE TABLE public.profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL UNIQUE,
  name TEXT NOT NULL,
  email TEXT NOT NULL,
  subscription_tier subscription_tier NOT NULL DEFAULT 'free',
  elite_expiry_date TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Add comment for documentation
COMMENT ON COLUMN public.profiles.elite_expiry_date IS 'Expiry date for elite subscription tier';

-- Enable RLS on profiles
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- Profiles policies (basic user policies first)
CREATE POLICY "Users can view their own profile"
  ON public.profiles FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own profile"
  ON public.profiles FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own profile"
  ON public.profiles FOR UPDATE
  USING (auth.uid() = user_id);

-- Projects table
CREATE TABLE public.projects (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  project_name TEXT NOT NULL,
  template_image_url TEXT,
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'inactive')),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS on projects
ALTER TABLE public.projects ENABLE ROW LEVEL SECURITY;

-- Projects policies
CREATE POLICY "Users can view their own projects"
  ON public.projects FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own projects"
  ON public.projects FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own projects"
  ON public.projects FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own projects"
  ON public.projects FOR DELETE
  USING (auth.uid() = user_id);

CREATE POLICY "Public can view active projects"
  ON public.projects FOR SELECT
  USING (status = 'active');

-- Fields table for template layout
CREATE TABLE public.fields (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID REFERENCES public.projects(id) ON DELETE CASCADE NOT NULL,
  field_type TEXT NOT NULL CHECK (field_type IN ('photo', 'text')),
  field_name TEXT NOT NULL,
  x_position NUMERIC NOT NULL DEFAULT 0,
  y_position NUMERIC NOT NULL DEFAULT 0,
  width NUMERIC NOT NULL DEFAULT 100,
  height NUMERIC NOT NULL DEFAULT 100,
  font_size INTEGER DEFAULT 16,
  font_color TEXT DEFAULT '#000000',
  border_enabled boolean DEFAULT false,
  border_size integer DEFAULT 1,
  border_color text DEFAULT '#000000',
  background_color text DEFAULT '#ffffff',
  background_opacity numeric DEFAULT 0,
  shape text DEFAULT 'rectangle',
  text_align TEXT DEFAULT 'left',
  font_family text DEFAULT 'Inter',
  font_bold boolean DEFAULT false,
  font_italic boolean DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Add comment for shape options
COMMENT ON COLUMN public.fields.shape IS 'Options: rectangle, rounded, circle';

-- Enable RLS on fields
ALTER TABLE public.fields ENABLE ROW LEVEL SECURITY;

-- Fields policies - organizers can manage fields for their projects
CREATE POLICY "Users can view fields for their projects"
  ON public.fields FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.projects
      WHERE projects.id = fields.project_id
      AND projects.user_id = auth.uid()
    )
  );

CREATE POLICY "Public can view fields for active projects"
  ON public.fields FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.projects
      WHERE projects.id = fields.project_id
      AND projects.status = 'active'
    )
  );

CREATE POLICY "Users can insert fields for their projects"
  ON public.fields FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.projects
      WHERE projects.id = fields.project_id
      AND projects.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can update fields for their projects"
  ON public.fields FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM public.projects
      WHERE projects.id = fields.project_id
      AND projects.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can delete fields for their projects"
  ON public.fields FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM public.projects
      WHERE projects.id = fields.project_id
      AND projects.user_id = auth.uid()
    )
  );

-- Submissions table
CREATE TABLE public.submissions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID REFERENCES public.projects(id) ON DELETE CASCADE NOT NULL,
  participant_name TEXT NOT NULL,
  participant_id TEXT,
  department TEXT,
  role TEXT,
  photo_url TEXT,
  generated_card_url TEXT,
  field_values JSONB DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS on submissions
ALTER TABLE public.submissions ENABLE ROW LEVEL SECURITY;

-- Submissions policies (basic policies first)
CREATE POLICY "Anyone can insert submissions for active projects"
  ON public.submissions FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.projects
      WHERE projects.id = submissions.project_id
      AND projects.status = 'active'
    )
  );

CREATE POLICY "Users can update submissions for their projects"
  ON public.submissions FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM public.projects
      WHERE projects.id = submissions.project_id
      AND projects.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can delete submissions for their projects"
  ON public.submissions FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM public.projects
      WHERE projects.id = submissions.project_id
      AND projects.user_id = auth.uid()
    )
  );

-- Create a view that only shows submission counts and names (no photos/PII)
CREATE OR REPLACE VIEW public.submissions_summary
WITH (security_invoker = on) AS
SELECT 
  s.id,
  s.project_id,
  s.participant_name,
  s.created_at,
  s.generated_card_url
FROM public.submissions s;

-- Add comment for documentation
COMMENT ON VIEW public.submissions_summary IS 'Limited view of submissions showing only name and card URL, excludes photos and personal details';

-- Create user_roles table
CREATE TABLE public.user_roles (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    role app_role NOT NULL DEFAULT 'user',
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    UNIQUE (user_id, role)
);

-- Enable RLS on user_roles
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

-- Create admin_templates table for pre-made templates
CREATE TABLE public.admin_templates (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    name text NOT NULL,
    description text,
    image_url text NOT NULL,
    category text DEFAULT 'general',
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    created_by uuid REFERENCES auth.users(id)
);

-- Enable RLS on admin_templates
ALTER TABLE public.admin_templates ENABLE ROW LEVEL SECURITY;

-- Create storage bucket for templates and photos
INSERT INTO storage.buckets (id, name, public) VALUES ('templates', 'templates', true);
INSERT INTO storage.buckets (id, name, public) VALUES ('photos', 'photos', true);
INSERT INTO storage.buckets (id, name, public) VALUES ('cards', 'cards', true);

-- Storage policies for templates bucket
CREATE POLICY "Authenticated users can upload templates"
  ON storage.objects FOR INSERT
  WITH CHECK (bucket_id = 'templates' AND auth.role() = 'authenticated');

CREATE POLICY "Anyone can view templates"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'templates');

CREATE POLICY "Users can delete their templates"
  ON storage.objects FOR DELETE
  USING (bucket_id = 'templates' AND auth.role() = 'authenticated');

-- Storage policies for photos bucket
CREATE POLICY "Anyone can upload photos"
  ON storage.objects FOR INSERT
  WITH CHECK (bucket_id = 'photos');

CREATE POLICY "Anyone can view photos"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'photos');

-- Storage policies for cards bucket
CREATE POLICY "Anyone can upload cards"
  ON storage.objects FOR INSERT
  WITH CHECK (bucket_id = 'cards');

CREATE POLICY "Anyone can view cards"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'cards');

-- Trigger to create profile on signup
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- NOW ADD THE ADMIN POLICIES THAT DEPEND ON has_role FUNCTION

-- Admin policies for profiles
CREATE POLICY "Admins can view all profiles"
  ON public.profiles FOR SELECT
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins can update any profile"
  ON public.profiles FOR UPDATE
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'::app_role));

-- Admin policies for projects
CREATE POLICY "Admins can view all projects"
  ON public.projects FOR SELECT
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'::app_role));

-- Admin policies for submissions
CREATE POLICY "Admins can view all submissions"
  ON public.submissions FOR SELECT
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'::app_role));

-- RLS Policies for user_roles
CREATE POLICY "Admins can view all user roles"
ON public.user_roles
FOR SELECT
TO authenticated
USING (public.has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins can insert user roles"
ON public.user_roles
FOR INSERT
TO authenticated
WITH CHECK (public.has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins can update user roles"
ON public.user_roles
FOR UPDATE
TO authenticated
USING (public.has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins can delete user roles"
ON public.user_roles
FOR DELETE
TO authenticated
USING (public.has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Users can view their own role"
ON public.user_roles
FOR SELECT
TO authenticated
USING (user_id = auth.uid());

-- RLS Policies for admin_templates
CREATE POLICY "Anyone can view admin templates"
ON public.admin_templates
FOR SELECT
TO authenticated
USING (true);

CREATE POLICY "Admins can insert templates"
ON public.admin_templates
FOR INSERT
TO authenticated
WITH CHECK (public.has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins can update templates"
ON public.admin_templates
FOR UPDATE
TO authenticated
USING (public.has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins can delete templates"
ON public.admin_templates
FOR DELETE
TO authenticated
USING (public.has_role(auth.uid(), 'admin'::app_role));

-- Create trigger on profiles table
CREATE TRIGGER check_subscription_expiry_trigger
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.check_subscription_expiry();

-- Create index for better performance on expiry date queries
CREATE INDEX IF NOT EXISTS idx_profiles_elite_expiry_date 
ON public.profiles(elite_expiry_date) 
WHERE elite_expiry_date IS NOT NULL;