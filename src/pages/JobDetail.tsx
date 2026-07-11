import { useEffect, useState, useCallback } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import AppShell from "@/components/layout/AppShell";
import PlaceBidDialog from "@/components/dashboard/PlaceBidDialog";
import SaveButton from "@/components/SaveButton";
import { useSeo } from "@/hooks/useSeo";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { toast } from "sonner";
import {
  ArrowLeft,
  Loader2,
  Share2,
  MapPin,
  CalendarDays,
  DollarSign,
  Briefcase,
} from "lucide-react";

interface Job {
  id: string;
  title: string;
  description: string;
  budget: number;
  required_skills: string[] | null;
  status: "open" | "in_progress" | "completed" | "cancelled";
  created_at: string;
  client_id: string;
}

interface Profile {
  id: string;
  name: string | null;
  headline: string | null;
  bio: string | null;
  location: string | null;
  avatar_url: string | null;
  created_at: string;
}

const statusStyles: Record<Job["status"], string> = {
  open: "bg-teal-100 text-teal-700 hover:bg-teal-100",
  in_progress: "bg-amber-100 text-amber-700 hover:bg-amber-100",
  completed: "bg-slate-200 text-slate-700 hover:bg-slate-200",
  cancelled: "bg-red-100 text-red-700 hover:bg-red-100",
};

const formatBudget = (value: number) =>
  new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 0,
  }).format(value);

const formatDate = (value: string) =>
  new Date(value).toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });

const formatMemberSince = (value: string) =>
  `Member since ${new Date(value).toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
  })}`;

const JobDetail = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();

  const [loading, setLoading] = useState(true);
  const [job, setJob] = useState<Job | null>(null);
  const [client, setClient] = useState<Profile | null>(null);
  const [bidCount, setBidCount] = useState(0);
  const [similarJobs, setSimilarJobs] = useState<Job[]>([]);

  useSeo(job ? job.title : "Job", job ? job.description?.slice(0, 155) : undefined);

  const refetchBidCount = useCallback(async () => {
    if (!id) return;
    const { count } = await supabase
      .from("bids")
      .select("id", { count: "exact", head: true })
      .eq("job_id", id);
    setBidCount(count ?? 0);
  }, [id]);

  useEffect(() => {
    let cancelled = false;

    const load = async () => {
      if (!id) {
        setLoading(false);
        return;
      }
      setLoading(true);

      const { data: jobData } = await supabase
        .from("jobs")
        .select("*")
        .eq("id", id)
        .maybeSingle();

      if (cancelled) return;

      if (!jobData) {
        setJob(null);
        setLoading(false);
        return;
      }

      setJob(jobData as Job);

      const [{ data: clientData }, { count }, { data: similar }] =
        await Promise.all([
          supabase
            .from("profiles")
            .select("*")
            .eq("id", jobData.client_id)
            .maybeSingle(),
          supabase
            .from("bids")
            .select("id", { count: "exact", head: true })
            .eq("job_id", id),
          supabase
            .from("jobs")
            .select("*")
            .eq("status", "open")
            .neq("id", id)
            .order("created_at", { ascending: false })
            .limit(4),
        ]);

      if (cancelled) return;

      setClient((clientData as Profile) ?? null);
      setBidCount(count ?? 0);
      setSimilarJobs((similar as Job[]) ?? []);
      setLoading(false);
    };

    load();

    return () => {
      cancelled = true;
    };
  }, [id]);

  const handleShare = async () => {
    try {
      await navigator.clipboard.writeText(window.location.href);
      toast.success("Link copied");
    } catch {
      toast.error("Could not copy link");
    }
  };

  if (loading) {
    return (
      <AppShell>
        <div className="flex items-center justify-center py-32">
          <Loader2 className="h-10 w-10 animate-spin text-teal-600" />
        </div>
      </AppShell>
    );
  }

  if (!job) {
    return (
      <AppShell>
        <div className="container mx-auto px-4 py-8 max-w-5xl">
          <div className="flex flex-col items-center justify-center gap-4 py-24 text-center">
            <Briefcase className="h-12 w-12 text-slate-300" />
            <h1 className="text-2xl font-bold text-slate-900">
              Job not found
            </h1>
            <p className="text-slate-500">
              This job posting doesn&apos;t exist or has been removed.
            </p>
            <Button
              className="bg-teal-600 hover:bg-teal-700"
              onClick={() => navigate("/jobs")}
            >
              Browse jobs
            </Button>
          </div>
        </div>
      </AppShell>
    );
  }

  const skills = job.required_skills ?? [];
  const clientName = client?.name || "Client";
  const clientInitials = clientName
    .split(" ")
    .map((part) => part[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();

  return (
    <AppShell>
      <div className="container mx-auto px-4 py-8 max-w-5xl">
        <Button
          variant="ghost"
          className="mb-6 -ml-2 text-slate-600 hover:text-slate-900"
          onClick={() => navigate(-1)}
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back
        </Button>

        <div className="grid grid-cols-1 gap-8 lg:grid-cols-3">
          {/* Main */}
          <div className="lg:col-span-2 space-y-6">
            <div className="bg-white border border-slate-200 rounded-lg shadow-sm p-6">
              <div className="flex items-start justify-between gap-4">
                <Badge
                  className={`capitalize ${statusStyles[job.status]}`}
                  variant="secondary"
                >
                  {job.status.replace("_", " ")}
                </Badge>
                <div className="flex items-center gap-2 shrink-0">
                  <SaveButton itemType="job" itemId={job.id} className="h-9 w-9" />
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleShare}
                  >
                    <Share2 className="mr-2 h-4 w-4" />
                    Share
                  </Button>
                </div>
              </div>

              <h1 className="mt-4 text-3xl font-bold text-slate-900">
                {job.title}
              </h1>

              <div className="mt-4 flex flex-wrap items-center gap-x-6 gap-y-2 text-sm">
                <span className="flex items-center gap-1.5 text-2xl font-bold text-teal-600">
                  <DollarSign className="h-6 w-6" />
                  {formatBudget(job.budget)}
                </span>
                <span className="flex items-center gap-1.5 text-slate-500">
                  <CalendarDays className="h-4 w-4" />
                  Posted {formatDate(job.created_at)}
                </span>
              </div>

              {skills.length > 0 && (
                <>
                  <Separator className="my-6" />
                  <div>
                    <h2 className="mb-3 text-sm font-semibold text-slate-900">
                      Required skills
                    </h2>
                    <div className="flex flex-wrap gap-2">
                      {skills.map((skill) => (
                        <Badge
                          key={skill}
                          variant="secondary"
                          className="bg-slate-100 text-slate-700 hover:bg-slate-100"
                        >
                          {skill}
                        </Badge>
                      ))}
                    </div>
                  </div>
                </>
              )}

              <Separator className="my-6" />

              <div>
                <h2 className="mb-3 text-sm font-semibold text-slate-900">
                  Description
                </h2>
                <p className="whitespace-pre-line text-slate-600 leading-relaxed">
                  {job.description}
                </p>
              </div>
            </div>

            {similarJobs.length > 0 && (
              <div>
                <h2 className="mb-4 text-xl font-bold text-slate-900">
                  Similar jobs
                </h2>
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  {similarJobs.map((other) => (
                    <Link key={other.id} to={`/job/${other.id}`}>
                      <Card className="h-full bg-white border border-slate-200 rounded-lg shadow-sm transition-colors hover:border-teal-300">
                        <CardContent className="p-4">
                          <h3 className="font-semibold text-slate-900 line-clamp-2">
                            {other.title}
                          </h3>
                          <p className="mt-2 font-bold text-teal-600">
                            {formatBudget(other.budget)}
                          </p>
                          {(other.required_skills ?? []).length > 0 && (
                            <div className="mt-3 flex flex-wrap gap-1.5">
                              {(other.required_skills ?? [])
                                .slice(0, 2)
                                .map((skill) => (
                                  <Badge
                                    key={skill}
                                    variant="secondary"
                                    className="bg-slate-100 text-slate-600 hover:bg-slate-100"
                                  >
                                    {skill}
                                  </Badge>
                                ))}
                            </div>
                          )}
                        </CardContent>
                      </Card>
                    </Link>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Sidebar */}
          <div className="lg:col-span-1">
            <div className="space-y-6 lg:sticky lg:top-8">
              <Card className="bg-white border border-slate-200 rounded-lg shadow-sm">
                <CardHeader>
                  <CardTitle className="text-base font-bold text-slate-900">
                    About the client
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center gap-3">
                    <Avatar className="h-12 w-12">
                      {client?.avatar_url && (
                        <AvatarImage src={client.avatar_url} alt={clientName} />
                      )}
                      <AvatarFallback className="bg-teal-100 text-teal-700">
                        {clientInitials || "C"}
                      </AvatarFallback>
                    </Avatar>
                    <div className="min-w-0">
                      <p className="font-semibold text-slate-900 truncate">
                        {clientName}
                      </p>
                      {client?.headline && (
                        <p className="text-sm text-slate-500 truncate">
                          {client.headline}
                        </p>
                      )}
                    </div>
                  </div>

                  {client?.location && (
                    <p className="flex items-center gap-2 text-sm text-slate-500">
                      <MapPin className="h-4 w-4" />
                      {client.location}
                    </p>
                  )}

                  {client?.created_at && (
                    <p className="flex items-center gap-2 text-sm text-slate-500">
                      <CalendarDays className="h-4 w-4" />
                      {formatMemberSince(client.created_at)}
                    </p>
                  )}

                  <Separator />

                  <Link to={`/freelancer/${job.client_id}`}>
                    <Button
                      variant="outline"
                      className="w-full"
                    >
                      View profile
                    </Button>
                  </Link>
                </CardContent>
              </Card>

              <Card className="bg-white border border-slate-200 rounded-lg shadow-sm">
                <CardContent className="p-6 space-y-4">
                  <p className="text-sm text-slate-500">
                    <span className="text-2xl font-bold text-slate-900">
                      {bidCount}
                    </span>{" "}
                    {bidCount === 1 ? "proposal" : "proposals"}
                  </p>

                  {!user ? (
                    <Button
                      className="w-full bg-teal-600 hover:bg-teal-700"
                      onClick={() => navigate("/auth")}
                    >
                      Sign in to apply
                    </Button>
                  ) : user.id === job.client_id ? (
                    <p className="text-sm text-slate-500">
                      This is your job posting.
                    </p>
                  ) : (
                    <PlaceBidDialog
                      jobId={job.id}
                      userId={user.id}
                      onBidPlaced={refetchBidCount}
                    />
                  )}
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </div>
    </AppShell>
  );
};

export default JobDetail;
