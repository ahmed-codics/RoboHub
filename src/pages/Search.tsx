import { useSearchParams } from "react-router-dom";
import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";
import { useSearch } from "@/hooks/useSearch";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Loader2, Briefcase, User } from "lucide-react";

const Search = () => {
    const [searchParams] = useSearchParams();
    const query = searchParams.get("q") || "";
    const { freelancers, jobs, loading, error } = useSearch(query);

    return (
        <div className="min-h-screen bg-background flex flex-col">
            <Navbar />

            <main className="flex-1 container mx-auto px-4 py-8">
                <h1 className="text-3xl font-bold mb-6">Search Results for "{query}"</h1>

                {loading && (
                    <div className="flex justify-center py-12">
                        <Loader2 className="h-8 w-8 animate-spin text-primary" />
                    </div>
                )}

                {error && (
                    <div className="p-4 bg-destructive/10 text-destructive rounded-md mb-6">
                        Error: {error}
                    </div>
                )}

                {!loading && !error && (
                    <Tabs defaultValue="freelancers" className="w-full">
                        <TabsList className="mb-6">
                            <TabsTrigger value="freelancers" className="text-lg px-6">
                                Freelancers ({freelancers.length})
                            </TabsTrigger>
                            <TabsTrigger value="jobs" className="text-lg px-6">
                                Jobs ({jobs.length})
                            </TabsTrigger>
                        </TabsList>

                        <TabsContent value="freelancers" className="space-y-4">
                            {freelancers.length === 0 ? (
                                <p className="text-muted-foreground text-center py-12">No freelancers found matching "{query}".</p>
                            ) : (
                                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                                    {freelancers.map((freelancer) => (
                                        <Card key={freelancer.id} className="hover:shadow-md transition-shadow">
                                            <CardHeader className="flex flex-row items-center gap-4">
                                                <Avatar className="h-12 w-12">
                                                    <AvatarImage src={freelancer.avatar_url || ""} />
                                                    <AvatarFallback><User /></AvatarFallback>
                                                </Avatar>
                                                <div>
                                                    <CardTitle className="text-lg">{freelancer.name}</CardTitle>
                                                    <p className="text-sm text-muted-foreground truncate max-w-[200px]">{freelancer.bio || "No bio available"}</p>
                                                </div>
                                            </CardHeader>
                                            <CardContent>
                                                <div className="flex flex-wrap gap-2 mt-2">
                                                    {freelancer.skills.map(skill => (
                                                        <Badge key={skill} variant="secondary">{skill}</Badge>
                                                    ))}
                                                </div>
                                                <Button className="w-full mt-4" variant="outline">View Profile</Button>
                                            </CardContent>
                                        </Card>
                                    ))}
                                </div>
                            )}
                        </TabsContent>

                        <TabsContent value="jobs" className="space-y-4">
                            {jobs.length === 0 ? (
                                <p className="text-muted-foreground text-center py-12">No jobs found matching "{query}".</p>
                            ) : (
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    {jobs.map((job) => (
                                        <Card key={job.id} className="hover:shadow-md transition-shadow">
                                            <CardHeader>
                                                <CardTitle className="flex justify-between items-start">
                                                    <span>{job.title}</span>
                                                    <span className="text-green-600 font-bold">${job.budget}</span>
                                                </CardTitle>
                                            </CardHeader>
                                            <CardContent>
                                                <p className="text-muted-foreground line-clamp-2 mb-4">{job.description}</p>
                                                <div className="flex flex-wrap gap-2 mb-4">
                                                    {job.required_skills.map(skill => (
                                                        <Badge key={skill} variant="outline">{skill}</Badge>
                                                    ))}
                                                </div>
                                                <Button className="w-full">Apply Now</Button>
                                            </CardContent>
                                        </Card>
                                    ))}
                                </div>
                            )}
                        </TabsContent>
                    </Tabs>
                )}
            </main>

            <Footer />
        </div>
    );
};

export default Search;
