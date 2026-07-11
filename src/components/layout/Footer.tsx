import { Link } from "react-router-dom";
import { Bot, Github, Twitter, Linkedin, Facebook } from "lucide-react";

const Footer = () => {
    return (
        <footer className="bg-foreground text-zinc-300 pt-16 pb-8 text-sm">
            <div className="container mx-auto px-4">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-8 mb-12">
                    <div className="lg:col-span-2">
                        <Link to="/" className="flex items-center gap-2 mb-4">
                            <span className="grid h-8 w-8 place-items-center rounded bg-teal-600 text-white">
                                <Bot className="h-5 w-5" />
                            </span>
                            <span className="text-xl font-bold text-white tracking-tight">RemoteRobotics</span>
                        </Link>
                        <p className="max-w-xs text-zinc-400 mb-6">
                            The premier marketplace for remote robotics work. Connecting top-tier engineers with innovative companies worldwide.
                        </p>
                        <div className="flex gap-4">
                            <a href="https://twitter.com" aria-label="Twitter" className="p-2 bg-white/5 rounded-full hover:bg-white/10 transition-colors"><Twitter className="w-4 h-4" /></a>
                            <a href="https://linkedin.com" aria-label="LinkedIn" className="p-2 bg-white/5 rounded-full hover:bg-white/10 transition-colors"><Linkedin className="w-4 h-4" /></a>
                            <a href="https://github.com" aria-label="GitHub" className="p-2 bg-white/5 rounded-full hover:bg-white/10 transition-colors"><Github className="w-4 h-4" /></a>
                            <a href="https://facebook.com" aria-label="Facebook" className="p-2 bg-white/5 rounded-full hover:bg-white/10 transition-colors"><Facebook className="w-4 h-4" /></a>
                        </div>
                    </div>

                    <div>
                        <h3 className="font-semibold text-white mb-4">For Clients</h3>
                        <ul className="space-y-3">
                            <li><Link to="/search" className="hover:text-white transition-colors">Find Talent</Link></li>
                            <li><Link to="/services" className="hover:text-white transition-colors">Browse Services</Link></li>
                            <li><Link to="/partners" className="hover:text-white transition-colors">Partners</Link></li>
                            <li><Link to="/help" className="hover:text-white transition-colors">Help Center</Link></li>
                        </ul>
                    </div>

                    <div>
                        <h3 className="font-semibold text-white mb-4">For Talent</h3>
                        <ul className="space-y-3">
                            <li><Link to="/jobs" className="hover:text-white transition-colors">Find Work</Link></li>
                            <li><Link to="/services/new" className="hover:text-white transition-colors">Offer a Service</Link></li>
                            <li><Link to="/help" className="hover:text-white transition-colors">Resources</Link></li>
                            <li><Link to="/premium/checkout" className="hover:text-white transition-colors">Go Premium</Link></li>
                        </ul>
                    </div>

                    <div>
                        <h3 className="font-semibold text-white mb-4">Company</h3>
                        <ul className="space-y-3">
                            <li><Link to="/help" className="hover:text-white transition-colors">Help Center</Link></li>
                            <li><Link to="/privacy" className="hover:text-white transition-colors">Privacy Policy</Link></li>
                            <li><Link to="/terms" className="hover:text-white transition-colors">Terms of Service</Link></li>
                            <li><Link to="/cookies" className="hover:text-white transition-colors">Cookie Policy</Link></li>
                        </ul>
                    </div>
                </div>

                <div className="border-t border-white/10 pt-8 flex flex-col md:flex-row justify-between items-center gap-4">
                    <p>&copy; 2026 RemoteRobotics Inc. All rights reserved.</p>
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
