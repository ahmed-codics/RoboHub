import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Search, DollarSign, SlidersHorizontal } from "lucide-react";
import PlaceBidDialog from "./PlaceBidDialog";
import JobDetailsDialog from "@/components/jobs/JobDetailsDialog";

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
  const [searchTerm, setSearchTerm] = useState("");
  const [skillFilter, setSkillFilter] = useState<string>("all");
  const [budgetFilter, setBudgetFilter] = useState<string>("all");
  const [sortBy, setSortBy] = useState<string>("newest");

  useEffect(() => {
    loadJobs();
  }, [sortBy]);

  const loadJobs = async () => {
    setLoading(true);
    let query = supabase
      .from("jobs")
      .select("*")
      .eq("status", "open");

    // Apply sorting
    if (sortBy === "newest") {
      query = query.order("created_at", { ascending: false });
    } else if (sortBy === "oldest") {
      query = query.order("created_at", { ascending: true });
    } else if (sortBy === "budget_high") {
      query = query.order("budget", { ascending: false });
    } else if (sortBy === "budget_low") {
      query = query.order("budget", { ascending: true });
    }

    const { data, error } = await query;

    if (error) {
      console.error("Error loading jobs:", error);
      setJobs([]);
    } else {
      setJobs(data || []);
    }
    setLoading(false);
  };

  // Filter jobs on client side
  const filteredJobs = jobs.filter((job) => {
    // Search filter
    const matchesSearch = searchTerm === "" || 
      job.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      job.description.toLowerCase().includes(searchTerm.toLowerCase());

    // Skill filter
    const matchesSkill = skillFilter === "all" || 
      job.required_skills.some(skill => skill.toLowerCase().includes(skillFilter.toLowerCase()));

    // Budget filter
    let matchesBudget = true;
    if (budgetFilter === "0-1000") {
      matchesBudget = job.budget <= 1000;
    } else if (budgetFilter === "1000-5000") {
      matchesBudget = job.budget > 1000 && job.budget <= 5000;
    } else if (budgetFilter === "5000+") {
      matchesBudget = job.budget > 5000;
    }

    return matchesSearch && matchesSkill && matchesBudget;
  });


  return (
    <Card>
      <CardHeader>
        <CardTitle>Available Jobs</CardTitle>
        <CardDescription>Browse and bid on open robotics projects</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Search and Filters */}
        <div className="space-y-3">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search jobs by title or description..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
          
          <div className="flex flex-wrap gap-2">
            <Select value={skillFilter} onValueChange={setSkillFilter}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Filter by skill" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Skills</SelectItem>
                <SelectItem value="ros">ROS</SelectItem>
                <SelectItem value="slam">SLAM</SelectItem>
                <SelectItem value="embedded">Embedded</SelectItem>
                <SelectItem value="control">Control Systems</SelectItem>
                <SelectItem value="simulation">Simulation</SelectItem>
              </SelectContent>
            </Select>

            <Select value={budgetFilter} onValueChange={setBudgetFilter}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Filter by budget" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Budgets</SelectItem>
                <SelectItem value="0-1000">Under $1,000</SelectItem>
                <SelectItem value="1000-5000">$1,000 - $5,000</SelectItem>
                <SelectItem value="5000+">$5,000+</SelectItem>
              </SelectContent>
            </Select>

            <Select value={sortBy} onValueChange={setSortBy}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Sort by" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="newest">Newest First</SelectItem>
                <SelectItem value="oldest">Oldest First</SelectItem>
                <SelectItem value="budget_high">Highest Budget</SelectItem>
                <SelectItem value="budget_low">Lowest Budget</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Jobs List */}
        {loading ? (
          <p className="text-center text-muted-foreground py-8">Loading jobs...</p>
        ) : filteredJobs.length === 0 ? (
          <p className="text-center text-muted-foreground py-8">No jobs match your filters</p>
        ) : (
          filteredJobs.map((job) => (
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

              <div className="flex gap-2">
                <JobDetailsDialog jobId={job.id} userRole={userRole} userId={userId} />
                {userRole === "freelancer" && (
                  <PlaceBidDialog jobId={job.id} userId={userId} onBidPlaced={() => {
                    loadJobs();
                    onBidPlaced?.();
                  }} />
                )}
              </div>
            </div>
          ))
        )}
      </CardContent>
    </Card>
  );
};

export default JobsList;
