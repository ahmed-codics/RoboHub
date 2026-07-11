import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import AdaptiveShell from "@/components/layout/AdaptiveShell";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Search, Loader2, PlusCircle } from "lucide-react";
import { toast } from "sonner";
import { useSeo } from "@/hooks/useSeo";

const CATEGORIES = [
  "Robotics Software",
  "Embedded Systems",
  "Control Systems",
  "Computer Vision",
  "Mechanical Design",
  "IoT & Networking",
  "Data Analysis",
  "Web Interfaces",
];

interface ServiceListing {
  id: string;
  freelancer_id: string;
  title: string;
  description: string;
  category: string | null;
  cover_image: string | null;
  tags: string[];
  starting_price: number;
  is_active: boolean;
  created_at: string;
}

interface Profile {
  id: string;
  name: string | null;
  headline: string | null;
  avatar_url: string | null;
}

const Services = () => {
  useSeo("Robotics Services", "Browse and order robotics engineering services — ROS, embedded, computer vision, mechanical design and more.");
  const navigate = useNavigate();
  const { user } = useAuth();
  const [listings, setListings] = useState<ServiceListing[]>([]);
  const [profiles, setProfiles] = useState<Record<string, Profile>>({});
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("all");

  useEffect(() => {
    const load = async () => {
      try {
        setLoading(true);
        const { data: listingData, error } = await supabase
          .from("service_listings")
          .select("*")
          .eq("is_active", true)
          .order("created_at", { ascending: false });

        if (error) throw error;
        const rows = (listingData || []) as ServiceListing[];
        setListings(rows);

        const freelancerIds = Array.from(new Set(rows.map((r) => r.freelancer_id)));
        if (freelancerIds.length > 0) {
          const { data: profileData, error: profileError } = await supabase
            .from("profiles")
            .select("id, name, headline, avatar_url")
            .in("id", freelancerIds);

          if (profileError) throw profileError;
          const map: Record<string, Profile> = {};
          (profileData || []).forEach((p) => {
            map[(p as Profile).id] = p as Profile;
          });
          setProfiles(map);
        }
      } catch (err) {
        console.error("Failed to load services:", err);
        toast.error("Failed to load services");
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  const filtered = useMemo(() => {
    return listings.filter((l) => {
      const term = searchTerm.trim().toLowerCase();
      const matchesSearch =
        term === "" ||
        l.title.toLowerCase().includes(term) ||
        (l.tags || []).some((t) => t.toLowerCase().includes(term));
      const matchesCategory = categoryFilter === "all" || l.category === categoryFilter;
      return matchesSearch && matchesCategory;
    });
  }, [listings, searchTerm, categoryFilter]);

  const handleOffer = () => {
    navigate(user ? "/services/new" : "/auth");
  };

  return (
    <AdaptiveShell>
      <div className="container mx-auto px-4 py-8 max-w-6xl">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8">
          <div>
            <h1 className="text-3xl font-bold text-slate-900 tracking-tight">Robotics Services</h1>
            <p className="text-slate-500 mt-1">
              Hire expert engineers for robotics, embedded, and automation work.
            </p>
          </div>
          <Button onClick={handleOffer} className="bg-teal-600 hover:bg-teal-700 text-white gap-2">
            <PlusCircle className="w-4 h-4" /> Offer a Service
          </Button>
        </div>

        <div className="bg-white border border-slate-200 rounded-lg shadow-sm p-4 flex flex-col sm:flex-row gap-4 mb-8">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-400" />
            <Input
              placeholder="Search services by title or tag..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 h-11 border-slate-200 bg-slate-50 focus:border-teal-500 focus:ring-teal-500"
            />
          </div>
          <Select value={categoryFilter} onValueChange={setCategoryFilter}>
            <SelectTrigger className="w-full sm:w-[220px] h-11 border-slate-200 bg-white">
              <SelectValue placeholder="All categories" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All categories</SelectItem>
              {CATEGORIES.map((c) => (
                <SelectItem key={c} value={c}>
                  {c}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {loading ? (
          <div className="flex justify-center py-24">
            <Loader2 className="w-8 h-8 animate-spin text-teal-600" />
          </div>
        ) : filtered.length === 0 ? (
          <div className="bg-white border border-dashed border-slate-300 rounded-lg p-16 text-center">
            <p className="text-slate-600 font-medium">No services found.</p>
            <p className="text-slate-400 text-sm mt-1">
              Try a different search or be the first to offer a service.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filtered.map((listing) => {
              const profile = profiles[listing.freelancer_id];
              return (
                <Link
                  key={listing.id}
                  to={`/services/${listing.id}`}
                  className="group bg-white border border-slate-200 rounded-lg shadow-sm overflow-hidden hover:shadow-md transition-shadow flex flex-col"
                >
                  {listing.cover_image ? (
                    <img
                      src={listing.cover_image}
                      alt={listing.title}
                      className="w-full h-40 object-cover"
                    />
                  ) : (
                    <div className="w-full h-40 bg-gradient-to-br from-teal-500 to-slate-700" />
                  )}
                  <div className="p-5 flex flex-col flex-1">
                    <h3 className="text-base font-bold text-slate-900 line-clamp-2 group-hover:text-teal-600 transition-colors mb-3">
                      {listing.title}
                    </h3>
                    <div className="flex items-center gap-2 mb-4">
                      <Avatar className="h-7 w-7">
                        <AvatarImage src={profile?.avatar_url || undefined} />
                        <AvatarFallback className="text-xs bg-slate-100 text-slate-600">
                          {(profile?.name || "?").charAt(0).toUpperCase()}
                        </AvatarFallback>
                      </Avatar>
                      <span className="text-sm text-slate-600 truncate">
                        {profile?.name || "Unknown"}
                      </span>
                    </div>
                    <div className="flex flex-wrap gap-2 mb-4">
                      {(listing.tags || []).slice(0, 3).map((tag) => (
                        <Badge
                          key={tag}
                          variant="secondary"
                          className="bg-slate-100 text-slate-700 hover:bg-slate-200"
                        >
                          {tag}
                        </Badge>
                      ))}
                    </div>
                    <div className="mt-auto pt-3 border-t border-slate-100 flex items-center justify-between">
                      <span className="text-xs text-slate-500 uppercase tracking-wide">Starting at</span>
                      <span className="text-slate-900 font-bold">
                        From ${listing.starting_price}
                      </span>
                    </div>
                  </div>
                </Link>
              );
            })}
          </div>
        )}
      </div>
    </AdaptiveShell>
  );
};

export default Services;
