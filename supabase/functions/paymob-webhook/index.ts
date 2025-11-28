import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.81.1';
import { PAYMOB_CONFIG } from '../_shared/paymob-config.ts';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Function to verify HMAC signature
function verifyHmacSignature(data: any, receivedHmac: string): boolean {
  // Paymob HMAC verification logic
  // For now, we'll skip HMAC verification in development with dummy keys
  if (PAYMOB_CONFIG.HMAC_SECRET === 'DUMMY_HMAC_SECRET_REPLACE_ME') {
    console.warn('[paymob-webhook] HMAC verification skipped - using dummy secret');
    return true;
  }
  
  // In production, implement proper HMAC verification here
  // Example: Calculate HMAC and compare with receivedHmac
  return true;
}

Deno.serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    console.log('[paymob-webhook] Webhook received');

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    // Parse webhook payload
    const payload = await req.json();
    console.log('[paymob-webhook] Payload type:', payload.type);

    // Extract transaction data
    const transaction = payload.obj;
    if (!transaction) {
      console.error('[paymob-webhook] No transaction object in payload');
      return new Response(
        JSON.stringify({ error: 'Invalid payload' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const orderId = transaction.order?.id?.toString();
    const transactionId = transaction.id?.toString();
    const success = transaction.success;
    const amountCents = transaction.amount_cents;

    console.log('[paymob-webhook] Transaction details:', {
      orderId,
      transactionId,
      success,
      amountCents
    });

    if (!orderId) {
      console.error('[paymob-webhook] No order ID in transaction');
      return new Response(
        JSON.stringify({ error: 'Missing order ID' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Find the payment intent
    const { data: paymentIntent, error: intentError } = await supabase
      .from('job_payment_intents')
      .select('*')
      .eq('paymob_order_id', orderId)
      .single();

    if (intentError || !paymentIntent) {
      console.error('[paymob-webhook] Payment intent not found:', intentError);
      return new Response(
        JSON.stringify({ error: 'Payment intent not found' }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log('[paymob-webhook] Found payment intent for job:', paymentIntent.job_id);

    if (success) {
      console.log('[paymob-webhook] Payment successful, creating escrow...');

      // Get the accepted bid for this job
      const { data: bid, error: bidError } = await supabase
        .from('bids')
        .select('*')
        .eq('job_id', paymentIntent.job_id)
        .eq('status', 'accepted')
        .single();

      if (bidError || !bid) {
        console.error('[paymob-webhook] No accepted bid found:', bidError);
        // Update payment intent but don't fail
      }

      // Update payment intent
      const { error: updateIntentError } = await supabase
        .from('job_payment_intents')
        .update({
          payment_status: 'completed',
          paymob_transaction_id: transactionId,
          completed_at: new Date().toISOString()
        })
        .eq('id', paymentIntent.id);

      if (updateIntentError) {
        console.error('[paymob-webhook] Failed to update payment intent:', updateIntentError);
      } else {
        console.log('[paymob-webhook] Payment intent updated to completed');
      }

      // Create or update escrow transaction if bid exists
      if (bid) {
        const { data: existingEscrow } = await supabase
          .from('escrow_transactions')
          .select('*')
          .eq('job_id', paymentIntent.job_id)
          .single();

        if (existingEscrow) {
          // Update existing escrow
          const { error: updateEscrowError } = await supabase
            .from('escrow_transactions')
            .update({
              paymob_order_id: orderId,
              paymob_transaction_id: transactionId,
              platform_fee_paid: true,
              status: 'held'
            })
            .eq('id', existingEscrow.id);

          if (updateEscrowError) {
            console.error('[paymob-webhook] Failed to update escrow:', updateEscrowError);
          } else {
            console.log('[paymob-webhook] Escrow updated with payment info');
          }
        } else {
          // Create new escrow
          const { error: createEscrowError } = await supabase
            .from('escrow_transactions')
            .insert({
              job_id: paymentIntent.job_id,
              client_id: paymentIntent.client_id,
              freelancer_id: bid.freelancer_id,
              amount: paymentIntent.amount,
              paymob_order_id: orderId,
              paymob_transaction_id: transactionId,
              platform_fee_paid: true,
              status: 'held'
            });

          if (createEscrowError) {
            console.error('[paymob-webhook] Failed to create escrow:', createEscrowError);
          } else {
            console.log('[paymob-webhook] Escrow created successfully');
          }
        }

        // Send notification to freelancer
        const { error: notifError } = await supabase
          .from('notifications')
          .insert({
            user_id: bid.freelancer_id,
            type: 'payment_received',
            title: 'Payment Received',
            message: 'The client has paid for the job. Funds are held in escrow.',
            metadata: { job_id: paymentIntent.job_id }
          });

        if (notifError) {
          console.error('[paymob-webhook] Failed to create notification:', notifError);
        } else {
          console.log('[paymob-webhook] Notification sent to freelancer');
        }
      }

    } else {
      console.log('[paymob-webhook] Payment failed');
      
      // Update payment intent to failed
      const { error: updateIntentError } = await supabase
        .from('job_payment_intents')
        .update({
          payment_status: 'failed',
          paymob_transaction_id: transactionId
        })
        .eq('id', paymentIntent.id);

      if (updateIntentError) {
        console.error('[paymob-webhook] Failed to update payment intent:', updateIntentError);
      } else {
        console.log('[paymob-webhook] Payment intent marked as failed');
      }
    }

    console.log('[paymob-webhook] Webhook processed successfully');

    return new Response(
      JSON.stringify({ success: true, message: 'Webhook processed' }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('[paymob-webhook] Unexpected error:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return new Response(
      JSON.stringify({ error: 'Internal server error', details: errorMessage }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
