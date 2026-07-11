import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Heart } from "lucide-react";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

type SavedType = "freelancer" | "job" | "service";

interface SaveButtonProps {
  itemType: SavedType;
  itemId: string;
  variant?: "icon" | "full";
  className?: string;
  onChange?: (saved: boolean) => void;
}

const SaveButton = ({ itemType, itemId, variant = "icon", className, onChange }: SaveButtonProps) => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [saved, setSaved] = useState(false);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    let active = true;
    if (!user) { setSaved(false); return; }
    supabase
      .from("saved_items")
      .select("id")
      .eq("user_id", user.id)
      .eq("item_type", itemType)
      .eq("item_id", itemId)
      .maybeSingle()
      .then(({ data }) => { if (active) setSaved(!!data); });
    return () => { active = false; };
  }, [user, itemType, itemId]);

  const toggle = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (!user) { navigate("/auth"); return; }
    setBusy(true);
    try {
      if (saved) {
        await supabase.from("saved_items").delete()
          .eq("user_id", user.id).eq("item_type", itemType).eq("item_id", itemId);
        setSaved(false);
        onChange?.(false);
      } else {
        await supabase.from("saved_items").insert({ user_id: user.id, item_type: itemType, item_id: itemId });
        setSaved(true);
        onChange?.(true);
        toast.success("Saved");
      }
    } catch {
      toast.error("Could not update saved items");
    } finally {
      setBusy(false);
    }
  };

  if (variant === "full") {
    return (
      <Button type="button" variant="outline" onClick={toggle} disabled={busy}
        className={cn("border-slate-200", saved && "border-rose-200 text-rose-600", className)}>
        <Heart className={cn("h-4 w-4 mr-1.5", saved && "fill-rose-500 text-rose-500")} />
        {saved ? "Saved" : "Save"}
      </Button>
    );
  }

  return (
    <button type="button" onClick={toggle} disabled={busy}
      aria-label={saved ? "Remove from saved" : "Save"}
      className={cn(
        "grid h-9 w-9 place-items-center rounded-full border border-slate-200 bg-white/90 backdrop-blur transition hover:bg-slate-50",
        className
      )}>
      <Heart className={cn("h-4 w-4 text-slate-500", saved && "fill-rose-500 text-rose-500")} />
    </button>
  );
};

export default SaveButton;
