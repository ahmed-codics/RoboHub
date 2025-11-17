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