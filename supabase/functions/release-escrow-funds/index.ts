import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.81.1';

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
      console.error('[release-escrow-funds] No authorization header');
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
      console.error('[release-escrow-funds] Auth error:', authError);
      return new Response(
        JSON.stringify({ error: 'Unauthorized' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log('[release-escrow-funds] Request from user:', user.id);

    // Parse request body
    const { job_id, action } = await req.json();

    if (!job_id || !action) {
      console.error('[release-escrow-funds] Missing job_id or action');
      return new Response(
        JSON.stringify({ error: 'job_id and action are required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log('[release-escrow-funds] Action:', action, 'Job ID:', job_id);

    // Get escrow transaction
    const { data: escrow, error: escrowError } = await supabase
      .from('escrow_transactions')
      .select('*')
      .eq('job_id', job_id)
      .single();

    if (escrowError || !escrow) {
      console.error('[release-escrow-funds] Escrow not found:', escrowError);
      return new Response(
        JSON.stringify({ error: 'Escrow transaction not found' }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log('[release-escrow-funds] Found escrow:', escrow.id, 'Status:', escrow.status);

    // Check if already released
    if (escrow.status === 'released') {
      console.log('[release-escrow-funds] Funds already released');
      return new Response(
        JSON.stringify({ error: 'Funds have already been released' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Handle different actions
    if (action === 'request_release') {
      // Freelancer requesting release
      if (user.id !== escrow.freelancer_id) {
        console.error('[release-escrow-funds] Unauthorized: User is not the freelancer');
        return new Response(
          JSON.stringify({ error: 'Only the freelancer can request release' }),
          { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      console.log('[release-escrow-funds] Freelancer requesting release');

      // Update escrow to mark release requested
      const { error: updateError } = await supabase
        .from('escrow_transactions')
        .update({
          release_requested: true,
          release_requested_at: new Date().toISOString()
        })
        .eq('id', escrow.id);

      if (updateError) {
        console.error('[release-escrow-funds] Failed to update escrow:', updateError);
        return new Response(
          JSON.stringify({ error: 'Failed to request release' }),
          { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      // Notify client
      const { error: notifError } = await supabase
        .from('notifications')
        .insert({
          user_id: escrow.client_id,
          type: 'release_requested',
          title: 'Payment Release Requested',
          message: 'The freelancer has requested payment release for a completed job.',
          metadata: { job_id }
        });

      if (notifError) {
        console.error('[release-escrow-funds] Failed to create notification:', notifError);
      }

      console.log('[release-escrow-funds] Release requested successfully');

      return new Response(
        JSON.stringify({ 
          success: true, 
          message: 'Release request sent to client' 
        }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );

    } else if (action === 'approve_release') {
      // Client or admin approving release
      const isClient = user.id === escrow.client_id;
      
      // Check if user is admin
      const { data: adminRole } = await supabase
        .from('user_roles')
        .select('role')
        .eq('user_id', user.id)
        .eq('role', 'admin')
        .single();

      const isAdmin = !!adminRole;

      if (!isClient && !isAdmin) {
        console.error('[release-escrow-funds] Unauthorized: Not client or admin');
        return new Response(
          JSON.stringify({ error: 'Only the client or admin can approve release' }),
          { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      console.log('[release-escrow-funds] Approving release by:', isAdmin ? 'Admin' : 'Client');

      // Update escrow to released
      const { error: updateError } = await supabase
        .from('escrow_transactions')
        .update({
          status: 'released',
          released_at: new Date().toISOString()
        })
        .eq('id', escrow.id);

      if (updateError) {
        console.error('[release-escrow-funds] Failed to release funds:', updateError);
        return new Response(
          JSON.stringify({ error: 'Failed to release funds' }),
          { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      // Update job status to completed
      const { error: jobUpdateError } = await supabase
        .from('jobs')
        .update({ status: 'completed' })
        .eq('id', job_id);

      if (jobUpdateError) {
        console.error('[release-escrow-funds] Failed to update job status:', jobUpdateError);
      }

      // Create payment record
      const serviceRoleSupabase = createClient(
        Deno.env.get('SUPABASE_URL') ?? '',
        Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
      );

      const { error: paymentError } = await serviceRoleSupabase
        .from('payments')
        .insert({
          user_id: escrow.freelancer_id,
          amount: escrow.amount,
          type: 'job_payment',
          status: 'completed',
          metadata: { 
            job_id,
            escrow_id: escrow.id,
            released_by: isAdmin ? 'admin' : 'client'
          }
        });

      if (paymentError) {
        console.error('[release-escrow-funds] Failed to create payment record:', paymentError);
      }

      // Notify freelancer
      const { error: notifError } = await supabase
        .from('notifications')
        .insert({
          user_id: escrow.freelancer_id,
          type: 'payment_released',
          title: 'Payment Released',
          message: `Payment has been released for the completed job. Amount: $${escrow.amount}`,
          metadata: { job_id }
        });

      if (notifError) {
        console.error('[release-escrow-funds] Failed to create notification:', notifError);
      }

      console.log('[release-escrow-funds] Funds released successfully');

      return new Response(
        JSON.stringify({ 
          success: true, 
          message: 'Funds released successfully',
          amount: escrow.amount
        }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );

    } else {
      console.error('[release-escrow-funds] Invalid action:', action);
      return new Response(
        JSON.stringify({ error: 'Invalid action. Use "request_release" or "approve_release"' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

  } catch (error) {
    console.error('[release-escrow-funds] Unexpected error:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return new Response(
      JSON.stringify({ error: 'Internal server error', details: errorMessage }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
