-- ============================================================================
-- RemoteRobotics — Phase 2 & 3 feature tables
-- Notification prefs, service listings (Fiverr model), bookmarks, milestones,
-- disputes. Run in Supabase SQL editor or via `supabase db push`.
-- ============================================================================

-- ---------------------------------------------------------------------------
-- 1. notification_preferences
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.notification_preferences (
  user_id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email_notifications boolean NOT NULL DEFAULT true,
  marketing_emails boolean NOT NULL DEFAULT false,
  bid_alerts boolean NOT NULL DEFAULT true,
  message_alerts boolean NOT NULL DEFAULT true,
  updated_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.notification_preferences ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Users manage own notification prefs" ON public.notification_preferences;
CREATE POLICY "Users manage own notification prefs" ON public.notification_preferences
  FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- ---------------------------------------------------------------------------
-- 2. service_listings (+ packages) — the Fiverr "gig" model
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.service_listings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  freelancer_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  title text NOT NULL,
  description text NOT NULL DEFAULT '',
  category text,
  cover_image text,
  tags text[] NOT NULL DEFAULT '{}',
  starting_price numeric NOT NULL DEFAULT 0,
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.service_listings ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Active services viewable by everyone" ON public.service_listings;
CREATE POLICY "Active services viewable by everyone" ON public.service_listings
  FOR SELECT USING (is_active OR auth.uid() = freelancer_id);
DROP POLICY IF EXISTS "Freelancers manage own services" ON public.service_listings;
CREATE POLICY "Freelancers manage own services" ON public.service_listings
  FOR ALL USING (auth.uid() = freelancer_id) WITH CHECK (auth.uid() = freelancer_id);

CREATE TABLE IF NOT EXISTS public.service_packages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  listing_id uuid NOT NULL REFERENCES public.service_listings(id) ON DELETE CASCADE,
  tier text NOT NULL DEFAULT 'basic', -- basic | standard | premium
  title text,
  description text,
  price numeric NOT NULL DEFAULT 0,
  delivery_days integer NOT NULL DEFAULT 7,
  revisions integer NOT NULL DEFAULT 1,
  features text[] NOT NULL DEFAULT '{}',
  sort_order integer NOT NULL DEFAULT 0
);
ALTER TABLE public.service_packages ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Service packages viewable by everyone" ON public.service_packages;
CREATE POLICY "Service packages viewable by everyone" ON public.service_packages
  FOR SELECT USING (true);
DROP POLICY IF EXISTS "Freelancers manage own service packages" ON public.service_packages;
CREATE POLICY "Freelancers manage own service packages" ON public.service_packages
  FOR ALL USING (
    EXISTS (SELECT 1 FROM public.service_listings s WHERE s.id = listing_id AND s.freelancer_id = auth.uid())
  ) WITH CHECK (
    EXISTS (SELECT 1 FROM public.service_listings s WHERE s.id = listing_id AND s.freelancer_id = auth.uid())
  );

-- ---------------------------------------------------------------------------
-- 3. saved_items — bookmarks / favorites
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.saved_items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  item_type text NOT NULL, -- 'freelancer' | 'job' | 'service'
  item_id uuid NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (user_id, item_type, item_id)
);
ALTER TABLE public.saved_items ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Users manage own saved items" ON public.saved_items;
CREATE POLICY "Users manage own saved items" ON public.saved_items
  FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- ---------------------------------------------------------------------------
-- 4. milestones — project/contract workspace deliverables
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.milestones (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  job_id uuid NOT NULL REFERENCES public.jobs(id) ON DELETE CASCADE,
  title text NOT NULL,
  description text,
  amount numeric NOT NULL DEFAULT 0,
  due_date date,
  status text NOT NULL DEFAULT 'pending', -- pending | submitted | approved | paid
  sort_order integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.milestones ENABLE ROW LEVEL SECURITY;
-- Visible to the job's client and to any freelancer with a bid on the job
DROP POLICY IF EXISTS "Milestones viewable by job parties" ON public.milestones;
CREATE POLICY "Milestones viewable by job parties" ON public.milestones
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM public.jobs j WHERE j.id = job_id AND j.client_id = auth.uid())
    OR EXISTS (SELECT 1 FROM public.bids b WHERE b.job_id = milestones.job_id AND b.freelancer_id = auth.uid())
  );
DROP POLICY IF EXISTS "Clients manage milestones" ON public.milestones;
CREATE POLICY "Clients manage milestones" ON public.milestones
  FOR ALL USING (
    EXISTS (SELECT 1 FROM public.jobs j WHERE j.id = job_id AND j.client_id = auth.uid())
  ) WITH CHECK (
    EXISTS (SELECT 1 FROM public.jobs j WHERE j.id = job_id AND j.client_id = auth.uid())
  );
-- Freelancers with an accepted bid may update milestone status (e.g. submit work)
DROP POLICY IF EXISTS "Freelancers update milestone status" ON public.milestones;
CREATE POLICY "Freelancers update milestone status" ON public.milestones
  FOR UPDATE USING (
    EXISTS (SELECT 1 FROM public.bids b WHERE b.job_id = milestones.job_id AND b.freelancer_id = auth.uid() AND b.status = 'accepted')
  );

-- ---------------------------------------------------------------------------
-- 5. disputes
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.disputes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  job_id uuid NOT NULL REFERENCES public.jobs(id) ON DELETE CASCADE,
  raised_by uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  against_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  reason text NOT NULL,
  description text NOT NULL DEFAULT '',
  evidence_url text,
  status text NOT NULL DEFAULT 'open', -- open | under_review | resolved | rejected
  resolution text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.disputes ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Disputes viewable by involved parties or admin" ON public.disputes;
CREATE POLICY "Disputes viewable by involved parties or admin" ON public.disputes
  FOR SELECT USING (
    auth.uid() = raised_by OR auth.uid() = against_id OR public.has_role(auth.uid(), 'admin')
  );
DROP POLICY IF EXISTS "Users can file disputes" ON public.disputes;
CREATE POLICY "Users can file disputes" ON public.disputes
  FOR INSERT WITH CHECK (auth.uid() = raised_by);
DROP POLICY IF EXISTS "Admins manage disputes" ON public.disputes;
CREATE POLICY "Admins manage disputes" ON public.disputes
  FOR UPDATE USING (public.has_role(auth.uid(), 'admin'));

NOTIFY pgrst, 'reload config';
