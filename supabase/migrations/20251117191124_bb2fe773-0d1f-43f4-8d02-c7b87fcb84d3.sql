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