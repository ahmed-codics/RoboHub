import { useEffect, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import AdaptiveShell from "@/components/layout/AdaptiveShell";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { Separator } from "@/components/ui/separator";
import SaveButton from "@/components/SaveButton";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Loader2, Check, Clock, RefreshCw, ArrowLeft } from "lucide-react";
import { toast } from "sonner";

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

type Tier = "basic" | "standard" | "premium";

interface ServicePackage {
  id: string;
  listing_id: string;
  tier: Tier;
  title: string | null;
  description: string | null;
  price: number;
  delivery_days: number;
  revisions: number;
  features: string[];
  sort_order: number;
}

const TIER_LABELS: Record<Tier, string> = {
  basic: "Basic",
  standard: "Standard",
  premium: "Premium",
};

const ServiceDetail = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [listing, setListing] = useState<ServiceListing | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [packages, setPackages] = useState<ServicePackage[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      if (!id) return;
      try {
        setLoading(true);
        const { data: listingData, error } = await supabase
          .from("service_listings")
          .select("*")
          .eq("id", id)
          .maybeSingle();

        if (error) throw error;
        if (!listingData) {
          setListing(null);
          return;
        }
        const row = listingData as ServiceListing;
        setListing(row);

        const [{ data: profileData }, { data: packageData, error: pkgError }] = await Promise.all([
          supabase
            .from("profiles")
            .select("id, name, headline, avatar_url")
            .eq("id", row.freelancer_id)
            .maybeSingle(),
          supabase
            .from("service_packages")
            .select("*")
            .eq("listing_id", id)
            .order("sort_order", { ascending: true })
            .order("price", { ascending: true }),
        ]);

        if (pkgError) throw pkgError;
        setProfile((profileData as Profile) || null);
        setPackages((packageData || []) as ServicePackage[]);
      } catch (err) {
        console.error("Failed to load service:", err);
        toast.error("Failed to load service");
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [id]);

  const go = (path: string) => navigate(user ? path : "/auth");

  const PackageCard = ({ pkg }: { pkg: ServicePackage }) => (
    <div className="space-y-4">
      <div className="flex items-baseline justify-between">
        <span className="text-sm font-semibold text-slate-500 uppercase tracking-wide">
          {pkg.title || TIER_LABELS[pkg.tier]}
        </span>
        <span className="text-3xl font-bold text-slate-900">${pkg.price}</span>
      </div>
      {pkg.description && <p className="text-sm text-slate-600">{pkg.description}</p>}
      <div className="flex items-center gap-6 text-sm text-slate-600">
        <span className="flex items-center gap-1.5">
          <Clock className="w-4 h-4 text-teal-600" /> {pkg.delivery_days}-day delivery
        </span>
        <span className="flex items-center gap-1.5">
          <RefreshCw className="w-4 h-4 text-teal-600" /> {pkg.revisions} revisions
        </span>
      </div>
      {(pkg.features || []).length > 0 && (
        <ul className="space-y-2">
          {pkg.features.map((f, i) => (
            <li key={i} className="flex items-start gap-2 text-sm text-slate-700">
              <Check className="w-4 h-4 text-teal-600 mt-0.5 shrink-0" />
              <span>{f}</span>
            </li>
          ))}
        </ul>
      )}
      <div className="space-y-2 pt-2">
        <Button
          onClick={() => go("/messages")}
          className="w-full bg-teal-600 hover:bg-teal-700 text-white"
        >
          Continue (${pkg.price})
        </Button>
        <Button
          variant="outline"
          onClick={() => go("/messages")}
          className="w-full border-slate-200"
        >
          Contact
        </Button>
      </div>
    </div>
  );

  if (loading) {
    return (
      <AdaptiveShell>
        <div className="container mx-auto px-4 py-8 max-w-6xl">
          <div className="flex justify-center py-24">
            <Loader2 className="w-8 h-8 animate-spin text-teal-600" />
          </div>
        </div>
      </AdaptiveShell>
    );
  }

  if (!listing) {
    return (
      <AdaptiveShell>
        <div className="container mx-auto px-4 py-8 max-w-6xl">
          <div className="bg-white border border-dashed border-slate-300 rounded-lg p-16 text-center">
            <p className="text-slate-600 font-medium">Service not found.</p>
            <Link to="/services" className="text-teal-600 hover:text-teal-700 text-sm mt-2 inline-block">
              Back to services
            </Link>
          </div>
        </div>
      </AdaptiveShell>
    );
  }

  return (
    <AdaptiveShell>
      <div className="container mx-auto px-4 py-8 max-w-6xl">
        <Link
          to="/services"
          className="inline-flex items-center gap-1.5 text-sm text-slate-500 hover:text-teal-600 mb-6"
        >
          <ArrowLeft className="w-4 h-4" /> Back to services
        </Link>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main */}
          <div className="lg:col-span-2 space-y-6">
            {listing.cover_image ? (
              <img
                src={listing.cover_image}
                alt={listing.title}
                className="w-full h-64 object-cover rounded-lg border border-slate-200"
              />
            ) : (
              <div className="w-full h-64 bg-gradient-to-br from-teal-500 to-slate-700 rounded-lg" />
            )}

            <div>
              {listing.category && (
                <Badge variant="secondary" className="bg-teal-50 text-teal-700 mb-3">
                  {listing.category}
                </Badge>
              )}
              <h1 className="text-3xl font-bold text-slate-900 tracking-tight">{listing.title}</h1>
            </div>

            <div className="bg-white border border-slate-200 rounded-lg shadow-sm p-6">
              <h2 className="text-lg font-bold text-slate-900 mb-3">About this service</h2>
              <p className="text-slate-600 whitespace-pre-line leading-relaxed">
                {listing.description}
              </p>
            </div>

            {(listing.tags || []).length > 0 && (
              <div className="flex flex-wrap gap-2">
                {listing.tags.map((tag) => (
                  <Badge key={tag} variant="secondary" className="bg-slate-100 text-slate-700">
                    {tag}
                  </Badge>
                ))}
              </div>
            )}
          </div>

          {/* Sidebar */}
          <div className="lg:col-span-1">
            <div className="lg:sticky lg:top-8 space-y-6">
              <Card className="border-slate-200 rounded-lg shadow-sm">
                <CardContent className="p-6">
                  {packages.length === 0 ? (
                    <p className="text-slate-500 text-sm text-center py-4">
                      No packages available for this service.
                    </p>
                  ) : packages.length === 1 ? (
                    <PackageCard pkg={packages[0]} />
                  ) : (
                    <Tabs defaultValue={packages[0].tier}>
                      <TabsList className="grid w-full grid-cols-3 mb-6">
                        {packages.map((pkg) => (
                          <TabsTrigger key={pkg.id} value={pkg.tier}>
                            {TIER_LABELS[pkg.tier]}
                          </TabsTrigger>
                        ))}
                      </TabsList>
                      {packages.map((pkg) => (
                        <TabsContent key={pkg.id} value={pkg.tier}>
                          <PackageCard pkg={pkg} />
                        </TabsContent>
                      ))}
                    </Tabs>
                  )}
                </CardContent>
              </Card>

              <Card className="border-slate-200 rounded-lg shadow-sm">
                <CardContent className="p-6">
                  <Link
                    to={`/freelancer/${listing.freelancer_id}`}
                    className="flex items-center gap-3 group"
                  >
                    <Avatar className="h-12 w-12">
                      <AvatarImage src={profile?.avatar_url || undefined} />
                      <AvatarFallback className="bg-slate-100 text-slate-600">
                        {(profile?.name || "?").charAt(0).toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                    <div className="min-w-0">
                      <p className="font-semibold text-slate-900 group-hover:text-teal-600 transition-colors truncate">
                        {profile?.name || "Unknown"}
                      </p>
                      {profile?.headline && (
                        <p className="text-sm text-slate-500 truncate">{profile.headline}</p>
                      )}
                    </div>
                  </Link>
                  <Separator className="my-4" />
                  <div className="flex items-center justify-between">
                    <Link
                      to={`/freelancer/${listing.freelancer_id}`}
                      className="text-sm text-teal-600 hover:text-teal-700 font-medium"
                    >
                      View profile
                    </Link>
                    <SaveButton itemType="service" itemId={listing.id} variant="full" />
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </div>
    </AdaptiveShell>
  );
};

export default ServiceDetail;
