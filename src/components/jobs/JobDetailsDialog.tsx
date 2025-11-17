import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Eye, Briefcase, DollarSign, Calendar, User } from "lucide-react";
import MessageDialog from "@/components/messaging/MessageDialog";
import EscrowManager from "@/components/escrow/EscrowManager";
import PlaceBidDialog from "@/components/dashboard/PlaceBidDialog";

interface JobDetailsDialogProps {
  jobId: string;
  userRole: string;
  userId: string;
}

interface Job {
  id: string;
  title: string;
  description: string;
  budget: number;
  required_skills: string[];
  status: string;
  created_at: string;
  client_id: string;
}

interface AcceptedBid {
  id: string;
  freelancer_id: string;
  bid_amount: number;
  profiles: {
    name: string;
  };
}

const JobDetailsDialog = ({ jobId, userRole, userId }: JobDetailsDialogProps) => {
  const [open, setOpen] = useState(false);
  const [job, setJob] = useState<Job | null>(null);
  const [acceptedBid, setAcceptedBid] = useState<AcceptedBid | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (open) {
      loadJobDetails();
    }
  }, [open, jobId]);

  const loadJobDetails = async () => {
    setLoading(true);
    
    // Load job details
    const { data: jobData, error: jobError } = await supabase
      .from("jobs")
      .select("*")
      .eq("id", jobId)
      .single();

    if (jobError) {
      console.error("Error loading job:", jobError);
      setLoading(false);
      return;
    }

    setJob(jobData);

    // If job is in progress, load accepted bid
    if (jobData.status === "in_progress" || jobData.status === "completed") {
      const { data: bidData } = await supabase
        .from("bids")
        .select("id, freelancer_id, bid_amount")
        .eq("job_id", jobId)
        .eq("status", "accepted")
        .single();

      if (bidData) {
        // Load freelancer profile
        const { data: profileData } = await supabase
          .from("profiles")
          .select("name")
          .eq("id", bidData.freelancer_id)
          .single();

        setAcceptedBid({
          ...bidData,
          profiles: profileData || { name: "Unknown" }
        });
      }
    }

    setLoading(false);
  };

  const isClient = userRole === "client";
  const isFreelancer = userRole === "freelancer";
  const isOwnJob = job?.client_id === userId;
  const isAssignedFreelancer = acceptedBid?.freelancer_id === userId;

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button size="sm" variant="outline">
          <Eye className="h-4 w-4 mr-2" />
          View Details
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-4xl max-h-[90vh]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Briefcase className="h-5 w-5" />
            Job Details
          </DialogTitle>
          <DialogDescription>
            Complete information about this job posting
          </DialogDescription>
        </DialogHeader>

        {loading ? (
          <p className="text-center text-muted-foreground py-8">Loading...</p>
        ) : !job ? (
          <p className="text-center text-muted-foreground py-8">Job not found</p>
        ) : (
          <ScrollArea className="max-h-[70vh] pr-4">
            <div className="space-y-6">
              {/* Job Header */}
              <Card>
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <CardTitle className="text-2xl mb-2">{job.title}</CardTitle>
                      <div className="flex items-center gap-4 text-sm text-muted-foreground">
                        <div className="flex items-center gap-1">
                          <Calendar className="h-4 w-4" />
                          Posted {new Date(job.created_at).toLocaleDateString()}
                        </div>
                        <div className="flex items-center gap-1">
                          <DollarSign className="h-4 w-4" />
                          Budget: ${job.budget.toLocaleString()}
                        </div>
                      </div>
                    </div>
                    <Badge variant={
                      job.status === "open" ? "default" :
                      job.status === "in_progress" ? "secondary" :
                      job.status === "completed" ? "outline" : "destructive"
                    }>
                      {job.status}
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div>
                      <h3 className="font-semibold mb-2">Description</h3>
                      <p className="text-muted-foreground whitespace-pre-wrap">{job.description}</p>
                    </div>

                    <div>
                      <h3 className="font-semibold mb-2">Required Skills</h3>
                      <div className="flex flex-wrap gap-2">
                        {job.required_skills.map((skill, index) => (
                          <Badge key={index} variant="secondary">
                            {skill}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Accepted Freelancer Info */}
              {acceptedBid && (
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg flex items-center gap-2">
                      <User className="h-5 w-5" />
                      Assigned Freelancer
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="font-medium">{acceptedBid.profiles.name}</p>
                        <p className="text-sm text-muted-foreground">
                          Bid Amount: ${acceptedBid.bid_amount.toLocaleString()}
                        </p>
                      </div>
                      {(isOwnJob || isAssignedFreelancer) && (
                        <MessageDialog
                          jobId={jobId}
                          freelancerId={acceptedBid.freelancer_id}
                          freelancerName={acceptedBid.profiles.name}
                        />
                      )}
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Escrow Manager */}
              {(job.status === "in_progress" || job.status === "completed") && (isOwnJob || isAssignedFreelancer) && (
                <EscrowManager 
                  jobId={jobId} 
                  isClient={isOwnJob}
                  isFreelancer={isAssignedFreelancer}
                />
              )}

              {/* Actions */}
              {job.status === "open" && !isOwnJob && isFreelancer && (
                <div className="flex justify-end">
                  <PlaceBidDialog 
                    jobId={jobId} 
                    userId={userId}
                    onBidPlaced={loadJobDetails}
                  />
                </div>
              )}
            </div>
          </ScrollArea>
        )}
      </DialogContent>
    </Dialog>
  );
};

export default JobDetailsDialog;
