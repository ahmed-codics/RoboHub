import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Briefcase, Star, TrendingUp, Award } from "lucide-react";
import ProfileSection from "./ProfileSection";
import BidsSection from "./BidsSection";
import PremiumSection from "./PremiumSection";
import BidUsageCounter from "./BidUsageCounter";

interface FreelancerDashboardProps {
  userId: string;
}

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
    const { data, error } = await supabase
      .from("profiles")
      .select("*")
      .eq("id", userId)
      .single();

    if (error) {
      console.error("Error loading profile:", error);
      return;
    }

    setProfile(data);
  };

  const loadStats = async () => {
    // Get total bids this month
    const startOfMonth = new Date();
    startOfMonth.setDate(1);
    startOfMonth.setHours(0, 0, 0, 0);

    const { data: bidsData, error: bidsError } = await supabase
      .from("bids")
      .select("id, status")
      .eq("freelancer_id", userId)
      .gte("created_at", startOfMonth.toISOString());

    if (bidsError) {
      console.error("Error loading bids:", bidsError);
      return;
    }

    const totalBids = bidsData?.length || 0;
    const acceptedBids = bidsData?.filter((bid) => bid.status === "accepted").length || 0;

    // Get premium plan
    const { data: planData } = await supabase
      .from("premium_plans")
      .select("*")
      .eq("user_id", userId)
      .single();

    const isPremium = planData?.plan_type === "premium";
    const availableBids = isPremium ? 999 : Math.max(0, 10 - totalBids);

    setStats({
      totalBids,
      acceptedBids,
      availableBids,
      bidsThisMonth: totalBids,
      isPremium,
    });
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-foreground">Freelancer Dashboard</h1>
        <p className="text-muted-foreground">Welcome back, {profile?.name || "Freelancer"}!</p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Bids This Month</CardTitle>
            <Briefcase className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalBids}</div>
            <p className="text-xs text-muted-foreground">
              {stats.availableBids} bids remaining
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Accepted Bids</CardTitle>
            <Award className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.acceptedBids}</div>
            <p className="text-xs text-muted-foreground">
              Active projects
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Success Rate</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {stats.totalBids > 0 ? Math.round((stats.acceptedBids / stats.totalBids) * 100) : 0}%
            </div>
            <p className="text-xs text-muted-foreground">
              Bid acceptance rate
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Rating</CardTitle>
            <Star className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">4.8</div>
            <p className="text-xs text-muted-foreground">
              Based on 12 reviews
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Main Content */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="space-y-6">
          <BidsSection userId={userId} />
        </div>

        <div className="space-y-6">
          <BidUsageCounter 
            bidsThisMonth={stats.bidsThisMonth} 
            maxBids={10} 
            isPremium={stats.isPremium} 
          />
          <ProfileSection userId={userId} profile={profile} onUpdate={loadProfile} />
          <PremiumSection userId={userId} />
        </div>
      </div>
    </div>
  );
};

export default FreelancerDashboard;
