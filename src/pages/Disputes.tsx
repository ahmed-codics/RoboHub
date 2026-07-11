import { useCallback, useEffect, useState } from "react";
import { Loader2, ShieldQuestion, AlertTriangle } from "lucide-react";
import DashboardShell from "@/components/layout/DashboardShell";
import { useAuth } from "@/hooks/useAuth";
import { useUserRole } from "@/hooks/useUserRole";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

interface DisputeRow {
  id: string;
  job_id: string;
  raised_by: string;
  against_id: string | null;
  reason: string;
  description: string;
  evidence_url: string | null;
  status: "open" | "under_review" | "resolved" | "rejected";
  resolution: string | null;
  created_at: string;
}

const STATUS_META: Record<
  DisputeRow["status"],
  { label: string; className: string }
> = {
  open: { label: "Open", className: "bg-amber-100 text-amber-700 hover:bg-amber-100" },
  under_review: { label: "Under Review", className: "bg-blue-100 text-blue-700 hover:bg-blue-100" },
  resolved: { label: "Resolved", className: "bg-green-100 text-green-700 hover:bg-green-100" },
  rejected: { label: "Rejected", className: "bg-slate-100 text-slate-600 hover:bg-slate-100" },
};

const formatDate = (value: string) =>
  new Date(value).toLocaleDateString(undefined, {
    year: "numeric",
    month: "short",
    day: "numeric",
  });

const Disputes = () => {
  const { user } = useAuth();
  const { userRole, refreshRole } = useUserRole();
  const [loading, setLoading] = useState(true);
  const [disputes, setDisputes] = useState<DisputeRow[]>([]);
  const [jobTitles, setJobTitles] = useState<Record<string, string>>({});

  const load = useCallback(async () => {
    if (!user) return;
    setLoading(true);

    const { data, error } = await supabase
      .from("disputes")
      .select("*")
      .or(`raised_by.eq.${user.id},against_id.eq.${user.id}`)
      .order("created_at", { ascending: false });

    if (error) {
      setDisputes([]);
      setLoading(false);
      return;
    }

    const rows = (data as DisputeRow[]) || [];
    setDisputes(rows);

    const jobIds = Array.from(new Set(rows.map((d) => d.job_id).filter(Boolean)));
    if (jobIds.length > 0) {
      const { data: jobs } = await supabase.from("jobs").select("id, title").in("id", jobIds);
      const map: Record<string, string> = {};
      (jobs || []).forEach((j: any) => {
        map[j.id] = j.title;
      });
      setJobTitles(map);
    } else {
      setJobTitles({});
    }

    setLoading(false);
  }, [user]);

  useEffect(() => {
    load();
  }, [load]);

  if (!user) return null;

  return (
    <DashboardShell userRole={userRole} onRoleChange={refreshRole}>
      <div className="space-y-8">
        <div>
          <h1 className="text-3xl font-bold text-slate-900 tracking-tight">Disputes</h1>
          <p className="text-slate-600 mt-1">
            Track disputes you are involved in. Our admin team reviews each case and works with both parties
            to reach a fair resolution.
          </p>
        </div>

        {loading ? (
          <div className="flex justify-center py-20">
            <Loader2 className="h-8 w-8 animate-spin text-teal-600" />
          </div>
        ) : disputes.length === 0 ? (
          <Card className="border-slate-200 shadow-sm">
            <CardContent className="flex flex-col items-center justify-center py-16 text-center">
              <div className="h-12 w-12 rounded-full bg-teal-100 flex items-center justify-center mb-4">
                <ShieldQuestion className="h-6 w-6 text-teal-600" />
              </div>
              <h3 className="text-lg font-bold text-slate-900">No disputes yet</h3>
              <p className="text-slate-500 mt-1 max-w-md">
                You have no open or past disputes. If something goes wrong, you can raise a dispute directly
                from a project or job page.
              </p>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-4">
            {disputes.map((dispute) => {
              const meta = STATUS_META[dispute.status];
              const raisedByMe = dispute.raised_by === user.id;

              return (
                <Card key={dispute.id} className="border-slate-200 shadow-sm rounded-lg">
                  <CardHeader className="flex flex-row items-start justify-between gap-4 space-y-0">
                    <div>
                      <CardTitle className="text-base font-bold text-slate-900">
                        {jobTitles[dispute.job_id] || "Untitled job"}
                      </CardTitle>
                      <p className="text-sm font-bold text-slate-800 mt-1">{dispute.reason}</p>
                      <p className="text-xs text-slate-500 mt-1">Filed on {formatDate(dispute.created_at)}</p>
                    </div>
                    <div className="flex flex-col items-end gap-2 shrink-0">
                      <Badge className={meta.className}>{meta.label}</Badge>
                      <span className="text-xs font-medium text-slate-500">
                        {raisedByMe ? "You filed this" : "Filed against you"}
                      </span>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <p className="text-sm text-slate-600 whitespace-pre-line">{dispute.description}</p>

                    {dispute.evidence_url && (
                      <a
                        href={dispute.evidence_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-block text-sm font-medium text-teal-600 hover:text-teal-700 hover:underline"
                      >
                        View submitted evidence
                      </a>
                    )}

                    {dispute.resolution && (
                      <div className="rounded-lg border border-green-200 bg-green-50 p-4">
                        <div className="flex items-center gap-2 mb-1">
                          <AlertTriangle className="h-4 w-4 text-green-700" />
                          <p className="text-sm font-bold text-green-800">Resolution</p>
                        </div>
                        <p className="text-sm text-green-800 whitespace-pre-line">{dispute.resolution}</p>
                      </div>
                    )}
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}
      </div>
    </DashboardShell>
  );
};

export default Disputes;
