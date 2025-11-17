import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Briefcase, DollarSign } from "lucide-react";
import PlaceBidDialog from "./PlaceBidDialog";

interface Job {
  id: string;
  title: string;
  description: string;
  budget: number;
  required_skills: string[];
  status: string;
  created_at: string;
}

interface JobsListProps {
  userId: string;
  userRole: string;
  onBidPlaced?: () => void;
}

const JobsList = ({ userId, userRole, onBidPlaced }: JobsListProps) => {
  const [jobs, setJobs] = useState<Job[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadJobs();
  }, []);

  const loadJobs = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from("jobs")
      .select("*")
      .eq("status", "open")
      .order("created_at", { ascending: false })
      .limit(10);

    if (error) {
      console.error("Error loading jobs:", error);
    } else {
      setJobs(data || []);
    }
    setLoading(false);
  };

  if (loading) {
    return <Card><CardContent className="py-8 text-center">Loading jobs...</CardContent></Card>;
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Available Jobs</CardTitle>
        <CardDescription>Browse and bid on open robotics projects</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {jobs.length === 0 ? (
          <p className="text-center text-muted-foreground py-8">No jobs available</p>
        ) : (
          jobs.map((job) => (
            <div
              key={job.id}
              className="border border-border rounded-lg p-4 hover:border-primary/50 transition-colors"
            >
              <div className="flex items-start justify-between mb-2">
                <div className="flex-1">
                  <h3 className="font-semibold text-lg text-foreground">{job.title}</h3>
                  <p className="text-sm text-muted-foreground mt-1 line-clamp-2">
                    {job.description}
                  </p>
                </div>
                <div className="text-right ml-4">
                  <div className="flex items-center gap-1 text-primary font-semibold">
                    <DollarSign className="h-4 w-4" />
                    {job.budget.toLocaleString()}
                  </div>
                </div>
              </div>

              <div className="flex flex-wrap gap-2 mb-3">
                {job.required_skills.map((skill, index) => (
                  <Badge key={index} variant="secondary">
                    {skill}
                  </Badge>
                ))}
              </div>

              {userRole === "freelancer" && (
                <PlaceBidDialog jobId={job.id} userId={userId} onBidPlaced={() => {
                  loadJobs();
                  onBidPlaced?.();
                }} />
              )}
            </div>
          ))
        )}
      </CardContent>
    </Card>
  );
};

export default JobsList;
