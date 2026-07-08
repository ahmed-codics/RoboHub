-- CV / LinkedIn PDF profile import support

ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS headline text,
  ADD COLUMN IF NOT EXISTS location text,
  ADD COLUMN IF NOT EXISTS linkedin_url text,
  ADD COLUMN IF NOT EXISTS website_url text,
  ADD COLUMN IF NOT EXISTS profile_import_completed_at timestamptz;

CREATE TABLE IF NOT EXISTS public.profile_imports (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  source_type text NOT NULL CHECK (source_type IN ('cv_pdf', 'linkedin_pdf')),
  document_path text NOT NULL,
  original_filename text,
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'processing', 'completed', 'failed')),
  extracted_json jsonb,
  error_message text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.profile_experience (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  title text NOT NULL,
  company text,
  location text,
  start_date text,
  end_date text,
  is_current boolean NOT NULL DEFAULT false,
  description text,
  source_import_id uuid REFERENCES public.profile_imports(id) ON DELETE SET NULL,
  sort_order integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.profile_education (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  school text NOT NULL,
  degree text,
  field text,
  start_year text,
  end_year text,
  description text,
  source_import_id uuid REFERENCES public.profile_imports(id) ON DELETE SET NULL,
  sort_order integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.profile_certifications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name text NOT NULL,
  issuer text,
  issued_at text,
  credential_url text,
  source_import_id uuid REFERENCES public.profile_imports(id) ON DELETE SET NULL,
  sort_order integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_profile_imports_user_id ON public.profile_imports(user_id);
CREATE INDEX IF NOT EXISTS idx_profile_experience_user_id ON public.profile_experience(user_id);
CREATE INDEX IF NOT EXISTS idx_profile_education_user_id ON public.profile_education(user_id);
CREATE INDEX IF NOT EXISTS idx_profile_certifications_user_id ON public.profile_certifications(user_id);

ALTER TABLE public.profile_imports ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.profile_experience ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.profile_education ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.profile_certifications ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can manage their own profile imports" ON public.profile_imports;
CREATE POLICY "Users can manage their own profile imports"
  ON public.profile_imports FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can manage their own experience" ON public.profile_experience;
CREATE POLICY "Users can manage their own experience"
  ON public.profile_experience FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can manage their own education" ON public.profile_education;
CREATE POLICY "Users can manage their own education"
  ON public.profile_education FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can manage their own certifications" ON public.profile_certifications;
CREATE POLICY "Users can manage their own certifications"
  ON public.profile_certifications FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

DROP TRIGGER IF EXISTS update_profile_imports_updated_at ON public.profile_imports;
CREATE TRIGGER update_profile_imports_updated_at
  BEFORE UPDATE ON public.profile_imports
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

DROP TRIGGER IF EXISTS update_profile_experience_updated_at ON public.profile_experience;
CREATE TRIGGER update_profile_experience_updated_at
  BEFORE UPDATE ON public.profile_experience
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

DROP TRIGGER IF EXISTS update_profile_education_updated_at ON public.profile_education;
CREATE TRIGGER update_profile_education_updated_at
  BEFORE UPDATE ON public.profile_education
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

DROP TRIGGER IF EXISTS update_profile_certifications_updated_at ON public.profile_certifications;
CREATE TRIGGER update_profile_certifications_updated_at
  BEFORE UPDATE ON public.profile_certifications
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

INSERT INTO storage.buckets (id, name, public)
VALUES ('profile-documents', 'profile-documents', false)
ON CONFLICT (id) DO NOTHING;

DROP POLICY IF EXISTS "Users can upload their own profile documents" ON storage.objects;
CREATE POLICY "Users can upload their own profile documents"
  ON storage.objects FOR INSERT
  WITH CHECK (
    bucket_id = 'profile-documents'
    AND auth.uid()::text = (storage.foldername(name))[1]
  );

DROP POLICY IF EXISTS "Users can read their own profile documents" ON storage.objects;
CREATE POLICY "Users can read their own profile documents"
  ON storage.objects FOR SELECT
  USING (
    bucket_id = 'profile-documents'
    AND auth.uid()::text = (storage.foldername(name))[1]
  );

DROP POLICY IF EXISTS "Users can delete their own profile documents" ON storage.objects;
CREATE POLICY "Users can delete their own profile documents"
  ON storage.objects FOR DELETE
  USING (
    bucket_id = 'profile-documents'
    AND auth.uid()::text = (storage.foldername(name))[1]
  );

CREATE OR REPLACE FUNCTION public.search_freelancers(query_text text)
RETURNS TABLE (
  id uuid,
  name text,
  bio text,
  avatar_url text,
  skills text[]
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN QUERY
  SELECT
    p.id,
    p.name,
    p.bio,
    p.avatar_url,
    COALESCE(
      ARRAY_AGG(DISTINCT fs.skill) FILTER (WHERE fs.skill IS NOT NULL),
      '{}'::text[]
    ) as skills
  FROM public.profiles p
  LEFT JOIN public.freelancer_skills fs ON p.id = fs.user_id
  WHERE
    p.name ILIKE '%' || query_text || '%'
    OR p.bio ILIKE '%' || query_text || '%'
    OR p.headline ILIKE '%' || query_text || '%'
    OR p.location ILIKE '%' || query_text || '%'
    OR EXISTS (
      SELECT 1 FROM public.freelancer_skills fs_sub
      WHERE fs_sub.user_id = p.id
      AND fs_sub.skill ILIKE '%' || query_text || '%'
    )
    OR EXISTS (
      SELECT 1 FROM public.profile_experience pe
      WHERE pe.user_id = p.id
      AND (
        pe.title ILIKE '%' || query_text || '%'
        OR pe.company ILIKE '%' || query_text || '%'
      )
    )
    OR EXISTS (
      SELECT 1 FROM public.profile_certifications pc
      WHERE pc.user_id = p.id
      AND pc.name ILIKE '%' || query_text || '%'
    )
  GROUP BY p.id;
END;
$$;
