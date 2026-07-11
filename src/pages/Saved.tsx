import { useEffect, useState, useCallback } from "react";
import { Link } from "react-router-dom";
import DashboardShell from "@/components/layout/DashboardShell";
import { useAuth } from "@/hooks/useAuth";
import { useUserRole } from "@/hooks/useUserRole";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import SaveButton from "@/components/SaveButton";
import { Loader2, User, Briefcase, Package } from "lucide-react";

const Saved = () => {
  const { user } = useAuth();
  const { userRole, refreshRole } = useUserRole();
  const [loading, setLoading] = useState(true);
  const [freelancers, setFreelancers] = useState<any[]>([]);
  const [jobs, setJobs] = useState<any[]>([]);
  const [services, setServices] = useState<any[]>([]);

  const load = useCallback(async () => {
    if (!user) return;
    setLoading(true);
    const { data: items } = await supabase
      .from("saved_items")
      .select("item_type, item_id")
      .eq("user_id", user.id);

    const byType = (t: string) => (items || []).filter((i) => i.item_type === t).map((i) => i.item_id);
    const freelancerIds = byType("freelancer");
    const jobIds = byType("job");
    const serviceIds = byType("service");

    const [fRes, jRes, sRes] = await Promise.all([
      freelancerIds.length
        ? supabase.from("profiles").select("id, name, headline, avatar_url, location").in("id", freelancerIds)
        : Promise.resolve({ data: [] as any[] }),
      jobIds.length
        ? supabase.from("jobs").select("id, title, budget, required_skills, status").in("id", jobIds)
        : Promise.resolve({ data: [] as any[] }),
      serviceIds.length
        ? supabase.from("service_listings").select("id, title, starting_price, tags").in("id", serviceIds)
        : Promise.resolve({ data: [] as any[] }),
    ]);

    setFreelancers(fRes.data || []);
    setJobs(jRes.data || []);
    setServices(sRes.data || []);
    setLoading(false);
  }, [user]);

  useEffect(() => { load(); }, [load]);

  if (!user) return null;

  const Empty = ({ label }: { label: string }) => (
    <div className="bg-white border border-dashed border-slate-300 rounded-lg p-12 text-center text-slate-500">
      You haven't saved any {label} yet.
    </div>
  );

  return (
    <DashboardShell userRole={userRole} onRoleChange={refreshRole}>
      <div className="space-y-8">
        <div>
          <h1 className="text-3xl font-bold text-slate-900 tracking-tight">Saved</h1>
          <p className="text-slate-600 mt-1">Freelancers, jobs, and services you bookmarked.</p>
        </div>

        {loading ? (
          <div className="flex justify-center py-20"><Loader2 className="h-8 w-8 animate-spin text-teal-600" /></div>
        ) : (
          <Tabs defaultValue="freelancers">
            <TabsList className="bg-slate-100 p-1 mb-6">
              <TabsTrigger value="freelancers" className="px-5 data-[state=active]:bg-white">Freelancers ({freelancers.length})</TabsTrigger>
              <TabsTrigger value="jobs" className="px-5 data-[state=active]:bg-white">Jobs ({jobs.length})</TabsTrigger>
              <TabsTrigger value="services" className="px-5 data-[state=active]:bg-white">Services ({services.length})</TabsTrigger>
            </TabsList>

            <TabsContent value="freelancers">
              {freelancers.length === 0 ? <Empty label="freelancers" /> : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {freelancers.map((f) => (
                    <Card key={f.id} className="border-slate-200 shadow-sm">
                      <CardHeader className="flex flex-row items-center gap-3">
                        <Avatar className="h-11 w-11"><AvatarImage src={f.avatar_url || ""} /><AvatarFallback><User className="h-5 w-5 text-slate-400" /></AvatarFallback></Avatar>
                        <div className="min-w-0 flex-1">
                          <CardTitle className="text-base truncate">{f.name}</CardTitle>
                          <p className="text-xs text-slate-500 truncate">{f.headline || f.location || ""}</p>
                        </div>
                        <SaveButton itemType="freelancer" itemId={f.id} onChange={(s) => !s && setFreelancers((p) => p.filter((x) => x.id !== f.id))} />
                      </CardHeader>
                      <CardContent>
                        <Link to={`/freelancer/${f.id}`} className="text-sm font-medium text-teal-700 hover:underline">View profile →</Link>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </TabsContent>

            <TabsContent value="jobs">
              {jobs.length === 0 ? <Empty label="jobs" /> : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {jobs.map((j) => (
                    <Card key={j.id} className="border-slate-200 shadow-sm">
                      <CardHeader className="flex flex-row items-start justify-between gap-3">
                        <CardTitle className="text-base"><Link to={`/job/${j.id}`} className="hover:text-teal-700">{j.title}</Link></CardTitle>
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-teal-700 whitespace-nowrap">${j.budget}</span>
                          <SaveButton itemType="job" itemId={j.id} onChange={(s) => !s && setJobs((p) => p.filter((x) => x.id !== j.id))} />
                        </div>
                      </CardHeader>
                      <CardContent className="flex flex-wrap gap-2">
                        {(j.required_skills || []).slice(0, 4).map((s: string) => (
                          <Badge key={s} variant="secondary" className="bg-slate-100 text-slate-700">{s}</Badge>
                        ))}
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </TabsContent>

            <TabsContent value="services">
              {services.length === 0 ? <Empty label="services" /> : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {services.map((s) => (
                    <Card key={s.id} className="border-slate-200 shadow-sm">
                      <CardHeader className="flex flex-row items-start justify-between gap-3">
                        <CardTitle className="text-base"><Link to={`/services/${s.id}`} className="hover:text-teal-700">{s.title}</Link></CardTitle>
                        <SaveButton itemType="service" itemId={s.id} onChange={(v) => !v && setServices((p) => p.filter((x) => x.id !== s.id))} />
                      </CardHeader>
                      <CardContent>
                        <p className="text-sm text-slate-500">From <span className="font-semibold text-slate-900">${s.starting_price}</span></p>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </TabsContent>
          </Tabs>
        )}
      </div>
    </DashboardShell>
  );
};

export default Saved;
