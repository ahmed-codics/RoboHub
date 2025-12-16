-- Function to search profiles (freelancers)
-- Searches by name, bio, and skills using substring match
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
      ARRAY_AGG(fs.skill) FILTER (WHERE fs.skill IS NOT NULL), 
      '{}'::text[]
    ) as skills
  FROM public.profiles p
  LEFT JOIN public.freelancer_skills fs ON p.id = fs.user_id
  WHERE 
    p.name ILIKE '%' || query_text || '%'
    OR p.bio ILIKE '%' || query_text || '%'
    OR EXISTS (
      SELECT 1 FROM public.freelancer_skills fs_sub 
      WHERE fs_sub.user_id = p.id 
      AND fs_sub.skill ILIKE '%' || query_text || '%'
    )
  GROUP BY p.id;
END;
$$;

-- Function to search jobs
-- Searches by title, description, and required skills using substring match
CREATE OR REPLACE FUNCTION public.search_jobs(query_text text)
RETURNS TABLE (
  id uuid,
  title text,
  description text,
  budget decimal,
  required_skills text[],
  created_at timestamptz
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    j.id,
    j.title,
    j.description,
    j.budget,
    j.required_skills,
    j.created_at
  FROM public.jobs j
  WHERE 
    j.title ILIKE '%' || query_text || '%'
    OR j.description ILIKE '%' || query_text || '%'
    OR EXISTS (
      SELECT 1 
      FROM unnest(j.required_skills) as skill
      WHERE skill ILIKE '%' || query_text || '%'
    )
  ORDER BY j.created_at DESC;
END;
$$;
