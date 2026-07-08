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
        <section className="py-20 bg-white">
            <div className="container mx-auto px-4">
                <h2 className="text-3xl font-extrabold mb-12 text-slate-900">Explore by Category</h2>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    {categories.map((cat, idx) => (
                        <Card key={idx} className="bg-white border border-slate-200 shadow-md rounded-[2rem] hover:shadow-2xl transition-all duration-500 hover:-translate-y-2 hover:border-teal-300 cursor-pointer group">
                            <CardContent className="flex flex-col items-start p-6">
                                <cat.icon className="w-8 h-8 text-teal-500 mb-4 group-hover:scale-110 group-hover:rotate-12 transition-transform duration-300" />
                                <h3 className="font-semibold text-lg mb-1 text-slate-800">{cat.title}</h3>
                                <p className="text-sm text-slate-500">{cat.skills}</p>
                            </CardContent>
                        </Card>
                    ))}
                </div>
            </div>
        </section>
    );
};

export default ServiceCategories;
