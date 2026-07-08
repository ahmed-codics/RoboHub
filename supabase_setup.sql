-- CONSOLIDATED SUPABASE SCHEMA SETUP
-- Generated on 2026-06-02T11:26:22.806Z

-- ==========================================
-- MIGRATION: 20251117170455_f2f0a574-a93f-48e1-a7b2-6c8657ce6e1f.sql
-- ==========================================

-- Create user roles enum
CREATE TYPE public.app_role AS ENUM ('freelancer', 'client', 'admin');

-- Create job status enum
CREATE TYPE public.job_status AS ENUM ('open', 'in_progress', 'completed', 'cancelled');

-- Create bid status enum
CREATE TYPE public.bid_status AS ENUM ('pending', 'accepted', 'rejected');

-- Create payment type enum
CREATE TYPE public.payment_type AS ENUM ('premium_subscription', 'job_payment');

-- Create payment status enum
CREATE TYPE public.payment_status AS ENUM ('pending', 'completed', 'failed', 'refunded');

-- Create profiles table
CREATE TABLE public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  bio TEXT,
  avatar_url TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Enable RLS on profiles
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- Profiles policies
CREATE POLICY "Profiles are viewable by everyone"
  ON public.profiles FOR SELECT
  USING (true);

CREATE POLICY "Users can update own profile"
  ON public.profiles FOR UPDATE
  USING (auth.uid() = id);

CREATE POLICY "Users can insert own profile"
  ON public.profiles FOR INSERT
  WITH CHECK (auth.uid() = id);

-- Create user_roles table
CREATE TABLE public.user_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role app_role NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(user_id, role)
);

-- Enable RLS on user_roles
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

-- User roles policies
CREATE POLICY "User roles are viewable by everyone"
  ON public.user_roles FOR SELECT
  USING (true);

-- Create security definer function to check roles
CREATE OR REPLACE FUNCTION public.has_role(_user_id UUID, _role app_role)
RETURNS BOOLEAN
LANGUAGE SQL
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

-- Create freelancer_skills table
CREATE TABLE public.freelancer_skills (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  skill TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Enable RLS on freelancer_skills
ALTER TABLE public.freelancer_skills ENABLE ROW LEVEL SECURITY;

-- Freelancer skills policies
CREATE POLICY "Skills are viewable by everyone"
  ON public.freelancer_skills FOR SELECT
  USING (true);

CREATE POLICY "Users can manage own skills"
  ON public.freelancer_skills FOR ALL
  USING (auth.uid() = user_id);

-- Create jobs table
CREATE TABLE public.jobs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  required_skills TEXT[] NOT NULL DEFAULT '{}',
  budget DECIMAL(10, 2) NOT NULL,
  status job_status NOT NULL DEFAULT 'open',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Enable RLS on jobs
ALTER TABLE public.jobs ENABLE ROW LEVEL SECURITY;

-- Jobs policies
CREATE POLICY "Jobs are viewable by everyone"
  ON public.jobs FOR SELECT
  USING (true);

CREATE POLICY "Clients can create jobs"
  ON public.jobs FOR INSERT
  WITH CHECK (
    auth.uid() = client_id AND
    public.has_role(auth.uid(), 'client')
  );

CREATE POLICY "Clients can update own jobs"
  ON public.jobs FOR UPDATE
  USING (auth.uid() = client_id);

CREATE POLICY "Clients can delete own jobs"
  ON public.jobs FOR DELETE
  USING (auth.uid() = client_id);

-- Create bids table
CREATE TABLE public.bids (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  job_id UUID NOT NULL REFERENCES public.jobs(id) ON DELETE CASCADE,
  freelancer_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  bid_amount DECIMAL(10, 2) NOT NULL,
  proposal_text TEXT NOT NULL,
  status bid_status NOT NULL DEFAULT 'pending',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Enable RLS on bids
ALTER TABLE public.bids ENABLE ROW LEVEL SECURITY;

-- Bids policies
CREATE POLICY "Bids are viewable by job owner and bidder"
  ON public.bids FOR SELECT
  USING (
    auth.uid() = freelancer_id OR
    auth.uid() IN (SELECT client_id FROM public.jobs WHERE id = job_id)
  );

CREATE POLICY "Freelancers can create bids"
  ON public.bids FOR INSERT
  WITH CHECK (
    auth.uid() = freelancer_id AND
    public.has_role(auth.uid(), 'freelancer')
  );

CREATE POLICY "Freelancers can update own bids"
  ON public.bids FOR UPDATE
  USING (auth.uid() = freelancer_id);

-- Create premium_plans table
CREATE TABLE public.premium_plans (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  plan_type TEXT NOT NULL DEFAULT 'free',
  price DECIMAL(10, 2),
  active_until TIMESTAMPTZ,
  extra_bids INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(user_id)
);

-- Enable RLS on premium_plans
ALTER TABLE public.premium_plans ENABLE ROW LEVEL SECURITY;

-- Premium plans policies
CREATE POLICY "Users can view own premium plan"
  ON public.premium_plans FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own premium plan"
  ON public.premium_plans FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Create payments table
CREATE TABLE public.payments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  amount DECIMAL(10, 2) NOT NULL,
  type payment_type NOT NULL,
  status payment_status NOT NULL DEFAULT 'pending',
  metadata JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Enable RLS on payments
ALTER TABLE public.payments ENABLE ROW LEVEL SECURITY;

-- Payments policies
CREATE POLICY "Users can view own payments"
  ON public.payments FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Admins can view all payments"
  ON public.payments FOR SELECT
  USING (public.has_role(auth.uid(), 'admin'));

-- Create function to handle new user
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE PLPGSQL
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (id, name)
  VALUES (
    new.id,
    COALESCE(new.raw_user_meta_data->>'name', 'User')
  );
  RETURN new;
END;
$$;

-- Create trigger for new user
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Create function to update updated_at timestamp
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER
LANGUAGE PLPGSQL
AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$;

-- Create triggers for updated_at
CREATE TRIGGER update_profiles_updated_at
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_jobs_updated_at
  BEFORE UPDATE ON public.jobs
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_bids_updated_at
  BEFORE UPDATE ON public.bids
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_premium_plans_updated_at
  BEFORE UPDATE ON public.premium_plans
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- ==========================================
-- MIGRATION: 20251117170506_dcad2971-0ae5-48e2-8cc1-d0ff10e131dc.sql
-- ==========================================

-- Fix the update_updated_at_column function to set search_path
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER
LANGUAGE PLPGSQL
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$;

-- ==========================================
-- MIGRATION: 20251117172232_c59085d9-3f87-44ce-9526-662ad670a283.sql
-- ==========================================

-- Create escrow_transactions table
CREATE TABLE public.escrow_transactions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  job_id UUID NOT NULL REFERENCES public.jobs(id) ON DELETE CASCADE,
  client_id UUID NOT NULL,
  freelancer_id UUID NOT NULL,
  amount NUMERIC NOT NULL,
  status TEXT NOT NULL DEFAULT 'held' CHECK (status IN ('held', 'released', 'refunded')),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  released_at TIMESTAMP WITH TIME ZONE
);

-- Enable RLS
ALTER TABLE public.escrow_transactions ENABLE ROW LEVEL SECURITY;

-- Escrow policies
CREATE POLICY "Escrow viewable by involved parties"
  ON public.escrow_transactions
  FOR SELECT
  USING (auth.uid() = client_id OR auth.uid() = freelancer_id);

CREATE POLICY "Clients can create escrow"
  ON public.escrow_transactions
  FOR INSERT
  WITH CHECK (auth.uid() = client_id AND has_role(auth.uid(), 'client'::app_role));

CREATE POLICY "Clients can update escrow"
  ON public.escrow_transactions
  FOR UPDATE
  USING (auth.uid() = client_id);

-- Create reviews table
CREATE TABLE public.reviews (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  job_id UUID NOT NULL REFERENCES public.jobs(id) ON DELETE CASCADE,
  reviewer_id UUID NOT NULL,
  reviewee_id UUID NOT NULL,
  rating INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 5),
  comment TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.reviews ENABLE ROW LEVEL SECURITY;

-- Review policies
CREATE POLICY "Reviews are viewable by everyone"
  ON public.reviews
  FOR SELECT
  USING (true);

CREATE POLICY "Users can create reviews"
  ON public.reviews
  FOR INSERT
  WITH CHECK (auth.uid() = reviewer_id);

-- Create notifications table
CREATE TABLE public.notifications (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  type TEXT NOT NULL,
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  read BOOLEAN NOT NULL DEFAULT false,
  metadata JSONB,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

-- Notification policies
CREATE POLICY "Users can view own notifications"
  ON public.notifications
  FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can update own notifications"
  ON public.notifications
  FOR UPDATE
  USING (auth.uid() = user_id);

-- Add realtime for notifications
ALTER PUBLICATION supabase_realtime ADD TABLE public.notifications;

-- Add triggers for updated_at
CREATE TRIGGER update_escrow_transactions_updated_at
  BEFORE UPDATE ON public.escrow_transactions
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_reviews_updated_at
  BEFORE UPDATE ON public.reviews
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- ==========================================
-- MIGRATION: 20251117172841_7dac9533-b4e3-4f8e-b66d-e88711230d17.sql
-- ==========================================

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

-- ==========================================
-- MIGRATION: 20251117173222_a606e2e9-b89d-4613-8294-152ae44852a6.sql
-- ==========================================

-- Add INSERT policy for user_roles
-- Allow users to create their own role entry during signup
CREATE POLICY "Users can insert own role during signup"
  ON public.user_roles
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- ==========================================
-- MIGRATION: 20251117181502_77683aad-aaa7-4aba-9a4c-a548825217b4.sql
-- ==========================================

-- Add DELETE policy for user_roles table so users can delete their own roles when switching
CREATE POLICY "Users can delete own roles"
ON public.user_roles
FOR DELETE
TO authenticated
USING (auth.uid() = user_id);

-- ==========================================
-- MIGRATION: 20251117182917_c2a2dbe2-80c4-438f-91a0-d8c0c2f3a350.sql
-- ==========================================

-- Fix: Restrict profile access to authenticated users only
DROP POLICY IF EXISTS "Profiles are viewable by everyone" ON profiles;

CREATE POLICY "Authenticated users can view profiles" ON profiles
  FOR SELECT
  USING (auth.uid() IS NOT NULL);

-- ==========================================
-- MIGRATION: 20251117185409_58e8cbe5-9b8c-41ff-927d-caf9ba6e48ad.sql
-- ==========================================

-- Create messages table for client-freelancer communication
CREATE TABLE public.messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  job_id UUID NOT NULL REFERENCES public.jobs(id) ON DELETE CASCADE,
  sender_id UUID NOT NULL,
  receiver_id UUID NOT NULL,
  message TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL
);

-- Enable RLS
ALTER TABLE public.messages ENABLE ROW LEVEL SECURITY;

-- Messages viewable by sender and receiver
CREATE POLICY "Users can view their own messages"
ON public.messages
FOR SELECT
USING (auth.uid() = sender_id OR auth.uid() = receiver_id);

-- Users can send messages
CREATE POLICY "Users can send messages"
ON public.messages
FOR INSERT
WITH CHECK (auth.uid() = sender_id);

-- Add platform_fee_paid column to escrow_transactions
ALTER TABLE public.escrow_transactions
ADD COLUMN platform_fee_paid BOOLEAN DEFAULT false NOT NULL;

-- Add release_requested column to escrow_transactions
ALTER TABLE public.escrow_transactions
ADD COLUMN release_requested BOOLEAN DEFAULT false NOT NULL,
ADD COLUMN release_requested_at TIMESTAMP WITH TIME ZONE;

-- Enable realtime for messages
ALTER PUBLICATION supabase_realtime ADD TABLE public.messages;

-- ==========================================
-- MIGRATION: 20251117191124_bb2fe773-0d1f-43f4-8d02-c7b87fcb84d3.sql
-- ==========================================

-- Add read status to messages table
ALTER TABLE public.messages
ADD COLUMN read BOOLEAN DEFAULT false NOT NULL;

-- Create index for faster unread queries
CREATE INDEX idx_messages_receiver_read ON public.messages(receiver_id, read) WHERE read = false;

-- Update RLS policy to allow updating read status
CREATE POLICY "Users can mark their received messages as read"
ON public.messages
FOR UPDATE
USING (auth.uid() = receiver_id)
WITH CHECK (auth.uid() = receiver_id);

-- ==========================================
-- MIGRATION: 20251118000742_9bf69be9-1cd4-41a2-b412-cbfbfe9e3d0d.sql
-- ==========================================

-- Enable the trigger for profile creation on signup
-- This trigger was already defined but we need to make sure it's attached

-- First, drop the existing trigger if it exists to avoid conflicts
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;

-- Create the trigger that automatically creates a profile when a user signs up
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Also ensure the profiles table has proper indexes for performance
CREATE INDEX IF NOT EXISTS idx_profiles_id ON public.profiles(id);

-- Add an index to user_roles for faster lookups
CREATE INDEX IF NOT EXISTS idx_user_roles_user_id ON public.user_roles(user_id);
CREATE INDEX IF NOT EXISTS idx_user_roles_role ON public.user_roles(role);

-- ==========================================
-- MIGRATION: 20251128155027_c2b799e0-81a1-4c5d-892e-43abc17ef3bc.sql
-- ==========================================

-- Add Paymob tracking fields to escrow_transactions
ALTER TABLE public.escrow_transactions
ADD COLUMN paymob_transaction_id text,
ADD COLUMN paymob_order_id text;

-- Create job_payment_intents table to track payment flow
CREATE TABLE public.job_payment_intents (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  job_id uuid NOT NULL REFERENCES public.jobs(id) ON DELETE CASCADE,
  client_id uuid NOT NULL,
  amount numeric NOT NULL,
  platform_fee numeric NOT NULL,
  total_amount numeric NOT NULL,
  paymob_order_id text,
  paymob_transaction_id text,
  payment_status text NOT NULL DEFAULT 'pending',
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  completed_at timestamp with time zone,
  UNIQUE(job_id)
);

-- Enable RLS
ALTER TABLE public.job_payment_intents ENABLE ROW LEVEL SECURITY;

-- RLS Policies for job_payment_intents
CREATE POLICY "Clients can view own payment intents"
ON public.job_payment_intents
FOR SELECT
USING (auth.uid() = client_id);

CREATE POLICY "Clients can create payment intents"
ON public.job_payment_intents
FOR INSERT
WITH CHECK (auth.uid() = client_id);

CREATE POLICY "Admins can view all payment intents"
ON public.job_payment_intents
FOR SELECT
USING (has_role(auth.uid(), 'admin'));

-- Add index for faster lookups
CREATE INDEX idx_payment_intents_job_id ON public.job_payment_intents(job_id);
CREATE INDEX idx_payment_intents_client_id ON public.job_payment_intents(client_id);
CREATE INDEX idx_payment_intents_paymob_order ON public.job_payment_intents(paymob_order_id);

-- ==========================================
-- MIGRATION: 20251207024830_add_search_functions.sql
-- ==========================================

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


