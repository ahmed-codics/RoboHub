import { useEffect, useState, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Search, DollarSign, ArrowLeft, Briefcase, Filter } from "lucide-react";
import PlaceBidDialog from "@/components/dashboard/PlaceBidDialog";
import JobBidsDialog from "@/components/dashboard/JobBidsDialog";
import { toast } from "sonner";
import DashboardSidebar from "@/components/layout/DashboardSidebar";

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

  const checkUser = useCallback(async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) { navigate("/auth"); return; }
      setUserId(session.user.id);

      const { data: roleData } = await supabase.from("user_roles").select("role").eq("user_id", session.user.id).maybeSingle();
      if (roleData) setUserRole(roleData.role);
    } catch (error) { toast.error("Failed to load user data"); }
  }, [navigate]);

  useEffect(() => { checkUser(); }, [checkUser]);

  useEffect(() => {
    if (userId) loadJobs();
  }, [userId, sortBy]);

  const loadJobs = async () => {
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
  };

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

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    navigate("/");
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950">
      <DashboardSidebar userRole={userRole} activePath="/jobs" onNavigate={navigate} onSignOut={handleSignOut} />

      <div className="pl-64">
        <div className="max-w-7xl mx-auto p-8 space-y-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-slate-900 dark:text-white">Experience Jobs</h1>
              <p className="text-slate-500 dark:text-slate-400">Discover and bid on robotic projects.</p>
            </div>
            <div className="flex gap-2">
              <Button variant="outline" className="gap-2"><Filter className="w-4 h-4" /> More Filters</Button>
            </div>
          </div>

          {/* Search Bar */}
          <div className="glass-card p-4 rounded-xl flex gap-4 items-center">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-3 h-5 w-5 text-slate-400" />
              <Input
                placeholder="Search by keyword..."
                value={searchTerm}
                onChange={e => setSearchTerm(e.target.value)}
                className="pl-10 h-11 bg-slate-900/50 border-slate-700 text-white"
              />
            </div>
            <Select value={sortBy} onValueChange={setSortBy}>
              <SelectTrigger className="w-[180px] h-11 bg-slate-900/50 border-slate-700 text-white">
                <SelectValue placeholder="Sort" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="newest">Newest</SelectItem>
                <SelectItem value="budget_high">Highest Budget</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Jobs Grid */}
          {loading ? (
            <div className="text-white text-center py-20">Loading opportunities...</div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {filteredJobs.map(job => (
                <div key={job.id} className="glass-card p-6 rounded-2xl group hover:border-primary/50 transition-all duration-300">
                  <div className="flex justify-between items-start mb-4">
                    <Badge variant="outline" className="bg-primary/10 text-primary border-primary/20 uppercase tracking-wider text-[10px]">
                      {job.status.replace('_', ' ')}
                    </Badge>
                    <span className="text-slate-900 dark:text-white font-bold text-lg flex items-center gap-1">
                      <DollarSign className="w-4 h-4 text-green-600 dark:text-green-400" />
                      {job.budget.toLocaleString()}
                    </span>
                  </div>

                  <h3 className="text-xl font-bold text-white mb-2 group-hover:text-primary transition-colors">{job.title}</h3>
                  <p className="text-slate-400 text-sm line-clamp-2 mb-4">{job.description}</p>

                  <div className="flex flex-wrap gap-2 mb-6">
                    {job.required_skills.slice(0, 3).map(skill => (
                      <Badge key={skill} variant="secondary" className="bg-slate-800 text-slate-300">{skill}</Badge>
                    ))}
                    {job.required_skills.length > 3 && <Badge variant="secondary" className="bg-slate-800 text-slate-300">+{job.required_skills.length - 3}</Badge>}
                  </div>

                  <div className="flex items-center justify-between pt-4 border-t border-white/5">
                    <span className="text-xs text-slate-500">Posted {new Date(job.created_at).toLocaleDateString()}</span>
                    {userRole === "freelancer" && userId !== job.client_id && (
                      <PlaceBidDialog jobId={job.id} userId={userId} onBidPlaced={loadJobs} />
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Jobs;
