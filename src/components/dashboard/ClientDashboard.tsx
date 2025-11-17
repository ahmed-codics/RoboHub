import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Briefcase, CheckCircle, Clock, DollarSign } from "lucide-react";
import JobsList from "./JobsList";
import CreateJobDialog from "./CreateJobDialog";
import ClientJobsSection from "./ClientJobsSection";

interface ClientDashboardProps {
  userId: string;
}

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
    const { data, error } = await supabase
      .from("profiles")
      .select("*")
      .eq("id", userId)
      .single();

    if (error) {
      console.error("Error loading profile:", error);
      return;
    }

    setProfile(data);
  };

  const loadStats = async () => {
    // Get all jobs
    const { data: jobsData, error: jobsError } = await supabase
      .from("jobs")
      .select("id, status, budget")
      .eq("client_id", userId);

    if (jobsError) {
      console.error("Error loading jobs:", jobsError);
      return;
    }

    const totalJobs = jobsData?.length || 0;
    const activeJobs = jobsData?.filter((job) => job.status === "in_progress").length || 0;
    const completedJobs = jobsData?.filter((job) => job.status === "completed").length || 0;
    const totalSpent = jobsData
      ?.filter((job) => job.status === "completed")
      .reduce((sum, job) => sum + parseFloat(job.budget.toString()), 0) || 0;

    setStats({
      totalJobs,
      activeJobs,
      completedJobs,
      totalSpent,
    });
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Client Dashboard</h1>
          <p className="text-muted-foreground">Welcome back, {profile?.name || "Client"}!</p>
        </div>
        <CreateJobDialog userId={userId} onJobCreated={loadStats} />
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Jobs</CardTitle>
            <Briefcase className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalJobs}</div>
            <p className="text-xs text-muted-foreground">
              All time
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Jobs</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.activeJobs}</div>
            <p className="text-xs text-muted-foreground">
              In progress
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Completed</CardTitle>
            <CheckCircle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.completedJobs}</div>
            <p className="text-xs text-muted-foreground">
              Successfully finished
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Spent</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">${stats.totalSpent.toFixed(2)}</div>
            <p className="text-xs text-muted-foreground">
              On completed projects
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Main Content */}
      <div className="space-y-6">
        <ClientJobsSection userId={userId} />
      </div>
    </div>
  );
};

export default ClientDashboard;
