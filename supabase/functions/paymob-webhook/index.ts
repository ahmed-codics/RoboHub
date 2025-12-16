import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.81.1';
import { PAYMOB_CONFIG } from './paymob-config.ts';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    const payload = await req.json();
    const transaction = payload.obj;
    if (!transaction) throw new Error('No transaction object');

    const orderId = transaction.order?.id?.toString();
    const transactionId = transaction.id?.toString();
    const success = transaction.success;

    if (!orderId) throw new Error('Missing order ID');

    console.log(`[paymob-webhook] Processing ${orderId}, success: ${success}`);

    // Check if it's a Subscription (stored in 'payments' table pending) OR Job (stored in 'job_payment_intents')
    // Strategy: Try finding in 'payments' first (subscriptions), then 'job_payment_intents' (jobs).

    // --- 1. Check SUBSCRIPTIONS ('payments' table) ---
    const { data: subscriptionPayment, error: subError } = await supabase
      .from('payments')
      .select('*')
      .contains('metadata', { paymob_order_id: orderId })
      .maybeSingle();

    if (subscriptionPayment) {
      if (success) {
        console.log('[paymob-webhook] Activating premium subscription...');
        // 1. Update Payment Status
        await supabase.from('payments').update({
          status: 'completed',
          metadata: { ...subscriptionPayment.metadata, paymob_transaction_id: transactionId }
        }).eq('id', subscriptionPayment.id);

        // 2. Update/Create Premium Plan
        const activeUntil = new Date();
        activeUntil.setMonth(activeUntil.getMonth() + 1);

        await supabase.from('premium_plans').upsert({
          user_id: subscriptionPayment.user_id,
          plan_type: 'premium',
          price: subscriptionPayment.amount,
          active_until: activeUntil.toISOString(),
          extra_bids: 0
        });
      } else {
        // Mark as failed
        await supabase.from('payments').update({ status: 'failed' }).eq('id', subscriptionPayment.id);
      }
      return new Response(JSON.stringify({ success: true }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }

    // --- 2. Check JOB FUNDING ('job_payment_intents') ---
    const { data: jobIntent } = await supabase.from('job_payment_intents').select('*').eq('paymob_order_id', orderId).maybeSingle();

    if (jobIntent) {
      if (success) {
        console.log('[paymob-webhook] Funding job escrow...');
        await supabase.from('job_payment_intents').update({
          payment_status: 'completed',
          paymob_transaction_id: transactionId,
          completed_at: new Date().toISOString()
        }).eq('id', jobIntent.id);

        // Find accepted bid to create escrow
        const { data: bid } = await supabase.from('bids').select('*').eq('job_id', jobIntent.job_id).eq('status', 'accepted').maybeSingle();

        if (bid) {
          // Check if escrow already exists
          const { data: existingEscrow } = await supabase.from('escrow_transactions').select('*').eq('job_id', jobIntent.job_id).maybeSingle();

          if (existingEscrow) {
            await supabase.from('escrow_transactions').update({
              paymob_order_id: orderId, status: 'held', paymob_transaction_id: transactionId
            }).eq('id', existingEscrow.id);
          } else {
            await supabase.from('escrow_transactions').insert({
              job_id: jobIntent.job_id,
              client_id: jobIntent.client_id,
              freelancer_id: bid.freelancer_id,
              amount: jobIntent.amount,
              paymob_order_id: orderId,
              paymob_transaction_id: transactionId,
              status: 'held',
              platform_fee_paid: true
            });
          }
        }
      } else {
        await supabase.from('job_payment_intents').update({ payment_status: 'failed' }).eq('id', jobIntent.id);
      }
      return new Response(JSON.stringify({ success: true }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }

    // If neither found
    console.warn('[paymob-webhook] No matching payment intent found for order', orderId);
    return new Response(JSON.stringify({ success: true, warning: 'No intent found' }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });

  } catch (error) {
    console.error('[paymob-webhook] Error:', error);
    return new Response(JSON.stringify({ error: 'Internal server error' }), { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
  }
});
