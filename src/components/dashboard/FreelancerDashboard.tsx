import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Briefcase, Star, TrendingUp, Award, Zap } from "lucide-react";
import { Button } from "@/components/ui/button";
import ProfileSection from "./ProfileSection";
import BidsSection from "./BidsSection";
import PremiumSection from "./PremiumSection";
import BidUsageCounter from "./BidUsageCounter";
import { cn } from "@/lib/utils";

interface FreelancerDashboardProps {
  userId: string;
}

const StatCard = ({ title, value, subtext, icon: Icon, colorClass }: any) => (
  <div className="bg-white border border-slate-200 shadow-sm p-6 rounded-[2rem] relative overflow-hidden group hover:-translate-y-1 hover:shadow-xl transition-all duration-300">
    <div className={cn("absolute top-0 right-0 p-4 opacity-5 group-hover:opacity-10 transition-opacity", colorClass)}>
      <Icon className="h-24 w-24" />
    </div>
    <div className="relative z-10">
      <div className={cn("h-12 w-12 rounded-xl flex items-center justify-center mb-4", colorClass)}>
        <Icon className="h-6 w-6" />
      </div>
      <p className="text-sm font-bold text-slate-500">{title}</p>
      <h3 className="text-3xl font-extrabold text-slate-900 mt-1">{value}</h3>
      <div className="mt-4 flex items-center gap-3">
        <div className="flex-1 h-1.5 bg-slate-100 rounded-full overflow-hidden">
            <div className="h-full bg-slate-800 rounded-full" style={{ width: `${Math.floor(Math.random() * 40) + 40}%`, transition: 'width 1s ease-out' }} />
        </div>
        <p className="text-xs text-slate-400 font-medium whitespace-nowrap">{subtext}</p>
      </div>
    </div>
  </div>
);

const FreelancerDashboard = ({ userId }: FreelancerDashboardProps) => {
  const [profile, setProfile] = useState<any>(null);
  const [stats, setStats] = useState({
    totalBids: 0,
    acceptedBids: 0,
    availableBids: 10,
    bidsThisMonth: 0,
    isPremium: false,
  });

  useEffect(() => {
    loadProfile();
    loadStats();
  }, [userId]);

  const loadProfile = async () => {
    const { data } = await supabase.from("profiles").select("*").eq("id", userId).single();
    setProfile(data);
  };

  const loadStats = async () => {
    const startOfMonth = new Date();
    startOfMonth.setDate(1);
    startOfMonth.setHours(0, 0, 0, 0);

    const { data: bidsData } = await supabase
      .from("bids")
      .select("id, status")
      .eq("freelancer_id", userId)
      .gte("created_at", startOfMonth.toISOString());

    const totalBids = bidsData?.length || 0;
    const acceptedBids = bidsData?.filter((bid) => bid.status === "accepted").length || 0;

    const { data: planData } = await supabase
      .from("premium_plans")
      .select("*")
      .eq("user_id", userId)
      .single();

    const isPremium = planData?.plan_type === "premium";
    const availableBids = isPremium ? 999 : Math.max(0, 10 - totalBids);

    setStats({ totalBids, acceptedBids, availableBids, bidsThisMonth: totalBids, isPremium });
  };

  return (
    <div className="space-y-8">
      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard
          title="Bids This Month"
          value={stats.totalBids}
          subtext={`${stats.availableBids} remaining`}
          icon={Briefcase}
          colorClass="text-blue-400 bg-blue-500/20"
        />
        <StatCard
          title="Active Projects"
          value={stats.acceptedBids}
          subtext="Currently in progress"
          icon={Zap}
          colorClass="text-yellow-400 bg-yellow-500/20"
        />
        <StatCard
          title="Success Rate"
          value={`${stats.totalBids > 0 ? Math.round((stats.acceptedBids / stats.totalBids) * 100) : 0}%`}
          subtext="Proposal acceptance"
          icon={TrendingUp}
          colorClass="text-green-400 bg-green-500/20"
        />
        <StatCard
          title="Client Rating"
          value="4.9"
          subtext="Consistent Top Rated"
          icon={Star}
          colorClass="text-purple-400 bg-purple-500/20"
        />
      </div>

      {/* Main Content Layout */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-8">
        <div className="xl:col-span-2 space-y-8">
          <div className="bg-white border border-slate-200 shadow-sm rounded-[2rem] p-6">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-xl font-bold text-slate-900">Recent Activity</h3>
              <Button variant="ghost" size="sm">View All</Button>
            </div>
            <BidsSection userId={userId} />
          </div>
        </div>

        <div className="space-y-8">
          <div className="bg-white border border-slate-200 shadow-sm rounded-[2rem] p-6">
            <ProfileSection userId={userId} profile={profile} onUpdate={loadProfile} />
          </div>

          <div className="bg-white border border-slate-200 shadow-sm rounded-[2rem] p-6 relative overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-br from-teal-500/5 to-transparent"></div>
            <div className="relative z-10">
              <BidUsageCounter
                bidsThisMonth={stats.bidsThisMonth}
                maxBids={10}
                isPremium={stats.isPremium}
              />
            </div>
          </div>

          <PremiumSection userId={userId} />
        </div>
      </div>
    </div>
  );
};

export default FreelancerDashboard;
