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

    // Get request body
    const { bid_id } = await req.json();

    if (!bid_id) {
      return new Response(
        JSON.stringify({ error: 'Missing bid_id' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Get bid details
    const { data: bid, error: bidFetchError } = await supabase
      .from('bids')
      .select('*, jobs!inner(client_id, title, budget)')
      .eq('id', bid_id)
      .single();

    if (bidFetchError || !bid) {
      return new Response(
        JSON.stringify({ error: 'Bid not found' }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Verify user is the job owner
    if (bid.jobs.client_id !== user.id) {
      return new Response(
        JSON.stringify({ error: 'Only job owner can accept bids' }),
        { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Update bid status to accepted
    const { error: bidUpdateError } = await supabase
      .from('bids')
      .update({ status: 'accepted' })
      .eq('id', bid_id);

    if (bidUpdateError) {
      console.error('Error updating bid:', bidUpdateError);
      return new Response(
        JSON.stringify({ error: 'Failed to accept bid' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Update job status to in_progress
    const { error: jobUpdateError } = await supabase
      .from('jobs')
      .update({ status: 'in_progress' })
      .eq('id', bid.job_id);

    if (jobUpdateError) {
      console.error('Error updating job:', jobUpdateError);
    }

    // Reject all other bids for this job
    await supabase
      .from('bids')
      .update({ status: 'rejected' })
      .eq('job_id', bid.job_id)
      .neq('id', bid_id)
      .eq('status', 'pending');

    // Create escrow transaction
    const { data: escrow, error: escrowError } = await supabase
      .from('escrow_transactions')
      .insert({
        job_id: bid.job_id,
        client_id: user.id,
        freelancer_id: bid.freelancer_id,
        amount: bid.bid_amount,
        status: 'held'
      })
      .select()
      .single();

    if (escrowError) {
      console.error('Error creating escrow:', escrowError);
    }

    // Notify freelancer
    await supabase
      .from('notifications')
      .insert({
        user_id: bid.freelancer_id,
        type: 'bid_accepted',
        title: 'Your Bid Was Accepted!',
        message: `Your bid on "${bid.jobs.title}" has been accepted. The job is now in progress.`,
        metadata: { job_id: bid.job_id, bid_id: bid.id }
      });

    return new Response(
      JSON.stringify({ 
        success: true,
        message: 'Bid accepted and job moved to in progress',
        escrow_id: escrow?.id
      }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error in accept-bid function:', error);
    return new Response(
      JSON.stringify({ error: 'Internal server error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
