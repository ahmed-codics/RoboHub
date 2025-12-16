import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import logoImage from "@/assets/logo.png";
import { Menu, Search } from "lucide-react";
import {
    Sheet,
    SheetContent,
    SheetTrigger,
} from "@/components/ui/sheet";

const Navbar = () => {
    return (
        <header className="border-b border-border/40 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 sticky top-0 z-50">
            <div className="container mx-auto px-4 h-16 flex items-center justify-between gap-4">
                {/* Logo and Desktop Nav */}
                <div className="flex items-center gap-6 md:gap-8">
                    <Link to="/" className="flex items-center gap-2">
                        <img src={logoImage} alt="RemoteRobotics" className="h-8 w-8" />
                        <span className="text-xl font-bold text-foreground">RemoteRobotics</span>
                    </Link>

                    <nav className="hidden md:flex items-center gap-6 text-sm font-medium">
                        <Link to="/jobs" className="text-muted-foreground hover:text-foreground transition-colors">
                            Find Talent
                        </Link>
                        <Link to="/jobs" className="text-muted-foreground hover:text-foreground transition-colors">
                            Find Work
                        </Link>
                        <Link to="/partners" className="text-muted-foreground hover:text-foreground transition-colors">
                            Why Us
                        </Link>
                        <Link to="/partners" className="text-muted-foreground hover:text-foreground transition-colors">
                            Enterprise
                        </Link>
                    </nav>
                </div>

                {/* Search Bar (Hidden on mobile) */}
                <div className="hidden lg:flex max-w-sm w-full relative">
                    <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                    <input
                        type="search"
                        placeholder="Search for talent or jobs..."
                        className="w-full bg-secondary/50 border border-input rounded-full py-2 pl-9 pr-4 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all"
                    />
                </div>

                {/* Auth Buttons */}
                <div className="flex items-center gap-2 md:gap-4">
                    <div className="hidden md:flex items-center gap-2">
                        <Link to="/auth">
                            <Button variant="ghost" className="text-sm font-medium">
                                Log In
                            </Button>
                        </Link>
                        <Link to="/auth">
                            <Button className="rounded-full px-6 font-semibold">Sign Up</Button>
                        </Link>
                    </div>

                    {/* Mobile Menu */}
                    <Sheet>
                        <SheetTrigger asChild>
                            <Button variant="ghost" size="icon" className="md:hidden">
                                <Menu className="h-5 w-5" />
                            </Button>
                        </SheetTrigger>
                        <SheetContent>
                            <div className="flex flex-col gap-4 mt-8">
                                <Link to="/jobs" className="text-lg font-medium">Find Talent</Link>
                                <Link to="/jobs" className="text-lg font-medium">Find Work</Link>
                                <Link to="/partners" className="text-lg font-medium">Why Us</Link>
                                <hr className="border-border" />
                                <Link to="/auth">
                                    <Button variant="outline" className="w-full justify-start">Log In</Button>
                                </Link>
                                <Link to="/auth">
                                    <Button className="w-full">Sign Up</Button>
                                </Link>
                            </div>
                        </SheetContent>
                    </Sheet>
                </div>
            </div>
        </header>
    );
};

export default Navbar;
