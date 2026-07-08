import { useLocation } from "react-router-dom";
import { useEffect } from "react";
import AppShell from "@/components/layout/AppShell";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";

const NotFound = () => {
  const location = useLocation();

  useEffect(() => {
    console.error("404 Error: User attempted to access non-existent route:", location.pathname);
  }, [location.pathname]);

  return (
    <AppShell>
      <div className="flex min-h-[calc(100vh-16rem)] items-center justify-center bg-slate-50 px-4">
        <div className="text-center max-w-md">
          <h1 className="mb-2 text-6xl font-extrabold text-slate-900 tracking-tight">404</h1>
          <h2 className="mb-6 text-2xl font-bold text-slate-800">Page not found</h2>
          <p className="mb-8 text-slate-500">Sorry, the page you are looking for doesn't exist or has been moved.</p>
          <Link to="/">
            <Button className="bg-teal-600 text-white hover:bg-teal-700 px-8 py-2 h-11 text-base shadow-sm border-0 rounded-md">
              Return to Home
            </Button>
          </Link>
        </div>
      </div>
    </AppShell>
  );
};

export default NotFound;
