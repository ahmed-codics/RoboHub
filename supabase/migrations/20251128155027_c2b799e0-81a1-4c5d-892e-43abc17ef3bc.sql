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