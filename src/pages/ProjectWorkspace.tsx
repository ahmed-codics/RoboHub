import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import {
  Loader2,
  Plus,
  Trash2,
  CheckCircle,
  DollarSign,
  Calendar,
  MessageSquare,
  Flag,
  Star,
  ArrowLeft,
} from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useUserRole } from "@/hooks/useUserRole";
import DashboardShell from "@/components/layout/DashboardShell";
import EscrowManager from "@/components/escrow/EscrowManager";
import FileDisputeDialog from "@/components/disputes/FileDisputeDialog";
import ReviewDialog from "@/components/reviews/ReviewDialog";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Progress } from "@/components/ui/progress";
import { Separator } from "@/components/ui/separator";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogTrigger,
  DialogFooter,
} from "@/components/ui/dialog";

interface Job {
  id: string;
  title: string;
  description: string | null;
  budget: number | null;
  status: "open" | "in_progress" | "completed" | "cancelled";
  client_id: string;
  created_at: string;
}

interface AcceptedBid {
  id: string;
  job_id: string;
  freelancer_id: string;
  bid_amount: number;
  status: string;
}

interface Milestone {
  id: string;
  job_id: string;
  title: string;
  description: string | null;
  amount: number;
  due_date: string | null;
  status: "pending" | "submitted" | "approved" | "paid";
  sort_order: number;
  created_at: string;
  updated_at: string;
}

const currency = new Intl.NumberFormat("en-US", {
  style: "currency",
  currency: "USD",
  maximumFractionDigits: 0,
});

const formatMoney = (value: number | null | undefined) =>
  currency.format(Number(value ?? 0));

const jobStatusColors: Record<string, string> = {
  open: "bg-slate-100 text-slate-700 border-slate-200",
  in_progress: "bg-teal-100 text-teal-700 border-teal-200",
  completed: "bg-green-100 text-green-700 border-green-200",
  cancelled: "bg-red-100 text-red-700 border-red-200",
};

const milestoneStatusColors: Record<string, string> = {
  pending: "bg-slate-100 text-slate-600 border-slate-200",
  submitted: "bg-amber-100 text-amber-700 border-amber-200",
  approved: "bg-blue-100 text-blue-700 border-blue-200",
  paid: "bg-green-100 text-green-700 border-green-200",
};

const ProjectWorkspace = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user, loading: authLoading } = useAuth();
  const { userRole, refreshRole } = useUserRole();

  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);
  const [job, setJob] = useState<Job | null>(null);
  const [acceptedBid, setAcceptedBid] = useState<AcceptedBid | null>(null);
  const [milestones, setMilestones] = useState<Milestone[]>([]);

  const [isClient, setIsClient] = useState(false);
  const [isFreelancer, setIsFreelancer] = useState(false);
  const [names, setNames] = useState<{ client: string; freelancer: string }>({ client: "the client", freelancer: "the freelancer" });

  const [dialogOpen, setDialogOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({
    title: "",
    description: "",
    amount: "",
    due_date: "",
  });

  const fetchMilestones = async () => {
    if (!id) return;
    const { data, error } = await supabase
      .from("milestones")
      .select("*")
      .eq("job_id", id)
      .order("sort_order", { ascending: true });

    if (error) {
      console.error("Error loading milestones:", error);
      return;
    }
    setMilestones((data ?? []) as Milestone[]);
  };

  const loadWorkspace = async () => {
    if (!id || !user) return;
    setLoading(true);

    const { data: jobData, error: jobError } = await supabase
      .from("jobs")
      .select("*")
      .eq("id", id)
      .maybeSingle();

    if (jobError) {
      console.error("Error loading job:", jobError);
    }

    if (!jobData) {
      setNotFound(true);
      setLoading(false);
      return;
    }

    const typedJob = jobData as Job;
    setJob(typedJob);

    const { data: bidData } = await supabase
      .from("bids")
      .select("*")
      .eq("job_id", id)
      .eq("status", "accepted")
      .maybeSingle();

    const typedBid = (bidData as AcceptedBid | null) ?? null;
    setAcceptedBid(typedBid);

    const client = typedJob.client_id === user.id;
    const freelancer = !!typedBid && typedBid.freelancer_id === user.id;
    setIsClient(client);
    setIsFreelancer(freelancer);

    if (client || freelancer) {
      await fetchMilestones();
    }

    setLoading(false);
  };

  useEffect(() => {
    const ids = [job?.client_id, acceptedBid?.freelancer_id].filter(Boolean) as string[];
    if (ids.length === 0) return;
    supabase.from("profiles").select("id, name").in("id", ids).then(({ data }) => {
      if (!data) return;
      setNames({
        client: data.find((p) => p.id === job?.client_id)?.name || "the client",
        freelancer: data.find((p) => p.id === acceptedBid?.freelancer_id)?.name || "the freelancer",
      });
    });
  }, [job?.client_id, acceptedBid?.freelancer_id]);

  useEffect(() => {
    if (authLoading) return;
    if (!user) return;
    loadWorkspace();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id, user, authLoading]);

  if (!user) return null;

  if (loading) {
    return (
      <DashboardShell userRole={userRole} onRoleChange={refreshRole}>
        <div className="flex min-h-[60vh] items-center justify-center">
          <Loader2 className="h-10 w-10 animate-spin text-teal-600" />
        </div>
      </DashboardShell>
    );
  }

  if (notFound || !job) {
    return (
      <DashboardShell userRole={userRole} onRoleChange={refreshRole}>
        <div className="mx-auto max-w-md rounded-lg border border-slate-200 bg-white p-8 text-center shadow-sm">
          <h1 className="text-2xl font-bold text-slate-900">Project not found</h1>
          <p className="mt-2 text-slate-500">
            The project you are looking for does not exist or has been removed.
          </p>
          <Button
            onClick={() => navigate("/dashboard")}
            className="mt-6 bg-teal-600 hover:bg-teal-700"
          >
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Dashboard
          </Button>
        </div>
      </DashboardShell>
    );
  }

  if (!isClient && !isFreelancer) {
    return (
      <DashboardShell userRole={userRole} onRoleChange={refreshRole}>
        <div className="mx-auto max-w-md rounded-lg border border-slate-200 bg-white p-8 text-center shadow-sm">
          <h1 className="text-2xl font-bold text-slate-900">Access denied</h1>
          <p className="mt-2 text-slate-500">
            You don't have access to this project workspace.
          </p>
          <Button
            onClick={() => navigate("/dashboard")}
            className="mt-6 bg-teal-600 hover:bg-teal-700"
          >
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Dashboard
          </Button>
        </div>
      </DashboardShell>
    );
  }

  const completedCount = milestones.filter(
    (m) => m.status === "approved" || m.status === "paid"
  ).length;
  const progressValue =
    milestones.length > 0
      ? Math.round((completedCount / milestones.length) * 100)
      : 0;

  const resetForm = () =>
    setForm({ title: "", description: "", amount: "", due_date: "" });

  const handleAddMilestone = async () => {
    if (!id) return;
    if (!form.title.trim()) {
      toast.error("Title is required");
      return;
    }
    setSaving(true);
    try {
      const { error } = await supabase.from("milestones").insert({
        job_id: id,
        title: form.title.trim(),
        description: form.description.trim() || null,
        amount: form.amount ? Number(form.amount) : 0,
        due_date: form.due_date || null,
        sort_order: milestones.length,
        status: "pending",
      });
      if (error) throw error;
      toast.success("Milestone added");
      resetForm();
      setDialogOpen(false);
      await fetchMilestones();
    } catch (err: any) {
      toast.error(err.message || "Failed to add milestone");
    } finally {
      setSaving(false);
    }
  };

  const updateMilestoneStatus = async (
    milestoneId: string,
    status: Milestone["status"]
  ) => {
    try {
      const { error } = await supabase
        .from("milestones")
        .update({ status })
        .eq("id", milestoneId);
      if (error) throw error;
      toast.success("Milestone updated");
      await fetchMilestones();
    } catch (err: any) {
      toast.error(err.message || "Failed to update milestone");
    }
  };

  const deleteMilestone = async (milestoneId: string) => {
    try {
      const { error } = await supabase
        .from("milestones")
        .delete()
        .eq("id", milestoneId);
      if (error) throw error;
      toast.success("Milestone deleted");
      await fetchMilestones();
    } catch (err: any) {
      toast.error(err.message || "Failed to delete milestone");
    }
  };

  const handleMarkComplete = async () => {
    if (!id) return;
    try {
      const { error } = await supabase
        .from("jobs")
        .update({ status: "completed" })
        .eq("id", id);
      if (error) throw error;
      toast.success("Project marked as complete");
      await loadWorkspace();
    } catch (err: any) {
      toast.error(err.message || "Failed to mark project complete");
    }
  };

  return (
    <DashboardShell userRole={userRole} onRoleChange={refreshRole}>
      <div className="space-y-8">
        {/* Header */}
        <div className="rounded-lg border border-slate-200 bg-white p-6 shadow-sm">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div>
              <div className="flex items-center gap-3">
                <h1 className="text-2xl font-bold text-slate-900">
                  {job.title}
                </h1>
                <Badge
                  variant="outline"
                  className={`capitalize ${jobStatusColors[job.status] ?? ""}`}
                >
                  {job.status.replace("_", " ")}
                </Badge>
              </div>
              {job.description && (
                <p className="mt-2 max-w-2xl text-sm text-slate-500">
                  {job.description}
                </p>
              )}
            </div>
            <div className="text-right">
              <p className="text-xs uppercase tracking-wide text-slate-500">
                Budget
              </p>
              <p className="text-2xl font-bold text-teal-600">
                {formatMoney(job.budget)}
              </p>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 gap-8 lg:grid-cols-3">
          {/* Main column: Milestones */}
          <div className="space-y-6 lg:col-span-2">
            <Card className="border-slate-200 shadow-sm">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="text-slate-900">Milestones</CardTitle>
                  {isClient && (
                    <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
                      <DialogTrigger asChild>
                        <Button className="bg-teal-600 hover:bg-teal-700">
                          <Plus className="mr-2 h-4 w-4" />
                          Add Milestone
                        </Button>
                      </DialogTrigger>
                      <DialogContent>
                        <DialogHeader>
                          <DialogTitle>Add Milestone</DialogTitle>
                          <DialogDescription>
                            Break the project into deliverables with amounts and
                            due dates.
                          </DialogDescription>
                        </DialogHeader>
                        <div className="space-y-4 py-2">
                          <div className="space-y-2">
                            <Label htmlFor="ms-title">Title</Label>
                            <Input
                              id="ms-title"
                              value={form.title}
                              onChange={(e) =>
                                setForm({ ...form, title: e.target.value })
                              }
                              placeholder="e.g. Prototype delivery"
                            />
                          </div>
                          <div className="space-y-2">
                            <Label htmlFor="ms-desc">Description</Label>
                            <Textarea
                              id="ms-desc"
                              value={form.description}
                              onChange={(e) =>
                                setForm({
                                  ...form,
                                  description: e.target.value,
                                })
                              }
                              placeholder="What needs to be delivered?"
                            />
                          </div>
                          <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                              <Label htmlFor="ms-amount">Amount ($)</Label>
                              <Input
                                id="ms-amount"
                                type="number"
                                min="0"
                                value={form.amount}
                                onChange={(e) =>
                                  setForm({ ...form, amount: e.target.value })
                                }
                                placeholder="0"
                              />
                            </div>
                            <div className="space-y-2">
                              <Label htmlFor="ms-due">Due date</Label>
                              <Input
                                id="ms-due"
                                type="date"
                                value={form.due_date}
                                onChange={(e) =>
                                  setForm({ ...form, due_date: e.target.value })
                                }
                              />
                            </div>
                          </div>
                        </div>
                        <DialogFooter>
                          <Button
                            variant="outline"
                            onClick={() => setDialogOpen(false)}
                            disabled={saving}
                          >
                            Cancel
                          </Button>
                          <Button
                            onClick={handleAddMilestone}
                            disabled={saving}
                            className="bg-teal-600 hover:bg-teal-700"
                          >
                            {saving ? "Saving..." : "Add Milestone"}
                          </Button>
                        </DialogFooter>
                      </DialogContent>
                    </Dialog>
                  )}
                </div>
              </CardHeader>
              <CardContent className="space-y-6">
                {milestones.length > 0 && (
                  <div className="space-y-2">
                    <div className="flex items-center justify-between text-sm text-slate-500">
                      <span>Progress</span>
                      <span>
                        {completedCount} of {milestones.length} completed
                      </span>
                    </div>
                    <Progress value={progressValue} />
                  </div>
                )}

                {milestones.length === 0 ? (
                  <div className="rounded-lg border border-dashed border-slate-200 py-10 text-center">
                    <Flag className="mx-auto h-8 w-8 text-slate-300" />
                    <p className="mt-3 text-sm text-slate-500">
                      {isClient
                        ? "Add the first milestone to structure this project"
                        : "No milestones yet"}
                    </p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {milestones.map((m) => (
                      <div
                        key={m.id}
                        className="rounded-lg border border-slate-200 p-4"
                      >
                        <div className="flex items-start justify-between gap-3">
                          <div className="min-w-0">
                            <div className="flex items-center gap-2">
                              <h3 className="font-semibold text-slate-900">
                                {m.title}
                              </h3>
                              <Badge
                                variant="outline"
                                className={`capitalize ${
                                  milestoneStatusColors[m.status] ?? ""
                                }`}
                              >
                                {m.status}
                              </Badge>
                            </div>
                            {m.description && (
                              <p className="mt-1 text-sm text-slate-500">
                                {m.description}
                              </p>
                            )}
                            <div className="mt-2 flex flex-wrap items-center gap-4 text-sm text-slate-600">
                              <span className="inline-flex items-center gap-1">
                                <DollarSign className="h-4 w-4 text-slate-400" />
                                {formatMoney(m.amount)}
                              </span>
                              {m.due_date && (
                                <span className="inline-flex items-center gap-1">
                                  <Calendar className="h-4 w-4 text-slate-400" />
                                  {new Date(m.due_date).toLocaleDateString()}
                                </span>
                              )}
                            </div>
                          </div>
                          {isClient && (
                            <Button
                              variant="ghost"
                              size="icon"
                              className="text-slate-400 hover:text-red-600"
                              onClick={() => deleteMilestone(m.id)}
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          )}
                        </div>

                        <div className="mt-3 flex flex-wrap gap-2">
                          {isFreelancer && m.status === "pending" && (
                            <Button
                              size="sm"
                              className="bg-teal-600 hover:bg-teal-700"
                              onClick={() =>
                                updateMilestoneStatus(m.id, "submitted")
                              }
                            >
                              Submit Work
                            </Button>
                          )}
                          {isClient && m.status === "submitted" && (
                            <Button
                              size="sm"
                              className="bg-teal-600 hover:bg-teal-700"
                              onClick={() =>
                                updateMilestoneStatus(m.id, "approved")
                              }
                            >
                              <CheckCircle className="mr-1 h-4 w-4" />
                              Approve
                            </Button>
                          )}
                          {isClient && m.status === "approved" && (
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() =>
                                updateMilestoneStatus(m.id, "paid")
                              }
                            >
                              Mark Paid
                            </Button>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            <EscrowManager
              jobId={id!}
              isClient={isClient}
              isFreelancer={isFreelancer}
            />

            <Card className="border-slate-200 shadow-sm">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-slate-900">
                  <MessageSquare className="h-5 w-5" />
                  Messages
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="mb-4 text-sm text-slate-500">
                  Discuss requirements and share updates with your counterpart.
                </p>
                <Button
                  variant="outline"
                  className="w-full"
                  onClick={() => navigate("/messages")}
                >
                  Open Messages
                </Button>
              </CardContent>
            </Card>

            <Card className="border-slate-200 shadow-sm">
              <CardHeader>
                <CardTitle className="text-slate-900">Having an issue?</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <p className="text-sm text-slate-500">
                  If something goes wrong with this project, you can raise a dispute for our team to review.
                </p>
                <FileDisputeDialog
                  jobId={id!}
                  againstId={isClient ? acceptedBid?.freelancer_id : job.client_id}
                />
              </CardContent>
            </Card>

            {isClient && (
              <Card className="border-slate-200 shadow-sm">
                <CardHeader>
                  <CardTitle className="text-slate-900">
                    Project Status
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {job.status !== "completed" ? (
                    <>
                      <p className="text-sm text-slate-500">
                        Marking the project complete finalizes the work and
                        enables leaving a review.
                      </p>
                      <Button
                        className="w-full bg-teal-600 hover:bg-teal-700"
                        onClick={handleMarkComplete}
                      >
                        <CheckCircle className="mr-2 h-4 w-4" />
                        Mark Project Complete
                      </Button>
                    </>
                  ) : (
                    <>
                      <div className="flex items-center gap-2 text-sm font-medium text-green-600">
                        <CheckCircle className="h-4 w-4" />
                        Completed
                      </div>
                      {acceptedBid && (
                        <>
                          <Separator />
                          <p className="text-sm text-slate-500">How was your experience? Leave a review for {names.freelancer}.</p>
                          <ReviewDialog
                            jobId={id!}
                            revieweeId={acceptedBid.freelancer_id}
                            revieweeName={names.freelancer}
                          />
                        </>
                      )}
                    </>
                  )}
                </CardContent>
              </Card>
            )}

            {isFreelancer && job.status === "completed" && (
              <Card className="border-slate-200 shadow-sm">
                <CardContent className="pt-6 space-y-4">
                  <div className="flex items-center gap-2 text-sm font-medium text-green-600">
                    <CheckCircle className="h-4 w-4" />
                    Completed
                  </div>
                  <Separator />
                  <p className="text-sm text-slate-500">Leave a review for {names.client}.</p>
                  <ReviewDialog
                    jobId={id!}
                    revieweeId={job.client_id}
                    revieweeName={names.client}
                  />
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      </div>
    </DashboardShell>
  );
};

export default ProjectWorkspace;
