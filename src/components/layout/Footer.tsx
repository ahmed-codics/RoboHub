import logoImage from "@/assets/logo.png";
import { Link } from "react-router-dom";
import { Github, Twitter, Linkedin, Facebook } from "lucide-react";

const Footer = () => {
    return (
        <footer className="bg-foreground text-zinc-300 pt-16 pb-8 text-sm">
            <div className="container mx-auto px-4">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-8 mb-12">
                    <div className="lg:col-span-2">
                        <Link to="/" className="flex items-center gap-2 mb-4">
                            <img src={logoImage} alt="RemoteRobotics" className="h-8 w-8 brightness-0 invert" />
                            <span className="text-xl font-bold text-white">RemoteRobotics</span>
                        </Link>
                        <p className="max-w-xs text-zinc-400 mb-6">
                            The premier marketplace for remote robotics work. Connecting top-tier engineers with innovative companies worldwide.
                        </p>
                        <div className="flex gap-4">
                            <a href="#" className="p-2 bg-white/5 rounded-full hover:bg-white/10 transition-colors"><Twitter className="w-4 h-4" /></a>
                            <a href="#" className="p-2 bg-white/5 rounded-full hover:bg-white/10 transition-colors"><Linkedin className="w-4 h-4" /></a>
                            <a href="#" className="p-2 bg-white/5 rounded-full hover:bg-white/10 transition-colors"><Github className="w-4 h-4" /></a>
                            <a href="#" className="p-2 bg-white/5 rounded-full hover:bg-white/10 transition-colors"><Facebook className="w-4 h-4" /></a>
                        </div>
                    </div>

                    <div>
                        <h3 className="font-semibold text-white mb-4">For Clients</h3>
                        <ul className="space-y-3">
                            <li><Link to="/jobs" className="hover:text-white transition-colors">Find Talent</Link></li>
                            <li><Link to="#" className="hover:text-white transition-colors">Enterprise Solutions</Link></li>
                            <li><Link to="#" className="hover:text-white transition-colors">Case Studies</Link></li>
                            <li><Link to="#" className="hover:text-white transition-colors">Partnership</Link></li>
                        </ul>
                    </div>

                    <div>
                        <h3 className="font-semibold text-white mb-4">For Talent</h3>
                        <ul className="space-y-3">
                            <li><Link to="/jobs" className="hover:text-white transition-colors">Find Work</Link></li>
                            <li><Link to="#" className="hover:text-white transition-colors">Community</Link></li>
                            <li><Link to="#" className="hover:text-white transition-colors">Events</Link></li>
                            <li><Link to="#" className="hover:text-white transition-colors">Resources</Link></li>
                        </ul>
                    </div>

                    <div>
                        <h3 className="font-semibold text-white mb-4">Company</h3>
                        <ul className="space-y-3">
                            <li><Link to="#" className="hover:text-white transition-colors">About Us</Link></li>
                            <li><Link to="#" className="hover:text-white transition-colors">Careers</Link></li>
                            <li><Link to="#" className="hover:text-white transition-colors">Privacy Policy</Link></li>
                            <li><Link to="#" className="hover:text-white transition-colors">Terms of Service</Link></li>
                        </ul>
                    </div>
                </div>

                <div className="border-t border-white/10 pt-8 flex flex-col md:flex-row justify-between items-center gap-4">
                    <p>© 2025 RemoteRobotics Inc. All rights reserved.</p>
                    <div className="flex gap-6">
                        <span>USD</span>
                        <span>English</span>
                    </div>
                </div>
            </div>
        </footer>
    );
};

export default Footer;
