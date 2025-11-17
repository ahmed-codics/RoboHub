-- Create storage buckets for profile images and portfolios
INSERT INTO storage.buckets (id, name, public)
VALUES 
  ('avatars', 'avatars', true),
  ('portfolios', 'portfolios', true);

-- Avatar storage policies
CREATE POLICY "Avatar images are publicly accessible"
  ON storage.objects
  FOR SELECT
  USING (bucket_id = 'avatars');

CREATE POLICY "Users can upload their own avatar"
  ON storage.objects
  FOR INSERT
  WITH CHECK (
    bucket_id = 'avatars' 
    AND auth.uid()::text = (storage.foldername(name))[1]
  );

CREATE POLICY "Users can update their own avatar"
  ON storage.objects
  FOR UPDATE
  USING (
    bucket_id = 'avatars' 
    AND auth.uid()::text = (storage.foldername(name))[1]
  );

CREATE POLICY "Users can delete their own avatar"
  ON storage.objects
  FOR DELETE
  USING (
    bucket_id = 'avatars' 
    AND auth.uid()::text = (storage.foldername(name))[1]
  );

-- Portfolio storage policies
CREATE POLICY "Portfolio images are publicly accessible"
  ON storage.objects
  FOR SELECT
  USING (bucket_id = 'portfolios');

CREATE POLICY "Users can upload their own portfolio images"
  ON storage.objects
  FOR INSERT
  WITH CHECK (
    bucket_id = 'portfolios' 
    AND auth.uid()::text = (storage.foldername(name))[1]
  );

CREATE POLICY "Users can update their own portfolio images"
  ON storage.objects
  FOR UPDATE
  USING (
    bucket_id = 'portfolios' 
    AND auth.uid()::text = (storage.foldername(name))[1]
  );

CREATE POLICY "Users can delete their own portfolio images"
  ON storage.objects
  FOR DELETE
  USING (
    bucket_id = 'portfolios' 
    AND auth.uid()::text = (storage.foldername(name))[1]
  );

-- Create portfolio_images table to track portfolio uploads
CREATE TABLE public.portfolio_images (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  image_url TEXT NOT NULL,
  title TEXT,
  description TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.portfolio_images ENABLE ROW LEVEL SECURITY;

-- Portfolio images policies
CREATE POLICY "Portfolio images are viewable by everyone"
  ON public.portfolio_images
  FOR SELECT
  USING (true);

CREATE POLICY "Users can manage own portfolio images"
  ON public.portfolio_images
  FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);