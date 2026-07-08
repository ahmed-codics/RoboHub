import AppShell from "@/components/layout/AppShell";
import Hero from "@/components/landing/Hero";
import ServiceCategories from "@/components/landing/ServiceCategories";
import FeaturedFreelancers from "@/components/landing/featured/FeaturedFreelancers";
import { CheckCircle2, Cpu, Zap, Activity } from "lucide-react";
import { Link } from "react-router-dom";

const CAPABILITIES = [
  "Computer Vision", "SLAM", "Kinematics", "PCB Layout", "Arduino", 
  "ROS2", "Machine Learning", "Embedded C", "Control Systems", "Sensor Fusion"
];

const Landing = () => {
  return (
    <AppShell>
      <div className="flex flex-col">
        <Hero />
        
        {/* Infinite Marquee of Capabilities */}
        <section className="py-6 bg-white border-y border-slate-200 overflow-hidden relative">
          <div className="flex w-max animate-marquee gap-12 pr-12">
            {[...CAPABILITIES, ...CAPABILITIES].map((cap, i) => (
              <span key={`${cap}-${i}`} className="text-sm font-bold text-slate-400 whitespace-nowrap uppercase tracking-[0.18em] sm:text-base md:text-lg">
                {cap}
              </span>
            ))}
          </div>
          {/* Gradient masks for smooth fade on edges */}
          <div className="absolute inset-y-0 left-0 w-16 bg-gradient-to-r from-white to-transparent pointer-events-none md:w-32" />
          <div className="absolute inset-y-0 right-0 w-16 bg-gradient-to-l from-white to-transparent pointer-events-none md:w-32" />
        </section>

        {/* The Mission Control (How it Works) */}
        <section className="py-24 bg-slate-50 relative overflow-hidden">
            <div className="container mx-auto px-4 relative z-10">
                <div className="text-center mb-20">
                    <h2 className="text-4xl md:text-5xl font-extrabold mb-4 text-slate-900 tracking-tight">The Mission Control</h2>
                    <p className="text-xl text-slate-500 max-w-2xl mx-auto">From idea to deployment, we provide the infrastructure for building advanced robotics.</p>
                </div>
                
                <div className="max-w-4xl mx-auto relative">
                    {/* Center Trace Line */}
                    <div className="hidden md:block absolute top-0 bottom-0 left-1/2 w-px bg-slate-200 -translate-x-1/2"></div>

                    {/* Steps */}
                    {[
                        { title: "Draft Spec", desc: "Define your requirements and budget.", icon: <Cpu className="w-6 h-6" /> },
                        { title: "Match Expert", desc: "Our algorithm finds the perfect engineer.", icon: <Activity className="w-6 h-6" /> },
                        { title: "Build Hardware", desc: "Collaborate, review schematics, and build.", icon: <Zap className="w-6 h-6" /> },
                        { title: "Deploy & Ship", desc: "Receive the deliverables and launch.", icon: <CheckCircle2 className="w-6 h-6" /> }
                    ].map((step, idx) => (
                       <div key={idx} className={`relative flex items-center mb-16 md:mb-24 ${idx % 2 === 0 ? 'md:justify-start' : 'md:justify-end'}`}>
                          {/* Timeline node */}
                          <div className="hidden md:flex absolute left-1/2 -translate-x-1/2 w-12 h-12 bg-white border border-slate-200 rounded-full items-center justify-center z-10 shadow-sm text-teal-600">
                             {step.icon}
                          </div>
                          
                          {/* Card */}
                          <div className={`w-full md:w-[45%] ${idx % 2 === 0 ? 'md:pr-12' : 'md:pl-12'}`}>
                              <div className="bg-white p-8 rounded-lg shadow-sm border border-slate-200 hover:-translate-y-1 transition-transform duration-300">
                                  <div className="flex items-center gap-4 mb-4">
                                      <div className="md:hidden w-10 h-10 bg-teal-50 rounded-md flex items-center justify-center text-teal-600">
                                          {step.icon}
                                      </div>
                                      <h3 className="text-2xl font-bold text-slate-900">{step.title}</h3>
                                  </div>
                                  <p className="text-slate-600 font-medium text-lg">{step.desc}</p>
                              </div>
                          </div>
                       </div>
                    ))}
                </div>
            </div>
        </section>

        <ServiceCategories />
        <FeaturedFreelancers />

        {/* Value Proposition / CTA */}
        <section className="py-24 relative overflow-hidden bg-white border-t border-slate-200">
          <div className="container mx-auto px-4 text-center relative z-10">
            <h2 className="text-3xl md:text-5xl font-extrabold mb-6 text-slate-900 tracking-tight">Built for the future of robotics</h2>
            <p className="text-xl text-slate-600 mb-10 max-w-2xl mx-auto">
              Join the fastest growing community of robotics experts and clients.
              Start building the future today.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link to="/search" className="bg-teal-600 text-white px-8 py-4 rounded-md font-bold shadow-sm hover:bg-teal-700 transition-colors text-lg">
                Find Talent
              </Link>
              <Link to="/jobs" className="bg-white text-slate-700 border border-slate-200 px-8 py-4 rounded-md font-bold hover:bg-slate-50 transition-colors shadow-sm text-lg">
                Find Work
              </Link>
            </div>
          </div>
        </section>
      </div>
    </AppShell>
  );
};

export default Landing;
