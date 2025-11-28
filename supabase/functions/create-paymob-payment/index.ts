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
      console.error('[create-paymob-payment] No authorization header');
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
      console.error('[create-paymob-payment] Auth error:', authError);
      return new Response(
        JSON.stringify({ error: 'Unauthorized' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log('[create-paymob-payment] Request from user:', user.id);

    // Parse request body
    const { job_id, amount } = await req.json();

    if (!job_id || !amount) {
      console.error('[create-paymob-payment] Missing job_id or amount');
      return new Response(
        JSON.stringify({ error: 'job_id and amount are required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Verify the job exists and user is the client
    const { data: job, error: jobError } = await supabase
      .from('jobs')
      .select('*')
      .eq('id', job_id)
      .eq('client_id', user.id)
      .single();

    if (jobError || !job) {
      console.error('[create-paymob-payment] Job not found or unauthorized:', jobError);
      return new Response(
        JSON.stringify({ error: 'Job not found or unauthorized' }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Calculate platform fee and total
    const platformFee = (amount * PAYMOB_CONFIG.PLATFORM_FEE_PERCENTAGE) / 100;
    const totalAmount = amount + platformFee;

    console.log('[create-paymob-payment] Calculated fees - Amount:', amount, 'Platform Fee:', platformFee, 'Total:', totalAmount);

    // Step 1: Get authentication token from Paymob
    console.log('[create-paymob-payment] Requesting Paymob auth token...');
    const authResponse = await fetch(`${PAYMOB_CONFIG.BASE_URL}/auth/tokens`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ api_key: PAYMOB_CONFIG.API_KEY }),
    });

    if (!authResponse.ok) {
      const authError = await authResponse.text();
      console.error('[create-paymob-payment] Paymob auth failed:', authError);
      return new Response(
        JSON.stringify({ error: 'Payment gateway authentication failed' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const authData = await authResponse.json();
    const authToken = authData.token;
    console.log('[create-paymob-payment] Auth token obtained');

    // Step 2: Create order
    console.log('[create-paymob-payment] Creating Paymob order...');
    const orderResponse = await fetch(`${PAYMOB_CONFIG.BASE_URL}/ecommerce/orders`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        auth_token: authToken,
        delivery_needed: false,
        amount_cents: Math.round(totalAmount * 100), // Convert to cents
        currency: 'EGP',
        merchant_order_id: job_id,
        items: [{
          name: job.title,
          amount_cents: Math.round(amount * 100),
          description: job.description.substring(0, 100),
          quantity: 1
        }]
      }),
    });

    if (!orderResponse.ok) {
      const orderError = await orderResponse.text();
      console.error('[create-paymob-payment] Paymob order creation failed:', orderError);
      return new Response(
        JSON.stringify({ error: 'Failed to create payment order' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const orderData = await orderResponse.json();
    const orderId = orderData.id;
    console.log('[create-paymob-payment] Order created:', orderId);

    // Step 3: Get payment key
    console.log('[create-paymob-payment] Requesting payment key...');
    const paymentKeyResponse = await fetch(`${PAYMOB_CONFIG.BASE_URL}/acceptance/payment_keys`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        auth_token: authToken,
        amount_cents: Math.round(totalAmount * 100),
        expiration: 3600,
        order_id: orderId,
        billing_data: {
          apartment: 'NA',
          email: user.email || 'client@example.com',
          floor: 'NA',
          first_name: user.email?.split('@')[0] || 'Client',
          street: 'NA',
          building: 'NA',
          phone_number: 'NA',
          shipping_method: 'NA',
          postal_code: 'NA',
          city: 'NA',
          country: 'NA',
          last_name: 'User',
          state: 'NA'
        },
        currency: 'EGP',
        integration_id: PAYMOB_CONFIG.INTEGRATION_ID,
        lock_order_when_paid: true
      }),
    });

    if (!paymentKeyResponse.ok) {
      const paymentKeyError = await paymentKeyResponse.text();
      console.error('[create-paymob-payment] Payment key creation failed:', paymentKeyError);
      return new Response(
        JSON.stringify({ error: 'Failed to generate payment key' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const paymentKeyData = await paymentKeyResponse.json();
    const paymentKey = paymentKeyData.token;
    console.log('[create-paymob-payment] Payment key generated');

    // Store payment intent in database
    const { error: intentError } = await supabase
      .from('job_payment_intents')
      .insert({
        job_id,
        client_id: user.id,
        amount,
        platform_fee: platformFee,
        total_amount: totalAmount,
        paymob_order_id: orderId.toString(),
        payment_status: 'pending'
      });

    if (intentError) {
      console.error('[create-paymob-payment] Failed to store payment intent:', intentError);
    } else {
      console.log('[create-paymob-payment] Payment intent stored');
    }

    // Return iframe URL
    const iframeUrl = `https://accept.paymob.com/api/acceptance/iframes/${PAYMOB_CONFIG.IFRAME_ID}?payment_token=${paymentKey}`;
    
    console.log('[create-paymob-payment] Payment URL generated successfully');

    return new Response(
      JSON.stringify({
        success: true,
        payment_url: iframeUrl,
        order_id: orderId,
        amount: totalAmount
      }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('[create-paymob-payment] Unexpected error:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return new Response(
      JSON.stringify({ error: 'Internal server error', details: errorMessage }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
