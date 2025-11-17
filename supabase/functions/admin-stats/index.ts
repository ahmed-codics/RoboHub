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

    // Check if user is admin
    const { data: roleData } = await supabase
      .from('user_roles')
      .select('role')
      .eq('user_id', user.id)
      .single();

    if (!roleData || roleData.role !== 'admin') {
      return new Response(
        JSON.stringify({ error: 'Admin access required' }),
        { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Get comprehensive stats
    const [
      { count: totalUsers },
      { count: totalJobs },
      { count: totalBids },
      { count: activeJobs },
      { count: completedJobs },
      { count: premiumUsers },
      { data: revenueData }
    ] = await Promise.all([
      supabase.from('profiles').select('*', { count: 'exact', head: true }),
      supabase.from('jobs').select('*', { count: 'exact', head: true }),
      supabase.from('bids').select('*', { count: 'exact', head: true }),
      supabase.from('jobs').select('*', { count: 'exact', head: true }).eq('status', 'in_progress'),
      supabase.from('jobs').select('*', { count: 'exact', head: true }).eq('status', 'completed'),
      supabase.from('premium_plans').select('*', { count: 'exact', head: true }).eq('plan_type', 'premium'),
      supabase.from('payments').select('amount').eq('status', 'completed')
    ]);

    const totalRevenue = revenueData?.reduce((sum, payment) => sum + Number(payment.amount), 0) || 0;

    // Get recent activity
    const { data: recentJobs } = await supabase
      .from('jobs')
      .select('id, title, status, budget, created_at')
      .order('created_at', { ascending: false })
      .limit(10);

    const { data: recentBids } = await supabase
      .from('bids')
      .select('id, bid_amount, status, created_at, jobs(title)')
      .order('created_at', { ascending: false })
      .limit(10);

    const { data: recentUsers } = await supabase
      .from('profiles')
      .select('id, name, created_at')
      .order('created_at', { ascending: false })
      .limit(10);

    return new Response(
      JSON.stringify({
        stats: {
          total_users: totalUsers || 0,
          total_jobs: totalJobs || 0,
          total_bids: totalBids || 0,
          active_jobs: activeJobs || 0,
          completed_jobs: completedJobs || 0,
          premium_users: premiumUsers || 0,
          total_revenue: totalRevenue
        },
        recent_activity: {
          jobs: recentJobs,
          bids: recentBids,
          users: recentUsers
        }
      }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error in admin-stats function:', error);
    return new Response(
      JSON.stringify({ error: 'Internal server error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
