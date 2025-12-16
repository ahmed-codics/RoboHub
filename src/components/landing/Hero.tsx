import { Button } from "@/components/ui/button";
import { Link, useNavigate } from "react-router-dom";
import { Search, ShieldCheck, Zap, Globe } from "lucide-react";
import { useState } from "react";

const Hero = () => {
    const navigate = useNavigate();
    const [query, setQuery] = useState("");

    const handleSearch = (e: React.FormEvent) => {
        e.preventDefault();
        if (query.trim()) {
            navigate(`/search?q=${encodeURIComponent(query)}`);
        }
    };

    return (
        <section className="relative overflow-hidden bg-background pt-16 md:pt-24 pb-12 md:pb-20">
            <div className="container mx-auto px-4 relative z-10">
                <div className="max-w-4xl mx-auto text-center space-y-8">
                    <h1 className="text-4xl md:text-6xl lg:text-7xl font-bold tracking-tight text-foreground leading-[1.1]">
                        Hire the best
                        <span className="bg-gradient-to-r from-primary to-blue-600 bg-clip-text text-transparent px-2">
                            Robotics Experts
                        </span>
                        for any job, online.
                    </h1>

                    <p className="text-xl md:text-2xl text-muted-foreground max-w-2xl mx-auto leading-relaxed">
                        The world's largest marketplace for freelance robotics engineers, ROS developers, and automation specialists.
                    </p>

                    {/* Search Box */}
                    <form onSubmit={handleSearch} className="max-w-2xl mx-auto relative group">
                        <div className="absolute inset-0 bg-gradient-to-r from-primary/20 to-blue-600/20 blur-xl opacity-0 group-hover:opacity-100 transition-opacity duration-500 rounded-full" />
                        <div className="relative flex items-center bg-card border border-input rounded-full p-2 pl-6 shadow-lg hover:shadow-xl transition-shadow">
                            <input
                                type="text"
                                value={query}
                                onChange={(e) => setQuery(e.target.value)}
                                placeholder="What service are you looking for?"
                                className="flex-1 bg-transparent border-none text-lg focus:outline-none focus:ring-0 placeholder:text-muted-foreground/60"
                            />
                            <Button type="submit" size="lg" className="rounded-full px-8 h-12 text-base shadow-md">
                                <Search className="mr-2 h-4 w-4" />
                                Search
                            </Button>
                        </div>
                        <div className="flex gap-4 mt-4 justify-center text-sm text-muted-foreground">
                            <span>Popular:</span>
                            <button type="button" onClick={() => navigate('/search?q=ROS2')} className="hover:text-primary hover:underline">ROS2 Navigation</button>
                            <button type="button" onClick={() => navigate('/search?q=PCB')} className="hover:text-primary hover:underline">PCB Design</button>
                            <button type="button" onClick={() => navigate('/search?q=Drone')} className="hover:text-primary hover:underline">Drone Control</button>
                        </div>
                    </form>

                    {/* Trust Badges */}
                    <div className="pt-12 flex flex-wrap justify-center gap-8 md:gap-16 text-muted-foreground">
                        <div className="flex items-center gap-2">
                            <ShieldCheck className="w-5 h-5 text-green-600" />
                            <span className="font-medium">Vetted Experts</span>
                        </div>
                        <div className="flex items-center gap-2">
                            <Zap className="w-5 h-5 text-amber-500" />
                            <span className="font-medium">Fast Matching</span>
                        </div>
                        <div className="flex items-center gap-2">
                            <Globe className="w-5 h-5 text-blue-500" />
                            <span className="font-medium">Global Talent</span>
                        </div>
                    </div>
                </div>
            </div>

            {/* Decorative background elements */}
            <div className="absolute top-0 left-0 w-full h-full overflow-hidden -z-10 opacity-30 pointer-events-none">
                <div className="absolute -top-20 -left-20 w-96 h-96 bg-primary/20 rounded-full blur-[100px]" />
                <div className="absolute top-40 right-0 w-72 h-72 bg-blue-500/20 rounded-full blur-[80px]" />
            </div>
        </section>
    );
};

export default Hero;
