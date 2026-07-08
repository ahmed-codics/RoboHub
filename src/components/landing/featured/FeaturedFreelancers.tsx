import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter, CardHeader } from "@/components/ui/card";
import { Star, BadgeCheck } from "lucide-react";
import { Link } from "react-router-dom";

const freelancers = [
    {
        name: "Alex M.",
        title: "Senior Robotics SW Engineer",
        rating: "5.0/5",
        rate: "$80/hr",
        image: "/placeholder-avatar.jpg",
        skills: ["ROS2", "C++", "Python"],
        initials: "AM"
    },
    {
        name: "Sarah K.",
        title: "Embedded Systems Expert",
        rating: "4.9/5",
        rate: "$65/hr",
        image: "/placeholder-avatar-2.jpg",
        skills: ["STM32", "PCB Design", "Altium"],
        initials: "SK"
    },
    {
        name: "David R.",
        title: "Computer Vision Specialist",
        rating: "4.9/5",
        rate: "$95/hr",
        image: "/placeholder-avatar-3.jpg",
        skills: ["SLAM", "OpenCV", "PyTorch"],
        initials: "DR"
    }
];

const FeaturedFreelancers = () => {
    return (
        <section className="py-20 bg-slate-50">
            <div className="container mx-auto px-4">
                <div className="flex justify-between items-end mb-12">
                    <div>
                        <h2 className="text-3xl font-extrabold mb-2 text-slate-900">Top Rated Talent</h2>
                        <p className="text-slate-600">Work with the best engineers in the field</p>
                    </div>
                    <Link to="/search">
                        <Button variant="outline" className="hidden md:flex rounded-xl font-bold text-slate-700 border-slate-300 bg-white hover:border-teal-400 hover:bg-slate-50 transition-all duration-300 hover:-translate-y-1 shadow-sm">See All Experts</Button>
                    </Link>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                    {freelancers.map((freelancer, idx) => (
                        <Card key={idx} className="bg-white border border-slate-200 shadow-md rounded-3xl hover:shadow-2xl transition-all duration-500 hover:-translate-y-2 hover:border-emerald-300 relative overflow-hidden group">
                            {/* Holographic Gloss Sweep */}
                            <div className="absolute top-0 -left-[100%] w-[50%] h-full bg-gradient-to-r from-transparent via-white/60 to-transparent skew-x-[-20deg] group-hover:left-[200%] transition-all duration-1000 ease-in-out z-10 pointer-events-none" />
                            
                            <CardHeader className="flex flex-row items-center gap-4 pb-2 relative z-0">
                                <Avatar className="h-14 w-14 border-2 border-teal-100">
                                    <AvatarImage src={freelancer.image} />
                                    <AvatarFallback className="bg-teal-50 text-teal-600 font-bold">{freelancer.initials}</AvatarFallback>
                                </Avatar>
                                <div>
                                    <h3 className="font-bold text-lg flex items-center gap-2 text-slate-900">
                                        {freelancer.name}
                                        <BadgeCheck className="w-4 h-4 text-emerald-500" />
                                    </h3>
                                    <p className="text-sm text-slate-500 font-medium">{freelancer.title}</p>
                                </div>
                            </CardHeader>
                            <CardContent className="pt-4 relative z-0">
                                <div className="flex items-center gap-2 mb-4 text-slate-600">
                                    <Star className="w-4 h-4 fill-amber-400 text-amber-400" />
                                    <span className="font-bold text-slate-800">{freelancer.rating}</span>
                                    <span className="text-sm">rating</span>
                                    <div className="h-4 w-[1px] bg-slate-200 mx-2" />
                                    <span className="font-bold text-slate-800">{freelancer.rate}</span>
                                </div>
                                <div className="flex flex-wrap gap-2">
                                    {freelancer.skills.map(skill => (
                                        <span key={skill} className="inline-flex items-center px-4 py-1.5 rounded-full border border-slate-200 bg-white shadow-sm text-xs font-bold text-slate-500 tracking-wide uppercase">
                                            {skill}
                                        </span>
                                    ))}
                                </div>
                            </CardContent>
                            <CardFooter className="relative z-0">
                                <Button asChild className="w-full text-sm font-bold text-slate-700 border border-slate-300 bg-white rounded-xl shadow-sm hover:border-teal-400 hover:bg-slate-50 transition-all duration-300" variant="outline">
                                    <Link to={`/search?q=${encodeURIComponent(freelancer.skills[0])}`}>View Profile</Link>
                                </Button>
                            </CardFooter>
                        </Card>
                    ))}
                </div>
            </div>
        </section>
    );
};

export default FeaturedFreelancers;
