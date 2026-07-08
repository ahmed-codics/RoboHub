import { Button } from "@/components/ui/button";
import { Link, useNavigate } from "react-router-dom";
import { Bot, Menu, Search } from "lucide-react";
import { useState } from "react";
import {
    Sheet,
    SheetContent,
    SheetTrigger,
} from "@/components/ui/sheet";
import { useAuth } from "@/hooks/useAuth";

const Navbar = () => {
    const navigate = useNavigate();
    const [query, setQuery] = useState("");
    const { user, loading, signOut } = useAuth();

    const handleSearch = (event: React.FormEvent<HTMLFormElement>) => {
        event.preventDefault();
        const trimmedQuery = query.trim();
        if (trimmedQuery) {
            navigate(`/search?q=${encodeURIComponent(trimmedQuery)}`);
        }
    };

    const handleLogout = async () => {
        await signOut();
        navigate("/");
    };

    return (
        <header className="bg-white border-b border-slate-200 sticky top-0 z-50">
            <div className="container mx-auto px-4 h-16 flex items-center justify-between gap-4">
                {/* Logo and Desktop Nav */}
                <div className="flex min-w-0 items-center gap-5 lg:gap-8">
                    <Link to="/" className="flex items-center gap-2">
                        <span className="grid h-8 w-8 place-items-center rounded bg-teal-600 text-white">
                            <Bot className="h-5 w-5" />
                        </span>
                        <span className="text-xl font-bold text-slate-900 tracking-tight">RemoteRobotics</span>
                    </Link>

                    <nav className="hidden md:flex items-center gap-2 text-sm font-medium lg:gap-4">
                        <Link to="/search" className="whitespace-nowrap text-slate-600 px-3 py-2 rounded-md hover:bg-slate-50 hover:text-teal-600 transition-colors">
                            Find Talent
                        </Link>
                        <Link to="/jobs" className="whitespace-nowrap text-slate-600 px-3 py-2 rounded-md hover:bg-slate-50 hover:text-teal-600 transition-colors">
                            Find Work
                        </Link>
                        <Link to="/partners" className="whitespace-nowrap text-slate-600 px-3 py-2 rounded-md hover:bg-slate-50 hover:text-teal-600 transition-colors">
                            Partners
                        </Link>
                    </nav>
                </div>

                {/* Search Bar (Hidden on mobile) */}
                <form onSubmit={handleSearch} className="hidden lg:flex max-w-xs xl:max-w-sm w-full relative">
                    <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
                    <input
                        type="search"
                        value={query}
                        onChange={(event) => setQuery(event.target.value)}
                        placeholder="Search..."
                        className="w-full bg-white border border-slate-200 rounded-md py-2 pl-9 pr-4 text-sm focus:outline-none focus:border-teal-500 focus:ring-1 focus:ring-teal-500 transition-all text-slate-900 placeholder:text-slate-400"
                    />
                </form>

                {/* Auth Buttons */}
                <div className="flex items-center gap-2 md:gap-4">
                    <div className="hidden md:flex items-center gap-3">
                        {!loading && user ? (
                            <>
                                <Link to="/dashboard">
                                    <Button variant="ghost" className="text-sm font-medium text-slate-700 hover:text-teal-600 hover:bg-slate-50">
                                        Dashboard
                                    </Button>
                                </Link>
                                <Button onClick={handleLogout} variant="outline" className="text-sm font-medium">
                                    Log Out
                                </Button>
                            </>
                        ) : !loading && !user ? (
                            <>
                                <Link to="/auth">
                                    <Button variant="ghost" className="text-sm font-medium text-slate-700 hover:text-teal-600 hover:bg-slate-50">
                                        Log In
                                    </Button>
                                </Link>
                                <Link to="/auth">
                                    <Button className="bg-teal-600 hover:bg-teal-700 text-white border-0 shadow-sm font-medium">Sign Up</Button>
                                </Link>
                            </>
                        ) : null}
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
                                <Link to="/search" className="text-lg font-medium text-slate-700 hover:text-teal-600">Find Talent</Link>
                                <Link to="/jobs" className="text-lg font-medium text-slate-700 hover:text-teal-600">Find Work</Link>
                                <Link to="/partners" className="text-lg font-medium text-slate-700 hover:text-teal-600">Partners</Link>
                                <hr className="border-slate-200" />
                                {!loading && user ? (
                                    <>
                                        <Link to="/dashboard">
                                            <Button variant="outline" className="w-full justify-start text-slate-700">Dashboard</Button>
                                        </Link>
                                        <Button variant="ghost" className="w-full justify-start text-red-600 hover:text-red-700 hover:bg-red-50" onClick={handleLogout}>Log Out</Button>
                                    </>
                                ) : !loading && !user ? (
                                    <>
                                        <Link to="/auth">
                                            <Button variant="outline" className="w-full justify-start text-slate-700">Log In</Button>
                                        </Link>
                                        <Link to="/auth">
                                            <Button className="w-full bg-teal-600 hover:bg-teal-700 text-white">Sign Up</Button>
                                        </Link>
                                    </>
                                ) : null}
                            </div>
                        </SheetContent>
                    </Sheet>
                </div>
            </div>
        </header>
    );
};

export default Navbar;
