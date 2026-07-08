import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.81.1';
import { PAYMOB_CONFIG } from '../_shared/paymob-config.ts';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

Deno.serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? ''
    );

    // Get the authorization header
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return new Response(
        JSON.stringify({ error: 'No authorization header' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Get the user from the auth header
    const { data: { user }, error: authError } = await supabase.auth.getUser(
      authHeader.replace('Bearer ', '')
    );

    if (authError || !user) {
      return new Response(
        JSON.stringify({ error: 'Unauthorized' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log('[create-paymob-payment] Request from user:', user.id);

    // Parse request body
    // payment_type: 'job_funding' | 'subscription'
    const { job_id, amount, payment_type = 'job_funding' } = await req.json();

    if (!amount) {
      return new Response(
        JSON.stringify({ error: 'amount is required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    let orderInfo = {
      title: 'Payment',
      description: 'Payment',
      merchant_order_id: '',
      platform_fee: 0,
      total_amount: amount
    };

    // --- Validation Based on Type ---

    if (payment_type === 'job_funding') {
      if (!job_id) {
        return new Response(JSON.stringify({ error: 'job_id is required for job funding' }), { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
      }

      // Verify Job
      const { data: job, error: jobError } = await supabase
        .from('jobs')
        .select('*')
        .eq('id', job_id)
        .eq('client_id', user.id)
        .single();

      if (jobError || !job) {
        return new Response(JSON.stringify({ error: 'Job not found or unauthorized' }), { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
      }

      const platformFee = (amount * PAYMOB_CONFIG.PLATFORM_FEE_PERCENTAGE) / 100;
      orderInfo.platform_fee = platformFee;
      orderInfo.total_amount = amount + platformFee;
      orderInfo.title = job.title;
      orderInfo.description = job.description.substring(0, 100);
      orderInfo.merchant_order_id = job_id;

    } else if (payment_type === 'subscription') {
      orderInfo.title = 'Premium Subscription';
      orderInfo.description = 'Monthly premium subscription upgrade';
      orderInfo.merchant_order_id = `SUB_${user.id}_${Date.now()}`; // Unique ID for subscription attempt
      orderInfo.platform_fee = 0; // No extra fee for subscription usually
      orderInfo.total_amount = amount;
    } else {
      return new Response(JSON.stringify({ error: 'Invalid payment_type' }), { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }

    // --- Paymob Integration ---

    // Check if using dummy credentials
    const isDummyMode = PAYMOB_CONFIG.API_KEY === 'DUMMY_API_KEY_REPLACE_ME';

    if (isDummyMode) {
      console.log('[create-paymob-payment] Running in DUMMY MODE');

      const dummyOrderId = `DUMMY_${Date.now()}`;

      // Where to redirect in dummy mode?
      // Since we don't have a real iframe, we redirect to a test page or return a dummy URL
      // We will assume the frontend handles the redirect to /payment-test based on response

      const dummyPaymentUrl = `/payment-test?amount=${orderInfo.total_amount}&order_id=${dummyOrderId}&type=${payment_type}`;

      // Store Payment Intent (Generic or Job specific)
      // For subscription, we might not have a 'job_payment_intents' entry... 
      // Ideally we should have a 'payment_intents' table or similar. 
      // But for now, if it's job funding, store it.

      if (payment_type === 'job_funding') {
        await supabase.from('job_payment_intents').insert({
          job_id,
          client_id: user.id,
          amount,
          platform_fee: orderInfo.platform_fee,
          total_amount: orderInfo.total_amount,
          paymob_order_id: dummyOrderId,
          payment_status: 'pending'
        });
      } else {
        // For subscription, maybe check if we have a table or just relying on webhook matching orderID
        // We can insert into 'payments' table as pending
        await supabase.from('payments').insert({
          user_id: user.id,
          amount: orderInfo.total_amount,
          type: 'premium_subscription',
          status: 'pending',
          metadata: { paymob_order_id: dummyOrderId }
        });
      }

      return new Response(
        JSON.stringify({
          success: true,
          payment_url: dummyPaymentUrl,
          order_id: dummyOrderId,
          amount: orderInfo.total_amount,
          test_mode: true
        }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // --- Real Paymob Flow ---

    // 1. Auth
    const authResponse = await fetch(`${PAYMOB_CONFIG.BASE_URL}/auth/tokens`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ api_key: PAYMOB_CONFIG.API_KEY }),
    });
    const { token: authToken } = await authResponse.json();

    // 2. Create Order
    const orderResponse = await fetch(`${PAYMOB_CONFIG.BASE_URL}/ecommerce/orders`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        auth_token: authToken,
        delivery_needed: false,
        amount_cents: Math.round(orderInfo.total_amount * 100),
        currency: 'EGP',
        merchant_order_id: orderInfo.merchant_order_id,
        items: [{
          name: orderInfo.title,
          amount_cents: Math.round(orderInfo.total_amount * 100),
          description: orderInfo.description,
          quantity: 1
        }]
      }),
    });
    const { id: orderId } = await orderResponse.json();

    // 3. Payment Key
    const paymentKeyResponse = await fetch(`${PAYMOB_CONFIG.BASE_URL}/acceptance/payment_keys`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        auth_token: authToken,
        amount_cents: Math.round(orderInfo.total_amount * 100),
        expiration: 3600,
        order_id: orderId,
        billing_data: {
          apartment: 'NA', email: user.email || 'user@example.com', floor: 'NA', first_name: user.id.slice(0, 6), street: 'NA', building: 'NA', phone_number: 'NA', shipping_method: 'NA', postal_code: 'NA', city: 'NA', country: 'NA', last_name: 'User', state: 'NA'
        },
        currency: 'EGP',
        integration_id: PAYMOB_CONFIG.INTEGRATION_ID,
        lock_order_when_paid: true
      }),
    });
    const { token: paymentKey } = await paymentKeyResponse.json();

    // Store Intent
    if (payment_type === 'job_funding') {
      await supabase.from('job_payment_intents').insert({
        job_id, client_id: user.id, amount, platform_fee: orderInfo.platform_fee, total_amount: orderInfo.total_amount, paymob_order_id: orderId.toString(), payment_status: 'pending'
      });
    } else {
      await supabase.from('payments').insert({
        user_id: user.id, amount: orderInfo.total_amount, type: 'premium_subscription', status: 'pending', metadata: { paymob_order_id: orderId.toString() }
      });
    }

    const iframeUrl = `https://accept.paymob.com/api/acceptance/iframes/${PAYMOB_CONFIG.IFRAME_ID}?payment_token=${paymentKey}`;

    return new Response(
      JSON.stringify({
        success: true,
        payment_url: iframeUrl,
        order_id: orderId,
        amount: orderInfo.total_amount
      }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Paymob Error:', error);
    return new Response(
      JSON.stringify({ error: 'Internal server error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
