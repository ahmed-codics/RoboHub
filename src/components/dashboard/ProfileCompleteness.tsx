import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Progress } from "@/components/ui/progress";
import { Button } from "@/components/ui/button";
import { CheckCircle2, Circle, Sparkles } from "lucide-react";

interface Props { userId: string; }

interface Step { label: string; done: boolean; }

const ProfileCompleteness = ({ userId }: Props) => {
  const navigate = useNavigate();
  const [steps, setSteps] = useState<Step[]>([]);
  const [percent, setPercent] = useState(0);

  useEffect(() => {
    const load = async () => {
      const [{ data: profile }, { data: skills }, { data: portfolio }, { data: experience }] = await Promise.all([
        supabase.from("profiles").select("name, headline, bio, location, avatar_url").eq("id", userId).maybeSingle(),
        supabase.from("freelancer_skills").select("id").eq("user_id", userId),
        supabase.from("portfolio_images").select("id").eq("user_id", userId).limit(1),
        supabase.from("profile_experience").select("id").eq("user_id", userId).limit(1),
      ]);

      const s: Step[] = [
        { label: "Add your name", done: !!profile?.name },
        { label: "Write a headline", done: !!profile?.headline },
        { label: "Write a bio", done: !!profile?.bio && profile.bio.length > 20 },
        { label: "Set your location", done: !!profile?.location },
        { label: "Upload an avatar", done: !!profile?.avatar_url },
        { label: "Add at least one skill", done: (skills?.length || 0) > 0 },
        { label: "Add a portfolio item", done: (portfolio?.length || 0) > 0 },
        { label: "Add work experience", done: (experience?.length || 0) > 0 },
      ];
      setSteps(s);
      setPercent(Math.round((s.filter((x) => x.done).length / s.length) * 100));
    };
    load();
  }, [userId]);

  if (percent === 100) return null;

  return (
    <div className="rounded-[2rem] border border-slate-200 bg-white p-6 shadow-sm">
      <div className="flex items-center justify-between mb-1">
        <div className="flex items-center gap-2">
          <Sparkles className="h-5 w-5 text-teal-600" />
          <h3 className="font-bold text-slate-900">Complete your profile</h3>
        </div>
        <span className="text-sm font-bold text-teal-700">{percent}%</span>
      </div>
      <p className="text-xs text-slate-500 mb-3">Profiles with portfolios get up to 3× more views.</p>
      <Progress value={percent} className="h-2 mb-4" />
      <div className="space-y-1.5 mb-4">
        {steps.filter((s) => !s.done).slice(0, 4).map((s) => (
          <div key={s.label} className="flex items-center gap-2 text-sm text-slate-600">
            <Circle className="h-4 w-4 text-slate-300" /> {s.label}
          </div>
        ))}
        {steps.filter((s) => s.done).slice(0, 1).map((s) => (
          <div key={s.label} className="flex items-center gap-2 text-sm text-slate-400">
            <CheckCircle2 className="h-4 w-4 text-teal-500" /> {s.label}
          </div>
        ))}
      </div>
      <Button onClick={() => navigate("/profile")} className="w-full bg-teal-600 hover:bg-teal-700 text-white">
        Finish your profile
      </Button>
    </div>
  );
};

export default ProfileCompleteness;
