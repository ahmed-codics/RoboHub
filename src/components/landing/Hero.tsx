import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";
import { Search, ShieldCheck, Zap, Globe, Cpu, Activity, Settings2 } from "lucide-react";
import { useState, useEffect } from "react";

const ROLES = [
    "Robotics Experts",
    "ROS2 Developers",
    "Drone Engineers",
    "Embedded Systems Pros",
    "Automation Specialists"
];

const Hero = () => {
    const navigate = useNavigate();
    const [query, setQuery] = useState("");
    const [roleIndex, setRoleIndex] = useState(0);

    useEffect(() => {
        const interval = setInterval(() => {
            setRoleIndex((prev) => (prev + 1) % ROLES.length);
        }, 3000);
        return () => clearInterval(interval);
    }, []);

    const handleSearch = (e: React.FormEvent) => {
        e.preventDefault();
        const trimmedQuery = query.trim();
        navigate(trimmedQuery ? `/search?q=${encodeURIComponent(trimmedQuery)}` : "/search");
    };

    return (
        <section className="relative overflow-hidden bg-slate-50 pt-16 md:pt-32 pb-12 md:pb-24">
            {/* Engineering Grid Background */}
            <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSI0MCIgaGVpZ2h0PSI0MCI+PGRlZnM+PHBhdHRlcm4gaWQ9ImdyaWQiIHdpZHRoPSI0MCIgaGVpZ2h0PSI0MCIgcGF0dGVyblVuaXRzPSJ1c2VyU3BhY2VPblVzZSI+PHBhdGggZD0iTSA0MCAwIEwgMCAwIDAgNDAiIGZpbGw9Im5vbmUiIHN0cm9rZT0iIzBlMTcyYSIgc3Ryb2tlLW9wYWNpdHk9IjAuMDUiLz48L3BhdHRlcm4+PC9kZWZzPjxyZWN0IHdpZHRoPSIxMDAlIiBoZWlnaHQ9IjEwMCUiIGZpbGw9InVybCgjZ3JpZCkiLz48L3N2Zz4=')] opacity-50" />

            {/* Floating Elements (Background) */}
            <div className="absolute inset-0 overflow-hidden pointer-events-none z-0 hidden lg:block">
                <div className="absolute top-[20%] left-[10%] animate-pulse-glow" style={{ animationDuration: '6s' }}>
                    <div className="bg-white/80 backdrop-blur-sm p-4 rounded-2xl shadow-xl border border-slate-200/50 flex items-center justify-center animate-fade-in-up" style={{ animationDelay: '0.2s', animationIterationCount: 'infinite', animationDirection: 'alternate' }}>
                        <Cpu className="w-8 h-8 text-teal-500" />
                    </div>
                </div>
                <div className="absolute top-[30%] right-[12%] animate-pulse-glow" style={{ animationDuration: '7s' }}>
                    <div className="bg-white/80 backdrop-blur-sm p-5 rounded-2xl shadow-xl border border-slate-200/50 flex items-center justify-center animate-fade-in-up" style={{ animationDelay: '0.5s', animationIterationCount: 'infinite', animationDirection: 'alternate' }}>
                        <Activity className="w-10 h-10 text-emerald-500" />
                    </div>
                </div>
                <div className="absolute bottom-[25%] left-[15%] animate-pulse-glow" style={{ animationDuration: '8s' }}>
                    <div className="bg-white/80 backdrop-blur-sm p-3 rounded-xl shadow-xl border border-slate-200/50 flex items-center justify-center animate-fade-in-up" style={{ animationDelay: '0.8s', animationIterationCount: 'infinite', animationDirection: 'alternate' }}>
                        <Settings2 className="w-6 h-6 text-teal-400" />
                    </div>
                </div>
            </div>

            <div className="container mx-auto px-4 relative z-10 animate-fade-in-up">
                <div className="max-w-4xl mx-auto text-center space-y-8">
                    <h1 className="text-4xl md:text-6xl lg:text-7xl font-extrabold tracking-tight text-slate-900 leading-[1.1]">
                        Hire the best <br className="hidden md:block" />
                        <span className="inline-block max-w-full md:min-w-[450px] text-center">
                            <span 
                                key={roleIndex}
                                className="bg-gradient-to-r from-teal-500 to-emerald-500 bg-clip-text text-transparent px-2 animate-fade-in-up inline-block"
                            >
                                {ROLES[roleIndex]}
                            </span>
                        </span>
                        <br className="hidden md:block" />
                        {" "}
                        for any job, online.
                    </h1>

                    <p className="text-xl md:text-2xl text-slate-600 max-w-2xl mx-auto leading-relaxed">
                        Find robotics engineers, ROS developers, and automation specialists for real-world hardware and software projects.
                    </p>

                    {/* Search Box */}
                    <form onSubmit={handleSearch} className="max-w-2xl mx-auto relative group">
                        <div className="absolute inset-0 bg-gradient-to-r from-teal-500/20 to-emerald-500/20 blur-xl opacity-0 group-hover:opacity-100 transition-opacity duration-500 rounded-2xl" />
                        <div className="relative flex flex-col gap-3 bg-white/95 backdrop-blur-md border border-slate-200 rounded-2xl p-3 shadow-lg hover:shadow-2xl transition-all duration-300 sm:flex-row sm:items-center">
                            <div className="flex min-w-0 flex-1 items-center gap-3 px-3">
                                <Search className="h-5 w-5 shrink-0 text-teal-500" />
                                <input
                                    type="text"
                                    value={query}
                                    onChange={(e) => setQuery(e.target.value)}
                                    placeholder="Try ROS2 navigation, PCB design, SLAM..."
                                    className="min-w-0 flex-1 bg-transparent border-none text-base focus:outline-none focus:ring-0 text-slate-800 placeholder:text-slate-400 md:text-lg"
                                />
                            </div>
                            <Button type="submit" size="lg" className="h-12 rounded-xl px-8 text-base font-bold text-white bg-gradient-to-r from-teal-500 to-emerald-500 shadow-lg shadow-teal-500/30 hover:shadow-teal-500/50 hover:-translate-y-1 transition-all duration-300 border-0">
                                Search
                            </Button>
                        </div>
                        <div className="flex flex-wrap gap-x-4 gap-y-2 mt-4 justify-center text-sm text-slate-500">
                            <span>Popular:</span>
                            <button type="button" onClick={() => navigate('/search?q=ROS2')} className="hover:text-teal-600 hover:underline">ROS2 Navigation</button>
                            <button type="button" onClick={() => navigate('/search?q=PCB')} className="hover:text-teal-600 hover:underline">PCB Design</button>
                            <button type="button" onClick={() => navigate('/search?q=Drone')} className="hover:text-teal-600 hover:underline">Drone Control</button>
                        </div>
                    </form>

                    {/* Trust Badges */}
                    <div className="pt-12 flex flex-wrap justify-center gap-8 md:gap-16 text-slate-500">
                        <div className="flex items-center gap-2">
                            <ShieldCheck className="w-5 h-5 text-emerald-500" />
                            <span className="font-bold text-slate-600">Vetted Experts</span>
                        </div>
                        <div className="flex items-center gap-2">
                            <Zap className="w-5 h-5 text-amber-500" />
                            <span className="font-bold text-slate-600">Fast Matching</span>
                        </div>
                        <div className="flex items-center gap-2">
                            <Globe className="w-5 h-5 text-teal-500" />
                            <span className="font-bold text-slate-600">Global Talent</span>
                        </div>
                    </div>
                </div>
            </div>

            {/* Decorative background elements */}
            <div className="absolute top-0 left-0 w-full h-full overflow-hidden -z-10 pointer-events-none">
                <div className="absolute -top-20 -left-20 w-[500px] h-[500px] bg-teal-400/20 rounded-full blur-[128px] animate-pulse-glow" />
                <div className="absolute top-40 right-0 w-[400px] h-[400px] bg-emerald-400/15 rounded-full blur-[128px] animate-pulse-glow" style={{ animationDelay: '1s' }} />
            </div>
        </section>
    );
};

export default Hero;
