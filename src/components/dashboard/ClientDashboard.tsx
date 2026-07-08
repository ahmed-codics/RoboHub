import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card } from "@/components/ui/card";
import { Briefcase, CheckCircle, Clock, DollarSign, Plus } from "lucide-react";
import JobsList from "./JobsList";
import CreateJobDialog from "./CreateJobDialog";
import ClientJobsSection from "./ClientJobsSection";
import PaymentStatusCard from "./PaymentStatusCard";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";

interface ClientDashboardProps {
  userId: string;
}

const StatCard = ({ title, value, subtext, icon: Icon, colorClass }: any) => (
  <div className="bg-white border border-slate-200 shadow-sm p-6 rounded-[2rem] relative overflow-hidden group hover:-translate-y-1 hover:shadow-xl transition-all duration-300">
    <div className={cn("absolute top-0 right-0 p-4 opacity-5 group-hover:opacity-10 transition-opacity", colorClass)}>
      <Icon className="h-24 w-24" />
    </div>
    <div className="relative z-10">
      <div className={cn("h-12 w-12 rounded-xl flex items-center justify-center mb-4", colorClass)}>
        <Icon className="h-6 w-6" />
      </div>
      <p className="text-sm font-bold text-slate-500">{title}</p>
      <h3 className="text-3xl font-extrabold text-slate-900 mt-1">{value}</h3>
      <div className="mt-4 flex items-center gap-3">
        <div className="flex-1 h-1.5 bg-slate-100 rounded-full overflow-hidden">
            <div className="h-full bg-slate-800 rounded-full" style={{ width: `${Math.floor(Math.random() * 40) + 40}%`, transition: 'width 1s ease-out' }} />
        </div>
        <p className="text-xs text-slate-400 font-medium whitespace-nowrap">{subtext}</p>
      </div>
    </div>
  </div>
);

const ClientDashboard = ({ userId }: ClientDashboardProps) => {
  const [profile, setProfile] = useState<any>(null);
  const [stats, setStats] = useState({
    totalJobs: 0,
    activeJobs: 0,
    completedJobs: 0,
    totalSpent: 0,
  });

  useEffect(() => {
    loadProfile();
    loadStats();
  }, [userId]);

  const loadProfile = async () => {
    const { data } = await supabase.from("profiles").select("*").eq("id", userId).single();
    setProfile(data);
  };

  const loadStats = async () => {
    const { data: jobsData } = await supabase.from("jobs").select("id, status, budget").eq("client_id", userId);
    const totalJobs = jobsData?.length || 0;
    const activeJobs = jobsData?.filter((job) => job.status === "in_progress").length || 0;
    const completedJobs = jobsData?.filter((job) => job.status === "completed").length || 0;
    const totalSpent = jobsData
      ?.filter((job) => job.status === "completed")
      .reduce((sum, job) => sum + parseFloat(job.budget.toString()), 0) || 0;

    setStats({ totalJobs, activeJobs, completedJobs, totalSpent });
  };

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-extrabold text-slate-900">Project Overview</h2>
        <CreateJobDialog userId={userId} onJobCreated={loadStats} />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard
          title="Total Projects"
          value={stats.totalJobs}
          subtext="Lifetime Posted"
          icon={Briefcase}
          colorClass="text-blue-400 bg-blue-500/20"
        />
        <StatCard
          title="Active Projects"
          value={stats.activeJobs}
          subtext="Currently running"
          icon={Clock}
          colorClass="text-orange-400 bg-orange-500/20"
        />
        <StatCard
          title="Completed"
          value={stats.completedJobs}
          subtext="Successful delivery"
          icon={CheckCircle}
          colorClass="text-green-400 bg-green-500/20"
        />
        <StatCard
          title="Total Spent"
          value={`$${stats.totalSpent.toLocaleString()}`}
          subtext="Investment in talent"
          icon={DollarSign}
          colorClass="text-purple-400 bg-purple-500/20"
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-8">
          <div className="bg-white border border-slate-200 shadow-sm rounded-[2rem] p-6">
            <h3 className="text-xl font-bold text-slate-900 mb-6">Recent Projects</h3>
            <ClientJobsSection userId={userId} />
          </div>
        </div>
        <div className="space-y-8">
          <PaymentStatusCard userId={userId} />
        </div>
      </div>
    </div>
  );
};

export default ClientDashboard;
