import { useEffect, useState, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Search, DollarSign, ArrowLeft, Briefcase, Filter } from "lucide-react";
import PlaceBidDialog from "@/components/dashboard/PlaceBidDialog";
import JobBidsDialog from "@/components/dashboard/JobBidsDialog";
import { toast } from "sonner";
import DashboardShell from "@/components/layout/DashboardShell";

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

const Jobs = () => {
  const navigate = useNavigate();
  const [jobs, setJobs] = useState<Job[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [skillFilter, setSkillFilter] = useState<string>("all");
  const [budgetFilter, setBudgetFilter] = useState<string>("all");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [sortBy, setSortBy] = useState<string>("newest");
  const [userId, setUserId] = useState<string>("");
  const [userRole, setUserRole] = useState<string>("");
  const { user, loading: authLoading, signOut } = useAuth();

  const checkUser = useCallback(async () => {
    if (!user) {
      setLoading(false);
      navigate("/auth");
      return;
    }

    setUserId(user.id);

    try {
      const { data: roleData, error } = await supabase
        .from("user_roles")
        .select("role")
        .eq("user_id", user.id)
        .maybeSingle();

      if (error) throw error;

      if (roleData?.role) {
        setUserRole(roleData.role);
        return;
      }

      const { data: createdRole, error: createError } = await supabase
        .from("user_roles")
        .upsert({ user_id: user.id, role: "freelancer" })
        .select("role")
        .single();

      if (createError) throw createError;
      setUserRole(createdRole?.role || "freelancer");
    } catch (error) {
      console.error("Failed to load jobs user role:", error);
      setUserRole("freelancer");
      toast.error("Using default freelancer role");
    }
  }, [user, navigate]);

  useEffect(() => { 
    if (authLoading) return;
    checkUser(); 
  }, [authLoading, checkUser]);

  const loadJobs = useCallback(async () => {
    try {
      setLoading(true);
      let query = supabase.from("jobs").select("*");

      if (sortBy === "newest") query = query.order("created_at", { ascending: false });
      else if (sortBy === "oldest") query = query.order("created_at", { ascending: true });
      else if (sortBy === "budget_high") query = query.order("budget", { ascending: false });
      else if (sortBy === "budget_low") query = query.order("budget", { ascending: true });

      const { data, error } = await query;
      if (error) throw error;
      setJobs(data || []);
    } catch (error) {
      toast.error("Failed to load jobs");
    } finally {
      setLoading(false);
    }
  }, [sortBy]);

  useEffect(() => {
    if (userId) loadJobs();
  }, [userId, loadJobs]);

  const filteredJobs = jobs.filter((job) => {
    const matchesSearch = searchTerm === "" || job.title.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesSkill = skillFilter === "all" || job.required_skills.some(skill => skill.toLowerCase().includes(skillFilter.toLowerCase()));
    const matchesStatus = statusFilter === "all" || job.status === statusFilter;
    let matchesBudget = true;
    if (budgetFilter === "0-1000") matchesBudget = job.budget <= 1000;
    else if (budgetFilter === "1000-5000") matchesBudget = job.budget > 1000 && job.budget <= 5000;
    else if (budgetFilter === "5000+") matchesBudget = job.budget > 5000;

    return matchesSearch && matchesSkill && matchesStatus && matchesBudget;
  });

  return (
    <DashboardShell userRole={userRole} onRoleChange={checkUser}>
      <div className="space-y-8 animate-fade-in-up">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-slate-900 tracking-tight">Experience Jobs</h1>
            <p className="text-slate-600 mt-1">Discover and bid on robotic projects.</p>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" className="gap-2 bg-white"><Filter className="w-4 h-4" /> More Filters</Button>
          </div>
        </div>

        {/* Search Bar */}
        <div className="bg-white border border-slate-200 p-4 rounded-lg shadow-sm flex gap-4 items-center">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-3 h-5 w-5 text-slate-400" />
            <Input
              placeholder="Search by keyword..."
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
              className="pl-10 h-11 border-slate-200 bg-slate-50 focus:border-teal-500 focus:ring-teal-500 rounded-md"
            />
          </div>
          <Select value={sortBy} onValueChange={setSortBy}>
            <SelectTrigger className="w-[180px] h-11 border-slate-200 bg-white rounded-md">
              <SelectValue placeholder="Sort" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="newest">Newest</SelectItem>
              <SelectItem value="budget_high">Highest Budget</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Jobs Grid */}
        {(loading || authLoading) ? (
          <div className="text-slate-500 text-center py-20 font-medium">Loading opportunities...</div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {filteredJobs.map(job => (
              <div key={job.id} className="bg-white border border-slate-200 p-6 rounded-lg shadow-sm hover:shadow-md transition-shadow">
                <div className="flex justify-between items-start mb-4">
                  <Badge variant="outline" className="bg-slate-100 text-slate-700 border-slate-200 uppercase tracking-wider text-[10px]">
                    {job.status.replace('_', ' ')}
                  </Badge>
                  <span className="text-slate-900 font-bold text-lg flex items-center gap-1">
                    <DollarSign className="w-4 h-4 text-teal-600" />
                    {job.budget.toLocaleString()}
                  </span>
                </div>

                <h3 className="text-xl font-bold text-slate-900 mb-2 hover:text-teal-600 transition-colors">{job.title}</h3>
                <p className="text-slate-600 text-sm line-clamp-2 mb-4">{job.description}</p>

                <div className="flex flex-wrap gap-2 mb-6">
                  {job.required_skills.slice(0, 3).map(skill => (
                    <Badge key={skill} variant="secondary" className="bg-slate-100 text-slate-700 hover:bg-slate-200">{skill}</Badge>
                  ))}
                  {job.required_skills.length > 3 && <Badge variant="secondary" className="bg-slate-100 text-slate-700">+{job.required_skills.length - 3}</Badge>}
                </div>

                <div className="flex items-center justify-between pt-4 border-t border-slate-100">
                  <span className="text-xs text-slate-500 font-medium">Posted {new Date(job.created_at).toLocaleDateString()}</span>
                  {userRole === "freelancer" && userId !== job.client_id && (
                    <PlaceBidDialog jobId={job.id} userId={userId} onBidPlaced={loadJobs} />
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </DashboardShell>
  );
};

export default Jobs;
