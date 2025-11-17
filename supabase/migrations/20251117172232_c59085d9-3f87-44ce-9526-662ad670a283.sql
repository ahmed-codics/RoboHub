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