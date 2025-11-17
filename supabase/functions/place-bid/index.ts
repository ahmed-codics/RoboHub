import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.81.1';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Get user from auth header
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return new Response(
        JSON.stringify({ error: 'Missing authorization header' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const token = authHeader.replace('Bearer ', '');
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);
    
    if (authError || !user) {
      return new Response(
        JSON.stringify({ error: 'Unauthorized' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Check if user is a freelancer
    const { data: roleData } = await supabase
      .from('user_roles')
      .select('role')
      .eq('user_id', user.id)
      .single();

    if (!roleData || roleData.role !== 'freelancer') {
      return new Response(
        JSON.stringify({ error: 'Only freelancers can place bids' }),
        { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Get request body
    const { job_id, bid_amount, proposal_text } = await req.json();

    if (!job_id || !bid_amount || !proposal_text) {
      return new Response(
        JSON.stringify({ error: 'Missing required fields' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Check bid limits
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

    // Get user's premium plan
    const { data: premiumPlan } = await supabase
      .from('premium_plans')
      .select('plan_type, extra_bids')
      .eq('user_id', user.id)
      .single();

    // Count bids this month
    const { count: bidCount } = await supabase
      .from('bids')
      .select('*', { count: 'exact', head: true })
      .eq('freelancer_id', user.id)
      .gte('created_at', startOfMonth.toISOString());

    const monthlyBidCount = bidCount || 0;

    // Check limits
    if (premiumPlan?.plan_type === 'free') {
      const maxBids = 10 + (premiumPlan.extra_bids || 0);
      if (monthlyBidCount >= maxBids) {
        return new Response(
          JSON.stringify({ 
            error: 'Monthly bid limit reached. Upgrade to premium for unlimited bids.',
            current_bids: monthlyBidCount,
            max_bids: maxBids
          }),
          { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
    }

    // Create the bid
    const { data: bid, error: bidError } = await supabase
      .from('bids')
      .insert({
        job_id,
        freelancer_id: user.id,
        bid_amount,
        proposal_text,
        status: 'pending'
      })
      .select()
      .single();

    if (bidError) {
      console.error('Error creating bid:', bidError);
      return new Response(
        JSON.stringify({ error: 'Failed to create bid' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Get job owner for notification
    const { data: job } = await supabase
      .from('jobs')
      .select('client_id, title')
      .eq('id', job_id)
      .single();

    if (job) {
      // Create notification for client
      await supabase
        .from('notifications')
        .insert({
          user_id: job.client_id,
          type: 'new_bid',
          title: 'New Bid Received',
          message: `You received a new bid on "${job.title}"`,
          metadata: { job_id, bid_id: bid.id }
        });
    }

    return new Response(
      JSON.stringify({ 
        success: true, 
        bid,
        remaining_bids: premiumPlan?.plan_type === 'free' 
          ? (10 + (premiumPlan.extra_bids || 0)) - monthlyBidCount - 1
          : 'unlimited'
      }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error in place-bid function:', error);
    return new Response(
      JSON.stringify({ error: 'Internal server error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
