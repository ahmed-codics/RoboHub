import { useEffect, useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  ResponsiveContainer, AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip,
} from "recharts";
import {
  Briefcase, TrendingUp, Zap, Wallet, Star, MapPin, ArrowRight, Sparkles,
  Search, Package, ArrowUpRight, User as UserIcon,
} from "lucide-react";
import BidsSection from "./BidsSection";
import PremiumSection from "./PremiumSection";
import BidUsageCounter from "./BidUsageCounter";
import ProfileCompleteness from "./ProfileCompleteness";
import { cn } from "@/lib/utils";

interface FreelancerDashboardProps {
  userId: string;
}

const currency = (v: number) =>
  new Intl.NumberFormat(undefined, { style: "currency", currency: "USD", maximumFractionDigits: 0 }).format(v || 0);

const monthLabels = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

const buildEarningsSeries = (rows: { amount: number; created_at: string; released_at: string | null }[]) => {
  const now = new Date();
  const buckets: { key: string; label: string; value: number }[] = [];
  for (let i = 5; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    buckets.push({ key: `${d.getFullYear()}-${d.getMonth()}`, label: monthLabels[d.getMonth()], value: 0 });
  }
  rows.forEach((r) => {
    const d = new Date(r.released_at || r.created_at);
    const key = `${d.getFullYear()}-${d.getMonth()}`;
    const b = buckets.find((x) => x.key === key);
    if (b) b.value += Number(r.amount);
  });
  return buckets;
};

const StatCard = ({ title, value, sub, icon: Icon, tone }: any) => (
  <div className="group relative overflow-hidden rounded-2xl border border-slate-200 bg-white p-5 shadow-sm transition-all duration-300 hover:-translate-y-0.5 hover:shadow-lg">
    <div className="flex items-start justify-between">
      <div className={cn("grid h-11 w-11 place-items-center rounded-xl", tone)}>
        <Icon className="h-5 w-5" />
      </div>
      <ArrowUpRight className="h-4 w-4 text-slate-300 transition-colors group-hover:text-teal-500" />
    </div>
    <p className="mt-4 text-sm font-medium text-slate-500">{title}</p>
    <p className="mt-0.5 text-2xl font-extrabold tracking-tight text-slate-900">{value}</p>
    {sub && <p className="mt-1 text-xs text-slate-400">{sub}</p>}
  </div>
);

const FreelancerDashboard = ({ userId }: FreelancerDashboardProps) => {
  const navigate = useNavigate();
  const [profile, setProfile] = useState<any>(null);
  const [stats, setStats] = useState({
    totalBids: 0, acceptedBids: 0, availableBids: 10, bidsThisMonth: 0,
    isPremium: false, rating: 0, reviewCount: 0, totalEarned: 0, inEscrow: 0,
  });
  const [series, setSeries] = useState<{ label: string; value: number }[]>([]);
  const [recommended, setRecommended] = useState<any[]>([]);

  useEffect(() => {
    loadProfile();
    loadStats();
    loadEarnings();
    loadRecommended();
  }, [userId]);

  const loadProfile = async () => {
    const { data } = await supabase.from("profiles").select("*").eq("id", userId).maybeSingle();
    setProfile(data);
  };

  const loadStats = async () => {
    const startOfMonth = new Date();
    startOfMonth.setDate(1);
    startOfMonth.setHours(0, 0, 0, 0);

    const { data: bidsData } = await supabase
      .from("bids").select("id, status").eq("freelancer_id", userId)
      .gte("created_at", startOfMonth.toISOString());

    const totalBids = bidsData?.length || 0;
    const acceptedBids = bidsData?.filter((b) => b.status === "accepted").length || 0;

    const { data: planData } = await supabase
      .from("premium_plans").select("*").eq("user_id", userId).maybeSingle();
    const isPremium = planData?.plan_type === "premium";
    const availableBids = isPremium ? 999 : Math.max(0, 10 - totalBids);

    const { data: reviewsData } = await supabase
      .from("reviews").select("rating").eq("reviewee_id", userId);
    const reviewCount = reviewsData?.length || 0;
    const rating = reviewCount
      ? Math.round((reviewsData!.reduce((s, r) => s + r.rating, 0) / reviewCount) * 10) / 10 : 0;

    setStats((prev) => ({
      ...prev, totalBids, acceptedBids, availableBids, bidsThisMonth: totalBids, isPremium, rating, reviewCount,
    }));
  };

  const loadEarnings = async () => {
    const { data } = await supabase
      .from("escrow_transactions")
      .select("amount, status, created_at, released_at")
      .eq("freelancer_id", userId);
    const rows = data || [];
    const totalEarned = rows.filter((r) => r.status === "released").reduce((s, r) => s + Number(r.amount), 0);
    const inEscrow = rows.filter((r) => r.status === "held").reduce((s, r) => s + Number(r.amount), 0);
    setStats((prev) => ({ ...prev, totalEarned, inEscrow }));
    setSeries(buildEarningsSeries(rows.filter((r) => r.status === "released")));
  };

  const loadRecommended = async () => {
    const { data: skillRows } = await supabase
      .from("freelancer_skills").select("skill").eq("user_id", userId);
    const skills = (skillRows || []).map((s) => s.skill.toLowerCase());

    const { data: jobs } = await supabase
      .from("jobs").select("id, title, budget, required_skills, created_at, client_id, status")
      .eq("status", "open").order("created_at", { ascending: false }).limit(60);

    const scored = (jobs || [])
      .filter((j) => j.client_id !== userId)
      .map((j) => {
        const overlap = (j.required_skills || []).filter((rs: string) =>
          skills.some((s) => rs.toLowerCase().includes(s) || s.includes(rs.toLowerCase()))
        ).length;
        return { ...j, overlap };
      })
      .sort((a, b) => b.overlap - a.overlap || +new Date(b.created_at) - +new Date(a.created_at))
      .slice(0, 4);
    setRecommended(scored);
  };

  const firstName = (profile?.name || "there").split(" ")[0];
  const hour = new Date().getHours();
  const greeting = hour < 12 ? "Good morning" : hour < 18 ? "Good afternoon" : "Good evening";
  const memberSince = profile?.created_at
    ? new Date(profile.created_at).toLocaleDateString(undefined, { month: "short", year: "numeric" }) : "";

  return (
    <div className="space-y-6">
      {/* Welcome hero */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-teal-600 via-teal-600 to-cyan-600 p-6 text-white shadow-lg sm:p-8">
        <div className="pointer-events-none absolute -right-16 -top-20 h-64 w-64 rounded-full bg-white/10 blur-2xl" />
        <div className="pointer-events-none absolute -bottom-24 right-24 h-56 w-56 rounded-full bg-cyan-300/20 blur-3xl" />
        <div className="relative z-10 flex flex-col gap-6 md:flex-row md:items-center md:justify-between">
          <div>
            <p className="text-sm font-medium text-teal-50/80">{greeting},</p>
            <h2 className="text-2xl font-extrabold tracking-tight sm:text-3xl">{firstName} 👋</h2>
            <p className="mt-2 max-w-md text-sm text-teal-50/90">
              Here's what's happening with your freelance business today. You have{" "}
              <span className="font-semibold text-white">{stats.availableBids === 999 ? "unlimited" : stats.availableBids}</span> bids left this month.
            </p>
            <div className="mt-5 flex flex-wrap gap-3">
              <Button onClick={() => navigate("/jobs")} className="bg-white text-teal-700 hover:bg-teal-50 shadow-sm">
                <Search className="mr-2 h-4 w-4" /> Browse Jobs
              </Button>
              <Button onClick={() => navigate("/services/new")} variant="outline" className="border-white/40 bg-white/10 text-white hover:bg-white/20">
                <Package className="mr-2 h-4 w-4" /> Offer a Service
              </Button>
            </div>
          </div>
          <div className="hidden shrink-0 rounded-2xl bg-white/10 p-5 text-center backdrop-blur-sm md:block">
            <p className="text-xs font-medium uppercase tracking-wider text-teal-50/80">Total earned</p>
            <p className="mt-1 text-3xl font-extrabold">{currency(stats.totalEarned)}</p>
            {stats.inEscrow > 0 && (
              <p className="mt-1 text-xs text-teal-50/90">{currency(stats.inEscrow)} in escrow</p>
            )}
          </div>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard title="Total Earned" value={currency(stats.totalEarned)} sub="Released from escrow" icon={Wallet} tone="bg-green-100 text-green-600" />
        <StatCard title="Active Projects" value={stats.acceptedBids} sub="Bids accepted this month" icon={Zap} tone="bg-amber-100 text-amber-600" />
        <StatCard title="Bids This Month" value={stats.totalBids} sub={`${stats.availableBids === 999 ? "∞" : stats.availableBids} remaining`} icon={Briefcase} tone="bg-blue-100 text-blue-600" />
        <StatCard title="Success Rate" value={`${stats.totalBids > 0 ? Math.round((stats.acceptedBids / stats.totalBids) * 100) : 0}%`} sub="Proposal acceptance" icon={TrendingUp} tone="bg-purple-100 text-purple-600" />
      </div>

      {/* Main grid */}
      <div className="grid grid-cols-1 gap-6 xl:grid-cols-3">
        {/* Left */}
        <div className="space-y-6 xl:col-span-2">
          {/* Earnings chart */}
          <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
            <div className="mb-4 flex items-center justify-between">
              <div>
                <h3 className="text-lg font-bold text-slate-900">Earnings overview</h3>
                <p className="text-sm text-slate-500">Released payments over the last 6 months</p>
              </div>
              <Button variant="ghost" size="sm" className="text-teal-700 hover:text-teal-800" onClick={() => navigate("/analytics")}>
                Analytics <ArrowRight className="ml-1 h-4 w-4" />
              </Button>
            </div>
            {stats.totalEarned === 0 ? (
              <div className="flex flex-col items-center justify-center rounded-xl bg-slate-50 py-12 text-center">
                <Wallet className="h-8 w-8 text-slate-300" />
                <p className="mt-3 text-sm font-medium text-slate-600">No earnings yet</p>
                <p className="text-xs text-slate-400">Win a project and your released payments will show here.</p>
              </div>
            ) : (
              <div className="h-56">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={series} margin={{ top: 8, right: 8, left: -12, bottom: 0 }}>
                    <defs>
                      <linearGradient id="earn" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#0d9488" stopOpacity={0.35} />
                        <stop offset="95%" stopColor="#0d9488" stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="#eef2f6" vertical={false} />
                    <XAxis dataKey="label" tick={{ fontSize: 12, fill: "#94a3b8" }} axisLine={false} tickLine={false} />
                    <YAxis tick={{ fontSize: 12, fill: "#94a3b8" }} axisLine={false} tickLine={false} width={48}
                      tickFormatter={(v) => (v >= 1000 ? `$${v / 1000}k` : `$${v}`)} />
                    <Tooltip formatter={(v: number) => [currency(v), "Earned"]} contentStyle={{ borderRadius: 12, border: "1px solid #e2e8f0", fontSize: 13 }} />
                    <Area type="monotone" dataKey="value" stroke="#0d9488" strokeWidth={2.5} fill="url(#earn)" />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            )}
          </div>

          {/* Recommended jobs */}
          <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
            <div className="mb-4 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Sparkles className="h-5 w-5 text-teal-600" />
                <h3 className="text-lg font-bold text-slate-900">Recommended for you</h3>
              </div>
              <Button variant="ghost" size="sm" className="text-teal-700 hover:text-teal-800" onClick={() => navigate("/jobs")}>
                See all <ArrowRight className="ml-1 h-4 w-4" />
              </Button>
            </div>
            {recommended.length === 0 ? (
              <p className="py-8 text-center text-sm text-slate-500">No open jobs right now — check back soon.</p>
            ) : (
              <div className="space-y-3">
                {recommended.map((job) => (
                  <Link key={job.id} to={`/job/${job.id}`}
                    className="group flex items-center justify-between gap-4 rounded-xl border border-slate-100 p-4 transition-all hover:border-teal-200 hover:bg-teal-50/40">
                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <h4 className="truncate font-semibold text-slate-900 group-hover:text-teal-700">{job.title}</h4>
                        {job.overlap > 0 && (
                          <Badge className="shrink-0 border-0 bg-teal-100 text-teal-700">{job.overlap} skill match{job.overlap > 1 ? "es" : ""}</Badge>
                        )}
                      </div>
                      <div className="mt-1.5 flex flex-wrap gap-1.5">
                        {(job.required_skills || []).slice(0, 4).map((s: string) => (
                          <span key={s} className="rounded-md bg-slate-100 px-2 py-0.5 text-xs text-slate-600">{s}</span>
                        ))}
                      </div>
                    </div>
                    <div className="shrink-0 text-right">
                      <p className="font-bold text-slate-900">${Number(job.budget).toLocaleString()}</p>
                      <span className="mt-1 inline-flex items-center text-xs font-medium text-teal-700 opacity-0 transition-opacity group-hover:opacity-100">
                        View <ArrowRight className="ml-0.5 h-3 w-3" />
                      </span>
                    </div>
                  </Link>
                ))}
              </div>
            )}
          </div>

          {/* Recent activity */}
          <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
            <div className="mb-4 flex items-center justify-between">
              <h3 className="text-lg font-bold text-slate-900">Recent activity</h3>
              <Button variant="ghost" size="sm" className="text-teal-700 hover:text-teal-800" onClick={() => navigate("/jobs")}>
                Find work <ArrowRight className="ml-1 h-4 w-4" />
              </Button>
            </div>
            <BidsSection userId={userId} />
          </div>
        </div>

        {/* Right rail */}
        <div className="space-y-6">
          {/* Profile summary */}
          <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
            <div className="h-16 bg-gradient-to-r from-teal-500 to-cyan-500" />
            <div className="px-6 pb-6">
              <Avatar className="-mt-10 h-20 w-20 border-4 border-white shadow-sm">
                <AvatarImage src={profile?.avatar_url || ""} />
                <AvatarFallback className="bg-slate-100 text-lg font-bold text-slate-500">
                  {(profile?.name || "U").split(" ").map((n: string) => n[0]).join("").slice(0, 2).toUpperCase()}
                </AvatarFallback>
              </Avatar>
              <h3 className="mt-3 text-lg font-bold text-slate-900">{profile?.name || "Your name"}</h3>
              {profile?.headline && <p className="text-sm text-slate-500">{profile.headline}</p>}
              <div className="mt-3 flex flex-wrap items-center gap-3 text-sm text-slate-500">
                {stats.reviewCount > 0 ? (
                  <span className="inline-flex items-center gap-1">
                    <Star className="h-4 w-4 fill-amber-400 text-amber-400" />
                    <span className="font-semibold text-slate-900">{stats.rating.toFixed(1)}</span>
                    <span className="text-slate-400">({stats.reviewCount})</span>
                  </span>
                ) : (
                  <span className="text-slate-400">No reviews yet</span>
                )}
                {profile?.location && <span className="inline-flex items-center gap-1"><MapPin className="h-4 w-4" />{profile.location}</span>}
              </div>
              {memberSince && <p className="mt-1 text-xs text-slate-400">Member since {memberSince}</p>}
              <div className="mt-4 grid grid-cols-2 gap-2">
                <Button onClick={() => navigate(`/freelancer/${userId}`)} variant="outline" className="border-slate-200">
                  <UserIcon className="mr-1.5 h-4 w-4" /> View
                </Button>
                <Button onClick={() => navigate("/profile")} className="bg-teal-600 text-white hover:bg-teal-700">Edit</Button>
              </div>
            </div>
          </div>

          <ProfileCompleteness userId={userId} />

          <BidUsageCounter bidsThisMonth={stats.bidsThisMonth} maxBids={10} isPremium={stats.isPremium} />

          {!stats.isPremium && <PremiumSection userId={userId} />}
        </div>
      </div>
    </div>
  );
};

export default FreelancerDashboard;
