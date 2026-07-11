import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import AdaptiveShell from "@/components/layout/AdaptiveShell";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";

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

type Tier = "basic" | "standard" | "premium";

interface PackageForm {
  price: string;
  delivery_days: string;
  revisions: string;
  features: string;
}

const emptyPackage: PackageForm = { price: "", delivery_days: "", revisions: "", features: "" };

const TIERS: { tier: Tier; label: string; required: boolean }[] = [
  { tier: "basic", label: "Basic", required: true },
  { tier: "standard", label: "Standard", required: false },
  { tier: "premium", label: "Premium", required: false },
];

const CreateService = () => {
  const navigate = useNavigate();
  const { user } = useAuth();

  const [title, setTitle] = useState("");
  const [category, setCategory] = useState("");
  const [description, setDescription] = useState("");
  const [tagsInput, setTagsInput] = useState("");
  const [packages, setPackages] = useState<Record<Tier, PackageForm>>({
    basic: { ...emptyPackage },
    standard: { ...emptyPackage },
    premium: { ...emptyPackage },
  });
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!user) navigate("/auth");
  }, [user, navigate]);

  if (!user) return null;

  const updatePackage = (tier: Tier, field: keyof PackageForm, value: string) => {
    setPackages((prev) => ({ ...prev, [tier]: { ...prev[tier], [field]: value } }));
  };

  const parseFeatures = (raw: string) =>
    raw
      .split("\n")
      .map((f) => f.trim())
      .filter(Boolean);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (saving) return;

    if (!title.trim()) {
      toast.error("Title is required");
      return;
    }

    const basicPrice = Number(packages.basic.price);
    if (!(basicPrice > 0)) {
      toast.error("Basic package requires a price greater than 0");
      return;
    }

    // Collect valid packages (basic required, others only if price > 0)
    const selected = TIERS.map((t, index) => {
      const form = packages[t.tier];
      const price = Number(form.price);
      if (price > 0) {
        return {
          tier: t.tier,
          price,
          delivery_days: Number(form.delivery_days) || 0,
          revisions: Number(form.revisions) || 0,
          features: parseFeatures(form.features),
          sort_order: index,
        };
      }
      return null;
    }).filter((p): p is NonNullable<typeof p> => p !== null);

    const startingPrice = Math.min(...selected.map((p) => p.price));
    const tags = tagsInput
      .split(",")
      .map((t) => t.trim())
      .filter(Boolean);

    setSaving(true);
    try {
      const { data: listing, error: listingError } = await supabase
        .from("service_listings")
        .insert({
          freelancer_id: user.id,
          title: title.trim(),
          description: description.trim(),
          category: category || null,
          tags,
          starting_price: startingPrice,
          is_active: true,
        })
        .select()
        .single();

      if (listingError) throw listingError;

      const newId = listing.id;

      const { error: pkgError } = await supabase.from("service_packages").insert(
        selected.map((p) => ({
          listing_id: newId,
          tier: p.tier,
          price: p.price,
          delivery_days: p.delivery_days,
          revisions: p.revisions,
          features: p.features,
          sort_order: p.sort_order,
        }))
      );

      if (pkgError) throw pkgError;

      toast.success("Service published!");
      navigate(`/services/${newId}`);
    } catch (err) {
      console.error("Failed to create service:", err);
      toast.error("Failed to create service");
    } finally {
      setSaving(false);
    }
  };

  return (
    <AdaptiveShell>
      <div className="container mx-auto px-4 py-8 max-w-6xl">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-slate-900 tracking-tight">Offer a Service</h1>
          <p className="text-slate-500 mt-1">
            Create a listing to showcase your robotics expertise to clients.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6 max-w-3xl">
          <Card className="border-slate-200 rounded-lg shadow-sm">
            <CardHeader>
              <CardTitle className="text-slate-900">Service details</CardTitle>
            </CardHeader>
            <CardContent className="space-y-5">
              <div className="space-y-2">
                <Label htmlFor="title">Title</Label>
                <Input
                  id="title"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="I will develop ROS2 navigation for your robot"
                  className="border-slate-200"
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="category">Category</Label>
                <Select value={category} onValueChange={setCategory}>
                  <SelectTrigger id="category" className="border-slate-200 bg-white">
                    <SelectValue placeholder="Select a category" />
                  </SelectTrigger>
                  <SelectContent>
                    {CATEGORIES.map((c) => (
                      <SelectItem key={c} value={c}>
                        {c}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Describe what you offer, your process, and what the client will receive..."
                  className="border-slate-200 min-h-[140px]"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="tags">Tags</Label>
                <Input
                  id="tags"
                  value={tagsInput}
                  onChange={(e) => setTagsInput(e.target.value)}
                  placeholder="ROS2, SLAM, C++ (comma separated)"
                  className="border-slate-200"
                />
                <p className="text-xs text-slate-400">Separate tags with commas.</p>
              </div>
            </CardContent>
          </Card>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {TIERS.map((t) => (
              <Card key={t.tier} className="border-slate-200 rounded-lg shadow-sm">
                <CardHeader>
                  <CardTitle className="text-slate-900 text-base flex items-center gap-2">
                    {t.label}
                    {t.required ? (
                      <span className="text-xs font-normal text-teal-600">Required</span>
                    ) : (
                      <span className="text-xs font-normal text-slate-400">Optional</span>
                    )}
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor={`${t.tier}-price`}>Price ($)</Label>
                    <Input
                      id={`${t.tier}-price`}
                      type="number"
                      min="0"
                      value={packages[t.tier].price}
                      onChange={(e) => updatePackage(t.tier, "price", e.target.value)}
                      placeholder="0"
                      className="border-slate-200"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor={`${t.tier}-delivery`}>Delivery (days)</Label>
                    <Input
                      id={`${t.tier}-delivery`}
                      type="number"
                      min="0"
                      value={packages[t.tier].delivery_days}
                      onChange={(e) => updatePackage(t.tier, "delivery_days", e.target.value)}
                      placeholder="0"
                      className="border-slate-200"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor={`${t.tier}-revisions`}>Revisions</Label>
                    <Input
                      id={`${t.tier}-revisions`}
                      type="number"
                      min="0"
                      value={packages[t.tier].revisions}
                      onChange={(e) => updatePackage(t.tier, "revisions", e.target.value)}
                      placeholder="0"
                      className="border-slate-200"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor={`${t.tier}-features`}>Features</Label>
                    <Textarea
                      id={`${t.tier}-features`}
                      value={packages[t.tier].features}
                      onChange={(e) => updatePackage(t.tier, "features", e.target.value)}
                      placeholder="One feature per line"
                      className="border-slate-200 min-h-[100px]"
                    />
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          <div className="flex justify-end gap-3">
            <Button
              type="button"
              variant="outline"
              onClick={() => navigate("/services")}
              className="border-slate-200"
              disabled={saving}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={saving}
              className="bg-teal-600 hover:bg-teal-700 text-white gap-2"
            >
              {saving && <Loader2 className="w-4 h-4 animate-spin" />}
              {saving ? "Publishing..." : "Publish Service"}
            </Button>
          </div>
        </form>
      </div>
    </AdaptiveShell>
  );
};

export default CreateService;
