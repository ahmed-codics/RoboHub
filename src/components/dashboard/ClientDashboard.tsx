import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Briefcase, CheckCircle, Clock, DollarSign, Search, Sparkles, ArrowUpRight, Users } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import ClientJobsSection from "./ClientJobsSection";
import CreateJobDialog from "./CreateJobDialog";
import PaymentStatusCard from "./PaymentStatusCard";

interface ClientDashboardProps {
  userId: string;
}

const currency = (v: number) =>
  new Intl.NumberFormat(undefined, { style: "currency", currency: "USD", maximumFractionDigits: 0 }).format(v || 0);

const StatCard = ({ title, value, sub, icon: Icon, tone }: any) => (
  <div className="group relative overflow-hidden rounded-2xl border border-slate-200 bg-white p-5 shadow-sm transition-all duration-300 hover:-translate-y-0.5 hover:shadow-lg">
    <div className="flex items-start justify-between">
      <div className={cn("grid h-11 w-11 place-items-center rounded-xl", tone)}>
        <Icon className="h-5 w-5" />
      </div>
      <ArrowUpRight className="h-4 w-4 text-slate-300 transition-colors group-hover:text-teal-500" />
    </div>
    <p className="mt-4 text-sm font-medium text-slate-500">{title}</p>
    <p className="mt-0.5 text-2xl font-extrabold tracking-tight text-slate-900">{value}</p>
    {sub && <p className="mt-1 text-xs text-slate-400">{sub}</p>}
  </div>
);

const ClientDashboard = ({ userId }: ClientDashboardProps) => {
  const navigate = useNavigate();
  const [profile, setProfile] = useState<any>(null);
  const [stats, setStats] = useState({ totalJobs: 0, activeJobs: 0, completedJobs: 0, totalSpent: 0 });

  useEffect(() => {
    loadProfile();
    loadStats();
  }, [userId]);

  const loadProfile = async () => {
    const { data } = await supabase.from("profiles").select("*").eq("id", userId).maybeSingle();
    setProfile(data);
  };

  const loadStats = async () => {
    const { data: jobsData } = await supabase.from("jobs").select("id, status, budget").eq("client_id", userId);
    const totalJobs = jobsData?.length || 0;
    const activeJobs = jobsData?.filter((j) => j.status === "in_progress").length || 0;
    const completedJobs = jobsData?.filter((j) => j.status === "completed").length || 0;
    const totalSpent = jobsData?.filter((j) => j.status === "completed")
      .reduce((s, j) => s + parseFloat(j.budget.toString()), 0) || 0;
    setStats({ totalJobs, activeJobs, completedJobs, totalSpent });
  };

  const firstName = (profile?.name || "there").split(" ")[0];
  const hour = new Date().getHours();
  const greeting = hour < 12 ? "Good morning" : hour < 18 ? "Good afternoon" : "Good evening";

  return (
    <div className="space-y-6">
      {/* Welcome hero */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-slate-900 via-slate-800 to-teal-900 p-6 text-white shadow-lg sm:p-8">
        <div className="pointer-events-none absolute -right-16 -top-20 h-64 w-64 rounded-full bg-teal-400/20 blur-2xl" />
        <div className="pointer-events-none absolute -bottom-24 right-24 h-56 w-56 rounded-full bg-cyan-400/10 blur-3xl" />
        <div className="relative z-10 flex flex-col gap-6 md:flex-row md:items-center md:justify-between">
          <div>
            <p className="text-sm font-medium text-slate-300">{greeting},</p>
            <h2 className="text-2xl font-extrabold tracking-tight sm:text-3xl">{firstName} 👋</h2>
            <p className="mt-2 max-w-md text-sm text-slate-300">
              Manage your projects and find world-class robotics talent for your next build.
            </p>
            <div className="mt-5 flex flex-wrap gap-3">
              <CreateJobDialog userId={userId} onJobCreated={loadStats} />
              <Button onClick={() => navigate("/search")} variant="outline" className="border-white/30 bg-white/10 text-white hover:bg-white/20">
                <Search className="mr-2 h-4 w-4" /> Find Talent
              </Button>
            </div>
          </div>
          <div className="hidden shrink-0 rounded-2xl bg-white/10 p-5 text-center backdrop-blur-sm md:block">
            <p className="text-xs font-medium uppercase tracking-wider text-slate-300">Total invested</p>
            <p className="mt-1 text-3xl font-extrabold">{currency(stats.totalSpent)}</p>
            <p className="mt-1 text-xs text-slate-300">{stats.activeJobs} active project{stats.activeJobs === 1 ? "" : "s"}</p>
          </div>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard title="Total Projects" value={stats.totalJobs} sub="Lifetime posted" icon={Briefcase} tone="bg-blue-100 text-blue-600" />
        <StatCard title="Active Projects" value={stats.activeJobs} sub="Currently running" icon={Clock} tone="bg-amber-100 text-amber-600" />
        <StatCard title="Completed" value={stats.completedJobs} sub="Successful delivery" icon={CheckCircle} tone="bg-green-100 text-green-600" />
        <StatCard title="Total Spent" value={currency(stats.totalSpent)} sub="Investment in talent" icon={DollarSign} tone="bg-purple-100 text-purple-600" />
      </div>

      {/* Main grid */}
      <div className="grid grid-cols-1 gap-6 xl:grid-cols-3">
        <div className="space-y-6 xl:col-span-2">
          <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
            <div className="mb-4 flex items-center justify-between">
              <h3 className="text-lg font-bold text-slate-900">Your projects</h3>
              <CreateJobDialog userId={userId} onJobCreated={loadStats} />
            </div>
            <ClientJobsSection userId={userId} />
          </div>
        </div>

        <div className="space-y-6">
          <PaymentStatusCard userId={userId} />

          {/* Find talent CTA */}
          <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
            <div className="flex items-center gap-2">
              <Sparkles className="h-5 w-5 text-teal-600" />
              <h3 className="font-bold text-slate-900">Find the right engineer</h3>
            </div>
            <p className="mt-2 text-sm text-slate-500">
              Browse specialised robotics talent or ready-made services to get started fast.
            </p>
            <div className="mt-4 space-y-2">
              <Button onClick={() => navigate("/search")} variant="outline" className="w-full justify-start border-slate-200">
                <Users className="mr-2 h-4 w-4 text-slate-500" /> Browse Talent
              </Button>
              <Button onClick={() => navigate("/services")} variant="outline" className="w-full justify-start border-slate-200">
                <Sparkles className="mr-2 h-4 w-4 text-slate-500" /> Browse Services
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ClientDashboard;
