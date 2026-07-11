import { useEffect, useMemo, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import AppShell from "@/components/layout/AppShell";
import { useSearch } from "@/hooks/useSearch";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import SaveButton from "@/components/SaveButton";
import { Loader2, Search as SearchIcon, User, Filter } from "lucide-react";

// Keyword sets used to bucket a skill into a broad discipline category.
const CATEGORY_KEYWORDS: Record<string, string[]> = {
  software: ["ros", "python", "c++", "slam", "navigation", "opencv", "yolo", "vision", "ai", "ml", "software", "web", "react", "node", "firmware", "control", "matlab", "mqtt"],
  hardware: ["pcb", "embedded", "arduino", "stm32", "esp32", "sensor", "circuit", "electronics", "fpga", "microcontroller", "iot", "wiring", "power"],
  mechanical: ["solidworks", "fusion", "cad", "mechanical", "3d", "actuator", "gearbox", "chassis", "kinematics", "structural"],
};

const matchesCategory = (skills: string[], categories: string[]) => {
  if (categories.length === 0) return true;
  const lower = skills.map((s) => s.toLowerCase());
  return categories.some((cat) =>
    CATEGORY_KEYWORDS[cat].some((kw) => lower.some((s) => s.includes(kw)))
  );
};

const Search = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const query = searchParams.get("q") || "";
  const [searchInput, setSearchInput] = useState(query);
  const { freelancers, jobs, loading, error } = useSearch(query);

  const [categories, setCategories] = useState<string[]>([]);
  const [levels, setLevels] = useState<string[]>([]);

  useEffect(() => {
    setSearchInput(query);
  }, [query]);

  const toggle = (list: string[], setter: (v: string[]) => void, value: string) => {
    setter(list.includes(value) ? list.filter((v) => v !== value) : [...list, value]);
  };

  const handleSearch = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const trimmedQuery = searchInput.trim();
    navigate(trimmedQuery ? `/search?q=${encodeURIComponent(trimmedQuery)}` : "/search");
  };

  // Expert = 5+ listed skills, Intermediate = fewer. Transparent proxy for level.
  const levelOf = (skillCount: number) => (skillCount >= 5 ? "expert" : "intermediate");

  const filteredFreelancers = useMemo(
    () =>
      freelancers.filter((f) => {
        if (!matchesCategory(f.skills, categories)) return false;
        if (levels.length > 0 && !levels.includes(levelOf(f.skills.length))) return false;
        return true;
      }),
    [freelancers, categories, levels]
  );

  const filteredJobs = useMemo(
    () => jobs.filter((j) => matchesCategory(j.required_skills, categories)),
    [jobs, categories]
  );

  const CheckboxRow = ({
    checked, onChange, label,
  }: { checked: boolean; onChange: () => void; label: string }) => (
    <label className="flex items-center gap-2 text-sm text-slate-600 cursor-pointer">
      <input type="checkbox" checked={checked} onChange={onChange} className="rounded text-teal-600 focus:ring-teal-500" />
      {label}
    </label>
  );

  return (
    <AppShell>
      <div className="container mx-auto px-4 py-8 max-w-7xl">
        {/* Search Header */}
        <div className="mb-8 rounded-lg border border-slate-200 bg-white p-6 shadow-sm">
          <h1 className="text-3xl font-bold text-slate-900 tracking-tight">Search robotics talent and jobs</h1>
          <p className="mt-2 text-slate-500">Try skills, platforms, project types, or job titles.</p>
          <form onSubmit={handleSearch} className="mt-5 flex flex-col gap-3 sm:flex-row">
            <div className="relative flex-1">
              <SearchIcon className="absolute left-3 top-3 h-5 w-5 text-slate-400" />
              <input
                type="search"
                value={searchInput}
                onChange={(event) => setSearchInput(event.target.value)}
                placeholder="Search ROS2, SLAM, PCB design..."
                className="h-11 w-full rounded-md border border-slate-200 bg-white pl-10 pr-4 text-slate-900 outline-none transition focus:border-teal-500 focus:ring-1 focus:ring-teal-500"
              />
            </div>
            <Button type="submit" className="h-11 rounded-md bg-teal-600 px-8 font-medium text-white hover:bg-teal-700 shadow-sm">
              Search
            </Button>
          </form>
        </div>

        <div className="flex flex-col lg:flex-row gap-8">
          {/* Filters Sidebar */}
          <div className="w-full lg:w-64 flex-shrink-0">
            <div className="bg-white border border-slate-200 rounded-lg p-5 shadow-sm sticky top-24">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <Filter className="w-4 h-4 text-slate-500" />
                  <h2 className="font-bold text-slate-900">Filters</h2>
                </div>
                {(categories.length > 0 || levels.length > 0) && (
                  <button onClick={() => { setCategories([]); setLevels([]); }} className="text-xs font-medium text-teal-600 hover:underline">
                    Clear
                  </button>
                )}
              </div>
              <div className="space-y-4">
                <div>
                  <h3 className="text-sm font-semibold text-slate-700 mb-2">Category</h3>
                  <div className="space-y-2">
                    <CheckboxRow checked={categories.includes("software")} onChange={() => toggle(categories, setCategories, "software")} label="Software" />
                    <CheckboxRow checked={categories.includes("hardware")} onChange={() => toggle(categories, setCategories, "hardware")} label="Hardware" />
                    <CheckboxRow checked={categories.includes("mechanical")} onChange={() => toggle(categories, setCategories, "mechanical")} label="Mechanical" />
                  </div>
                </div>
                <hr className="border-slate-100" />
                <div>
                  <h3 className="text-sm font-semibold text-slate-700 mb-2">Experience Level</h3>
                  <div className="space-y-2">
                    <CheckboxRow checked={levels.includes("expert")} onChange={() => toggle(levels, setLevels, "expert")} label="Expert" />
                    <CheckboxRow checked={levels.includes("intermediate")} onChange={() => toggle(levels, setLevels, "intermediate")} label="Intermediate" />
                  </div>
                  <p className="mt-2 text-[11px] text-slate-400">Applies to freelancer results.</p>
                </div>
              </div>
            </div>
          </div>

          {/* Results Area */}
          <div className="flex-1 min-w-0">
            {loading && (
              <div className="flex justify-center py-12">
                <Loader2 className="h-8 w-8 animate-spin text-teal-600" />
              </div>
            )}

            {error && (
              <div className="p-4 bg-red-50 text-red-700 rounded-md mb-6 border border-red-200">
                Error: {error}
              </div>
            )}

            {!loading && !error && (
              query.trim() ? (
                <Tabs defaultValue="freelancers" className="w-full">
                  <TabsList className="mb-6 bg-slate-100 p-1">
                    <TabsTrigger value="freelancers" className="px-6 py-2 rounded-sm data-[state=active]:bg-white data-[state=active]:shadow-sm">
                      Freelancers ({filteredFreelancers.length})
                    </TabsTrigger>
                    <TabsTrigger value="jobs" className="px-6 py-2 rounded-sm data-[state=active]:bg-white data-[state=active]:shadow-sm">
                      Jobs ({filteredJobs.length})
                    </TabsTrigger>
                  </TabsList>

                  <TabsContent value="freelancers" className="space-y-4">
                    {filteredFreelancers.length === 0 ? (
                      <div className="bg-white border border-slate-200 rounded-lg p-12 text-center shadow-sm">
                        <p className="text-slate-500">No freelancers found matching "{query}".</p>
                      </div>
                    ) : (
                      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                        {filteredFreelancers.map((freelancer) => (
                          <Card key={freelancer.id} className="shadow-sm border-slate-200 hover:shadow-md transition-shadow flex flex-col">
                            <CardHeader className="flex flex-row items-center gap-4">
                              <Avatar className="h-12 w-12">
                                <AvatarImage src={freelancer.avatar_url || ""} />
                                <AvatarFallback><User className="w-6 h-6 text-slate-400" /></AvatarFallback>
                              </Avatar>
                              <div className="overflow-hidden flex-1">
                                <CardTitle className="text-lg truncate">{freelancer.name}</CardTitle>
                                <p className="text-sm text-slate-500 truncate">
                                  {freelancer.headline || freelancer.bio || "No bio available"}
                                </p>
                              </div>
                              <SaveButton itemType="freelancer" itemId={freelancer.id} />
                            </CardHeader>
                            <CardContent className="flex flex-1 flex-col">
                              {freelancer.location && (
                                <p className="mb-3 text-sm text-slate-500">{freelancer.location}</p>
                              )}
                              <div className="flex flex-wrap gap-2 mt-2">
                                {freelancer.skills.slice(0, 6).map((skill) => (
                                  <Badge key={skill} variant="secondary" className="bg-slate-100 text-slate-700 hover:bg-slate-200">{skill}</Badge>
                                ))}
                              </div>
                              <Button
                                onClick={() => navigate(`/freelancer/${freelancer.id}`)}
                                className="w-full mt-6 text-teal-700 bg-teal-50 hover:bg-teal-100 border-0"
                                variant="outline"
                              >
                                View Profile
                              </Button>
                            </CardContent>
                          </Card>
                        ))}
                      </div>
                    )}
                  </TabsContent>

                  <TabsContent value="jobs" className="space-y-4">
                    {filteredJobs.length === 0 ? (
                      <div className="bg-white border border-slate-200 rounded-lg p-12 text-center shadow-sm">
                        <p className="text-slate-500">No jobs found matching "{query}".</p>
                      </div>
                    ) : (
                      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
                        {filteredJobs.map((job) => (
                          <Card key={job.id} className="shadow-sm border-slate-200 hover:shadow-md transition-shadow">
                            <CardHeader>
                              <CardTitle className="flex justify-between items-start text-lg">
                                <span className="truncate pr-4">{job.title}</span>
                                <span className="text-teal-700 font-bold flex-shrink-0">${job.budget}</span>
                              </CardTitle>
                            </CardHeader>
                            <CardContent>
                              <p className="text-slate-600 line-clamp-2 mb-4">{job.description}</p>
                              <div className="flex flex-wrap gap-2 mb-6">
                                {job.required_skills.map((skill) => (
                                  <Badge key={skill} variant="outline" className="border-slate-200 text-slate-600">{skill}</Badge>
                                ))}
                              </div>
                              <div className="flex gap-2">
                                <Button
                                  onClick={() => navigate(`/job/${job.id}`)}
                                  className="flex-1 bg-slate-900 text-white hover:bg-slate-800"
                                >
                                  View &amp; Apply
                                </Button>
                                <SaveButton itemType="job" itemId={job.id} className="h-10 w-10" />
                              </div>
                            </CardContent>
                          </Card>
                        ))}
                      </div>
                    )}
                  </TabsContent>
                </Tabs>
              ) : (
                <div className="rounded-lg border border-dashed border-slate-300 bg-slate-50 p-12 text-center text-slate-500">
                  Enter a skill or project type to start searching.
                </div>
              )
            )}
          </div>
        </div>
      </div>
    </AppShell>
  );
};

export default Search;
