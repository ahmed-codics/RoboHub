import { useEffect, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import AppShell from "@/components/layout/AppShell";
import { useSearch } from "@/hooks/useSearch";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Loader2, Search as SearchIcon, User, Filter } from "lucide-react";

const Search = () => {
    const [searchParams] = useSearchParams();
    const navigate = useNavigate();
    const query = searchParams.get("q") || "";
    const [searchInput, setSearchInput] = useState(query);
    const { freelancers, jobs, loading, error } = useSearch(query);

    useEffect(() => {
        setSearchInput(query);
    }, [query]);

    const handleSearch = (event: React.FormEvent<HTMLFormElement>) => {
        event.preventDefault();
        const trimmedQuery = searchInput.trim();
        navigate(trimmedQuery ? `/search?q=${encodeURIComponent(trimmedQuery)}` : "/search");
    };

    return (
        <AppShell>
            <div className="container mx-auto px-4 py-8 max-w-7xl">
                {/* Search Header */}
                <div className="mb-8 rounded-lg border border-slate-200 bg-white p-6 shadow-sm">
                    <h1 className="text-3xl font-bold text-slate-900 tracking-tight">Search robotics talent and jobs</h1>
                    <p className="mt-2 text-slate-500">
                        Try skills, platforms, project types, or job titles.
                    </p>
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
                    {/* Filters Sidebar (Left Column) */}
                    <div className="w-full lg:w-64 flex-shrink-0">
                        <div className="bg-white border border-slate-200 rounded-lg p-5 shadow-sm sticky top-24">
                            <div className="flex items-center gap-2 mb-4">
                                <Filter className="w-4 h-4 text-slate-500" />
                                <h2 className="font-bold text-slate-900">Filters</h2>
                            </div>
                            <div className="space-y-4">
                                <div>
                                    <h3 className="text-sm font-semibold text-slate-700 mb-2">Category</h3>
                                    <div className="space-y-2">
                                        <label className="flex items-center gap-2 text-sm text-slate-600"><input type="checkbox" className="rounded text-teal-600 focus:ring-teal-500" /> Software</label>
                                        <label className="flex items-center gap-2 text-sm text-slate-600"><input type="checkbox" className="rounded text-teal-600 focus:ring-teal-500" /> Hardware</label>
                                        <label className="flex items-center gap-2 text-sm text-slate-600"><input type="checkbox" className="rounded text-teal-600 focus:ring-teal-500" /> Mechanical</label>
                                    </div>
                                </div>
                                <hr className="border-slate-100" />
                                <div>
                                    <h3 className="text-sm font-semibold text-slate-700 mb-2">Experience Level</h3>
                                    <div className="space-y-2">
                                        <label className="flex items-center gap-2 text-sm text-slate-600"><input type="checkbox" className="rounded text-teal-600 focus:ring-teal-500" /> Expert</label>
                                        <label className="flex items-center gap-2 text-sm text-slate-600"><input type="checkbox" className="rounded text-teal-600 focus:ring-teal-500" /> Intermediate</label>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Results Area (Right Column) */}
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
                                        Freelancers ({freelancers.length})
                                    </TabsTrigger>
                                    <TabsTrigger value="jobs" className="px-6 py-2 rounded-sm data-[state=active]:bg-white data-[state=active]:shadow-sm">
                                        Jobs ({jobs.length})
                                    </TabsTrigger>
                                </TabsList>

                                <TabsContent value="freelancers" className="space-y-4">
                                    {freelancers.length === 0 ? (
                                        <div className="bg-white border border-slate-200 rounded-lg p-12 text-center shadow-sm">
                                            <p className="text-slate-500">No freelancers found matching "{query}".</p>
                                        </div>
                                    ) : (
                                        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                                            {freelancers.map((freelancer) => (
                                                <Card key={freelancer.id} className="shadow-sm border-slate-200 hover:shadow-md transition-shadow">
                                                    <CardHeader className="flex flex-row items-center gap-4">
                                                        <Avatar className="h-12 w-12">
                                                            <AvatarImage src={freelancer.avatar_url || ""} />
                                                            <AvatarFallback><User className="w-6 h-6 text-slate-400" /></AvatarFallback>
                                                        </Avatar>
                                                        <div className="overflow-hidden">
                                                            <CardTitle className="text-lg truncate">{freelancer.name}</CardTitle>
                                                            <p className="text-sm text-slate-500 truncate">
                                                                {freelancer.headline || freelancer.bio || "No bio available"}
                                                            </p>
                                                        </div>
                                                    </CardHeader>
                                                    <CardContent>
                                                        {freelancer.location && (
                                                            <p className="mb-3 text-sm text-slate-500">{freelancer.location}</p>
                                                        )}
                                                        <div className="flex flex-wrap gap-2 mt-2">
                                                            {freelancer.skills.map(skill => (
                                                                <Badge key={skill} variant="secondary" className="bg-slate-100 text-slate-700 hover:bg-slate-200">{skill}</Badge>
                                                            ))}
                                                        </div>
                                                        <Button className="w-full mt-6 text-teal-700 bg-teal-50 hover:bg-teal-100 border-0" variant="outline">View Profile</Button>
                                                    </CardContent>
                                                </Card>
                                            ))}
                                        </div>
                                    )}
                                </TabsContent>

                                <TabsContent value="jobs" className="space-y-4">
                                    {jobs.length === 0 ? (
                                        <div className="bg-white border border-slate-200 rounded-lg p-12 text-center shadow-sm">
                                            <p className="text-slate-500">No jobs found matching "{query}".</p>
                                        </div>
                                    ) : (
                                        <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
                                            {jobs.map((job) => (
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
                                                            {job.required_skills.map(skill => (
                                                                <Badge key={skill} variant="outline" className="border-slate-200 text-slate-600">{skill}</Badge>
                                                            ))}
                                                        </div>
                                                        <Button className="w-full bg-slate-900 text-white hover:bg-slate-800">Apply Now</Button>
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
