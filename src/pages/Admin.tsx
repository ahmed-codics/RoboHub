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
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
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
  const [disputes, setDisputes] = useState<Record<string, unknown>[]>([]);

  const updateJobStatus = async (jobId: string, status: string) => {
    const { error } = await supabase.from("jobs").update({ status }).eq("id", jobId);
    if (error) { toast.error("Failed to update job"); return; }
    setJobs((prev) => prev.map((j) => (j.id === jobId ? { ...j, status } : j)));
    toast.success(`Job marked ${status}`);
  };

  const updateDisputeStatus = async (disputeId: string, status: string) => {
    let resolution: string | undefined;
    if (status === "resolved" || status === "rejected") {
      resolution = window.prompt("Resolution note (shown to the parties):") || undefined;
    }
    const { error } = await supabase
      .from("disputes")
      .update({ status, ...(resolution !== undefined ? { resolution } : {}), updated_at: new Date().toISOString() })
      .eq("id", disputeId);
    if (error) { toast.error("Failed to update dispute"); return; }
    setDisputes((prev) => prev.map((d) => (d.id === disputeId ? { ...d, status, resolution: resolution ?? d.resolution } : d)));
    toast.success(`Dispute marked ${status.replace("_", " ")}`);
  };

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

      const { data: disputesData } = await supabase
        .from("disputes")
        .select("*, jobs(title)")
        .order("created_at", { ascending: false })
        .limit(30);

      setUsers(usersData || []);
      setJobs(jobsData || []);
      setPayments(paymentsData || []);
      setDisputes(disputesData || []);
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
            <TabsTrigger value="disputes" className="rounded-sm data-[state=active]:bg-white data-[state=active]:text-teal-700 data-[state=active]:shadow-sm transition-all font-medium">Disputes</TabsTrigger>
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
                      <TableHead className="text-slate-500 text-right">Moderate</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {jobs.map((job) => (
                      <TableRow key={job.id} className="border-slate-100">
                        <TableCell className="font-medium text-slate-900">{job.title}</TableCell>
                        <TableCell className="text-slate-600">{job.profiles?.name}</TableCell>
                        <TableCell className="text-slate-600">${job.budget}</TableCell>
                        <TableCell className="capitalize text-slate-600">{job.status}</TableCell>
                        <TableCell className="text-right">
                          <Select value={job.status} onValueChange={(v) => updateJobStatus(job.id, v)}>
                            <SelectTrigger className="h-8 w-[140px] ml-auto border-slate-200 text-xs"><SelectValue /></SelectTrigger>
                            <SelectContent>
                              <SelectItem value="open">Open</SelectItem>
                              <SelectItem value="in_progress">In Progress</SelectItem>
                              <SelectItem value="completed">Completed</SelectItem>
                              <SelectItem value="cancelled">Cancelled (hide)</SelectItem>
                            </SelectContent>
                          </Select>
                        </TableCell>
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

          <TabsContent value="disputes">
            <Card className="border border-slate-200 shadow-sm bg-white">
              <CardHeader>
                <CardTitle className="text-lg font-bold text-slate-900">Dispute Cases</CardTitle>
              </CardHeader>
              <CardContent>
                {disputes.length === 0 ? (
                  <p className="text-sm text-slate-500">No disputes filed.</p>
                ) : (
                  <div className="space-y-4">
                    {disputes.map((d) => (
                      <div key={d.id} className="border border-slate-200 rounded-lg p-4">
                        <div className="flex items-start justify-between gap-4">
                          <div className="min-w-0">
                            <p className="font-semibold text-slate-900">{d.jobs?.title || "Job"}</p>
                            <p className="text-sm text-slate-600 mt-0.5">{d.reason}</p>
                            <p className="text-sm text-slate-500 mt-2 whitespace-pre-line">{d.description}</p>
                            {d.evidence_url && (
                              <a href={d.evidence_url} target="_blank" rel="noopener noreferrer" className="text-xs text-teal-600 hover:underline mt-1 inline-block">View evidence</a>
                            )}
                            {d.resolution && (
                              <p className="mt-2 text-sm text-green-700 bg-green-50 border border-green-100 rounded p-2">Resolution: {d.resolution}</p>
                            )}
                          </div>
                          <Badge className="capitalize border-0 bg-slate-100 text-slate-700 shrink-0">{String(d.status).replace("_", " ")}</Badge>
                        </div>
                        <div className="flex flex-wrap gap-2 mt-3">
                          <Button size="sm" variant="outline" className="h-8" onClick={() => updateDisputeStatus(d.id, "under_review")}>Review</Button>
                          <Button size="sm" className="h-8 bg-green-600 hover:bg-green-700" onClick={() => updateDisputeStatus(d.id, "resolved")}>Resolve</Button>
                          <Button size="sm" variant="outline" className="h-8 text-red-600 border-red-200 hover:bg-red-50" onClick={() => updateDisputeStatus(d.id, "rejected")}>Reject</Button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </DashboardShell>
  );
};

export default Admin;
