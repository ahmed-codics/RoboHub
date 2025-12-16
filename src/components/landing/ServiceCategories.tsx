import { Card, CardContent } from "@/components/ui/card";
import { Cpu, Bot, Code, Globe, PenTool, Database, Radio, Camera } from "lucide-react";

const categories = [
    { icon: Bot, title: "Robotics Software", skills: "ROS, Gazebo, Navigation" },
    { icon: Cpu, title: "Embedded Systems", skills: "Arduino, STM32, ESP32" },
    { icon: Code, title: "Control Systems", skills: "PID, MPC, LQR" },
    { icon: Camera, title: "Computer Vision", skills: "OpenCV, YOLO, SLAM" },
    { icon: PenTool, title: "Mechanical Design", skills: "SolidWorks, Fusion360" },
    { icon: Radio, title: "IoT & Networking", skills: "MQTT, WiFi, LoRa" },
    { icon: Database, title: "Data Analysis", skills: "Python, MATLAB" },
    { icon: Globe, title: "Web Interfaces", skills: "React, WebSock, Nodes" },
];

const ServiceCategories = () => {
    return (
        <section className="py-20 bg-secondary/30">
            <div className="container mx-auto px-4">
                <h2 className="text-3xl font-bold mb-12 text-foreground">Explore by Category</h2>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    {categories.map((cat, idx) => (
                        <Card key={idx} className="hover:shadow-lg transition-shadow cursor-pointer border-none shadow-sm hover:border-primary/20 hover:border">
                            <CardContent className="flex flex-col items-start p-6">
                                <cat.icon className="w-8 h-8 text-primary mb-4" />
                                <h3 className="font-semibold text-lg mb-1">{cat.title}</h3>
                                <p className="text-sm text-muted-foreground">{cat.skills}</p>
                            </CardContent>
                        </Card>
                    ))}
                </div>
            </div>
        </section>
    );
};

export default ServiceCategories;
