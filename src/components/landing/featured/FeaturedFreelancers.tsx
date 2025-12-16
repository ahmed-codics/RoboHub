import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter, CardHeader } from "@/components/ui/card";
import { Star, BadgeCheck } from "lucide-react";

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
        <section className="py-20 bg-background">
            <div className="container mx-auto px-4">
                <div className="flex justify-between items-end mb-12">
                    <div>
                        <h2 className="text-3xl font-bold mb-2">Top Rated Talent</h2>
                        <p className="text-muted-foreground">Work with the best engineers in the field</p>
                    </div>
                    <Button variant="outline" className="hidden md:flex">See All Experts</Button>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                    {freelancers.map((freelancer, idx) => (
                        <Card key={idx} className="hover:shadow-xl transition-all duration-300 border-border/50">
                            <CardHeader className="flex flex-row items-center gap-4 pb-2">
                                <Avatar className="h-14 w-14 border-2 border-primary/10">
                                    <AvatarImage src={freelancer.image} />
                                    <AvatarFallback className="bg-primary/5 text-primary font-semibold">{freelancer.initials}</AvatarFallback>
                                </Avatar>
                                <div>
                                    <h3 className="font-semibold text-lg flex items-center gap-2">
                                        {freelancer.name}
                                        <BadgeCheck className="w-4 h-4 text-blue-600" />
                                    </h3>
                                    <p className="text-sm text-muted-foreground">{freelancer.title}</p>
                                </div>
                            </CardHeader>
                            <CardContent className="pt-4">
                                <div className="flex items-center gap-2 mb-4">
                                    <Star className="w-4 h-4 fill-yellow-400 text-yellow-400" />
                                    <span className="font-medium">{freelancer.rating}</span>
                                    <span className="text-muted-foreground">rating</span>
                                    <div className="h-4 w-[1px] bg-border mx-2" />
                                    <span className="font-medium">{freelancer.rate}</span>
                                </div>
                                <div className="flex flex-wrap gap-2">
                                    {freelancer.skills.map(skill => (
                                        <span key={skill} className="px-3 py-1 bg-secondary text-secondary-foreground text-xs rounded-full font-medium">
                                            {skill}
                                        </span>
                                    ))}
                                </div>
                            </CardContent>
                            <CardFooter>
                                <Button className="w-full text-sm font-semibold" variant="outline">View Profile</Button>
                            </CardFooter>
                        </Card>
                    ))}
                </div>
            </div>
        </section>
    );
};

export default FeaturedFreelancers;
