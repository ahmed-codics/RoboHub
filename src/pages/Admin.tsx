import { useEffect, useState, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Cpu, Users, Briefcase, DollarSign, TrendingUp } from "lucide-react";
import { toast } from "sonner";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import DashboardShell from "@/components/layout/DashboardShell";

const Admin = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    totalUsers: 0,
    totalJobs: 0,
    totalBids: 0,
    totalRevenue: 0,
    activeJobs: 0,
    premiumUsers: 0,
  });
  const [users, setUsers] = useState<Record<string, unknown>[]>([]);
  const [jobs, setJobs] = useState<Record<string, unknown>[]>([]);
  const [payments, setPayments] = useState<Record<string, unknown>[]>([]);

  const { user, loading: authLoading, signOut } = useAuth();

  const checkAdminAccess = useCallback(async () => {
    if (!user) {
      setLoading(false);
      navigate("/auth");
      return;
    }

    try {
      const { data: roleData, error } = await supabase
        .from("user_roles")
        .select("role")
        .eq("user_id", user.id)
        .maybeSingle();

      if (error || roleData?.role !== "admin") {
        toast.error("Access denied. Admin privileges required.");
        setLoading(false);
        navigate("/dashboard");
        return;
      }

      await loadDashboardData();
    } catch (error) {
      toast.error("Access denied");
      setLoading(false);
      navigate("/dashboard");
    }
  }, [user, navigate]);

  useEffect(() => {
    if (authLoading) return;
    checkAdminAccess();
  }, [authLoading, checkAdminAccess]);

  const loadDashboardData = async () => {
    try {
      // Load stats
      const [usersRes, jobsRes, bidsRes, paymentsRes, premiumRes] = await Promise.all([
        supabase.from("profiles").select("*", { count: "exact", head: true }),
        supabase.from("jobs").select("*", { count: "exact", head: true }),
        supabase.from("bids").select("*", { count: "exact", head: true }),
        supabase.from("payments").select("amount"),
        supabase.from("premium_plans").select("*", { count: "exact", head: true }),
      ]);

      const { count: activeJobsCount } = await supabase
        .from("jobs")
        .select("*", { count: "exact", head: true })
        .eq("status", "open");

      const totalRevenue = paymentsRes.data?.reduce((sum, p) => sum + Number(p.amount), 0) || 0;

      setStats({
        totalUsers: usersRes.count || 0,
        totalJobs: jobsRes.count || 0,
        totalBids: bidsRes.count || 0,
        totalRevenue,
        activeJobs: activeJobsCount || 0,
        premiumUsers: premiumRes.count || 0,
      });

      // Load detailed data
      const { data: usersData } = await supabase
        .from("profiles")
        .select("*, user_roles(*)")
        .order("created_at", { ascending: false })
        .limit(20);

      const { data: jobsData } = await supabase
        .from("jobs")
        .select("*, profiles(name)")
        .order("created_at", { ascending: false })
        .limit(20);

      const { data: paymentsData } = await supabase
        .from("payments")
        .select("*, profiles(name)")
        .order("created_at", { ascending: false })
        .limit(20);

      setUsers(usersData || []);
      setJobs(jobsData || []);
      setPayments(paymentsData || []);
    } catch (error) {
      console.error("Error loading dashboard data:", error);
    } finally {
      setLoading(false);
    }
  };

  if (loading || authLoading) {
    return (
      <DashboardShell userRole="admin" onRoleChange={checkAdminAccess}>
        <div className="flex items-center justify-center py-20">
          <div className="animate-spin">
            <Cpu className="h-8 w-8 text-teal-600" />
          </div>
        </div>
      </DashboardShell>
    );
  }

  return (
    <DashboardShell userRole="admin" onRoleChange={checkAdminAccess}>
      <div className="space-y-8 animate-fade-in-up">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-slate-900 tracking-tight">Admin Dashboard</h1>
            <p className="text-slate-600 mt-1">Platform overview and management.</p>
          </div>
        </div>

        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4 mb-8">
          <Card className="border border-slate-200 shadow-sm bg-white">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-slate-500">Total Users</CardTitle>
              <Users className="h-4 w-4 text-slate-400" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-slate-900">{stats.totalUsers}</div>
              <p className="text-xs text-slate-500 mt-1">
                {stats.premiumUsers} premium users
              </p>
            </CardContent>
          </Card>

          <Card className="border border-slate-200 shadow-sm bg-white">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-slate-500">Total Jobs</CardTitle>
              <Briefcase className="h-4 w-4 text-slate-400" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-slate-900">{stats.totalJobs}</div>
              <p className="text-xs text-slate-500 mt-1">
                {stats.activeJobs} active jobs
              </p>
            </CardContent>
          </Card>

          <Card className="border border-slate-200 shadow-sm bg-white">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-slate-500">Total Bids</CardTitle>
              <TrendingUp className="h-4 w-4 text-slate-400" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-slate-900">{stats.totalBids}</div>
              <p className="text-xs text-slate-500 mt-1">Across all jobs</p>
            </CardContent>
          </Card>

          <Card className="border border-slate-200 shadow-sm bg-white">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-slate-500">Revenue</CardTitle>
              <DollarSign className="h-4 w-4 text-slate-400" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-teal-600">${stats.totalRevenue.toFixed(2)}</div>
              <p className="text-xs text-slate-500 mt-1">Total volume processed</p>
            </CardContent>
          </Card>
        </div>

        <Tabs defaultValue="users" className="space-y-6">
          <TabsList className="bg-slate-100 p-1 rounded-md">
            <TabsTrigger value="users" className="rounded-sm data-[state=active]:bg-white data-[state=active]:text-teal-700 data-[state=active]:shadow-sm transition-all font-medium">Users</TabsTrigger>
            <TabsTrigger value="jobs" className="rounded-sm data-[state=active]:bg-white data-[state=active]:text-teal-700 data-[state=active]:shadow-sm transition-all font-medium">Jobs</TabsTrigger>
            <TabsTrigger value="payments" className="rounded-sm data-[state=active]:bg-white data-[state=active]:text-teal-700 data-[state=active]:shadow-sm transition-all font-medium">Payments</TabsTrigger>
          </TabsList>

          <TabsContent value="users">
            <Card className="border border-slate-200 shadow-sm bg-white">
              <CardHeader>
                <CardTitle className="text-lg font-bold text-slate-900">Recent Users</CardTitle>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow className="border-slate-100">
                      <TableHead className="text-slate-500">Name</TableHead>
                      <TableHead className="text-slate-500">Role</TableHead>
                      <TableHead className="text-slate-500">Joined</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {users.map((user) => (
                      <TableRow key={user.id} className="border-slate-100">
                        <TableCell className="font-medium text-slate-900">{user.name}</TableCell>
                        <TableCell className="capitalize text-slate-600">
                          {user.user_roles?.[0]?.role || "N/A"}
                        </TableCell>
                        <TableCell className="text-slate-600">
                          {new Date(user.created_at).toLocaleDateString()}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="jobs">
            <Card className="border border-slate-200 shadow-sm bg-white">
              <CardHeader>
                <CardTitle className="text-lg font-bold text-slate-900">Recent Jobs</CardTitle>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow className="border-slate-100">
                      <TableHead className="text-slate-500">Title</TableHead>
                      <TableHead className="text-slate-500">Client</TableHead>
                      <TableHead className="text-slate-500">Budget</TableHead>
                      <TableHead className="text-slate-500">Status</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {jobs.map((job) => (
                      <TableRow key={job.id} className="border-slate-100">
                        <TableCell className="font-medium text-slate-900">{job.title}</TableCell>
                        <TableCell className="text-slate-600">{job.profiles?.name}</TableCell>
                        <TableCell className="text-slate-600">${job.budget}</TableCell>
                        <TableCell className="capitalize text-slate-600">{job.status}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="payments">
            <Card className="border border-slate-200 shadow-sm bg-white">
              <CardHeader>
                <CardTitle className="text-lg font-bold text-slate-900">Recent Payments</CardTitle>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow className="border-slate-100">
                      <TableHead className="text-slate-500">User</TableHead>
                      <TableHead className="text-slate-500">Amount</TableHead>
                      <TableHead className="text-slate-500">Type</TableHead>
                      <TableHead className="text-slate-500">Status</TableHead>
                      <TableHead className="text-slate-500">Date</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {payments.map((payment) => (
                      <TableRow key={payment.id} className="border-slate-100">
                        <TableCell className="font-medium text-slate-900">{payment.profiles?.name}</TableCell>
                        <TableCell className="text-teal-600 font-medium">${payment.amount}</TableCell>
                        <TableCell className="capitalize text-slate-600">
                          {payment.type.replace("_", " ")}
                        </TableCell>
                        <TableCell className="capitalize text-slate-600">{payment.status}</TableCell>
                        <TableCell className="text-slate-600">
                          {new Date(payment.created_at).toLocaleDateString()}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </DashboardShell>
  );
};

export default Admin;
