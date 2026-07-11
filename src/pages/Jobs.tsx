import { useEffect, useState, useCallback, useMemo } from "react";
import { useNavigate, Link } from "react-router-dom";
import SaveButton from "@/components/SaveButton";
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
  const [showFilters, setShowFilters] = useState(true);
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

  const skillOptions = useMemo(() => {
    const set = new Set<string>();
    jobs.forEach((job) => job.required_skills.forEach((skill) => set.add(skill)));
    return Array.from(set).sort((a, b) => a.localeCompare(b));
  }, [jobs]);

  const activeFilterCount =
    (skillFilter !== "all" ? 1 : 0) + (budgetFilter !== "all" ? 1 : 0) + (statusFilter !== "all" ? 1 : 0);

  return (
    <DashboardShell userRole={userRole} onRoleChange={checkUser}>
      <div className="space-y-8 animate-fade-in-up">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-slate-900 tracking-tight">Experience Jobs</h1>
            <p className="text-slate-600 mt-1">Discover and bid on robotic projects.</p>
          </div>
          <div className="flex gap-2">
            <Button
              variant="outline"
              onClick={() => setShowFilters((v) => !v)}
              className="gap-2 bg-white"
            >
              <Filter className="w-4 h-4" /> {showFilters ? "Hide Filters" : "More Filters"}
              {activeFilterCount > 0 && (
                <Badge className="ml-1 bg-teal-600 text-white border-0 h-5 px-1.5">{activeFilterCount}</Badge>
              )}
            </Button>
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
              <SelectItem value="oldest">Oldest</SelectItem>
              <SelectItem value="budget_high">Highest Budget</SelectItem>
              <SelectItem value="budget_low">Lowest Budget</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Filter Row */}
        {showFilters && (
          <div className="bg-white border border-slate-200 p-4 rounded-lg shadow-sm grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="text-xs font-semibold text-slate-500 mb-1.5 block">Skill</label>
              <Select value={skillFilter} onValueChange={setSkillFilter}>
                <SelectTrigger className="h-10 border-slate-200 bg-white rounded-md"><SelectValue placeholder="All skills" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All skills</SelectItem>
                  {skillOptions.map((skill) => (
                    <SelectItem key={skill} value={skill}>{skill}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <label className="text-xs font-semibold text-slate-500 mb-1.5 block">Budget</label>
              <Select value={budgetFilter} onValueChange={setBudgetFilter}>
                <SelectTrigger className="h-10 border-slate-200 bg-white rounded-md"><SelectValue placeholder="Any budget" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Any budget</SelectItem>
                  <SelectItem value="0-1000">Up to $1,000</SelectItem>
                  <SelectItem value="1000-5000">$1,000 – $5,000</SelectItem>
                  <SelectItem value="5000+">$5,000+</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <label className="text-xs font-semibold text-slate-500 mb-1.5 block">Status</label>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="h-10 border-slate-200 bg-white rounded-md"><SelectValue placeholder="All statuses" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All statuses</SelectItem>
                  <SelectItem value="open">Open</SelectItem>
                  <SelectItem value="in_progress">In Progress</SelectItem>
                  <SelectItem value="completed">Completed</SelectItem>
                  <SelectItem value="cancelled">Cancelled</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        )}

        {/* Jobs Grid */}
        {(loading || authLoading) ? (
          <div className="text-slate-500 text-center py-20 font-medium">Loading opportunities...</div>
        ) : filteredJobs.length === 0 ? (
          <div className="bg-white border border-dashed border-slate-300 rounded-lg p-16 text-center">
            <p className="text-slate-600 font-medium">No jobs match your filters.</p>
            <p className="text-slate-400 text-sm mt-1">Try adjusting your search or clearing filters.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {filteredJobs.map(job => (
              <div key={job.id} className="bg-white border border-slate-200 p-6 rounded-lg shadow-sm hover:shadow-md transition-shadow">
                <div className="flex justify-between items-start mb-4">
                  <Badge variant="outline" className="bg-slate-100 text-slate-700 border-slate-200 uppercase tracking-wider text-[10px]">
                    {job.status.replace('_', ' ')}
                  </Badge>
                  <div className="flex items-center gap-2">
                    <span className="text-slate-900 font-bold text-lg flex items-center gap-1">
                      <DollarSign className="w-4 h-4 text-teal-600" />
                      {job.budget.toLocaleString()}
                    </span>
                    <SaveButton itemType="job" itemId={job.id} className="h-8 w-8" />
                  </div>
                </div>

                <Link to={`/job/${job.id}`}>
                  <h3 className="text-xl font-bold text-slate-900 mb-2 hover:text-teal-600 transition-colors">{job.title}</h3>
                </Link>
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
