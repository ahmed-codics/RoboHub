import { useEffect, useMemo, useState } from "react";
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
} from "recharts";
import {
  Loader2,
  DollarSign,
  Gavel,
  CheckCircle2,
  Star,
  Briefcase,
  Activity,
  ClipboardList,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useUserRole } from "@/hooks/useUserRole";
import DashboardShell from "@/components/layout/DashboardShell";

const TEAL = "#0d9488";
const SLATE = "#64748b";
const AMBER = "#f59e0b";

const currency = new Intl.NumberFormat("en-US", {
  style: "currency",
  currency: "USD",
  maximumFractionDigits: 0,
});

const MONTH_LABELS = [
  "Jan",
  "Feb",
  "Mar",
  "Apr",
  "May",
  "Jun",
  "Jul",
  "Aug",
  "Sep",
  "Oct",
  "Nov",
  "Dec",
];

type MonthBucket = {
  key: string; // year-month e.g. "2026-06"
  label: string; // e.g. "Jun"
};

// Build the last 6 month buckets (oldest first) so charts always have a baseline.
const buildMonthBuckets = (): MonthBucket[] => {
  const buckets: MonthBucket[] = [];
  const now = new Date();
  for (let i = 5; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
    buckets.push({ key, label: MONTH_LABELS[d.getMonth()] });
  }
  return buckets;
};

const monthKeyOf = (dateStr: string | null): string | null => {
  if (!dateStr) return null;
  const d = new Date(dateStr);
  if (Number.isNaN(d.getTime())) return null;
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
};

type FreelancerData = {
  totalEarned: number;
  totalBids: number;
  acceptedBids: number;
  avgRating: number | null;
  earnings: Array<{ label: string; value: number }>;
  bidsPerMonth: Array<{ label: string; total: number; accepted: number }>;
};

type ClientData = {
  totalSpent: number;
  jobsPosted: number;
  activeProjects: number;
  completed: number;
  spending: Array<{ label: string; value: number }>;
  jobsPerMonth: Array<{ label: string; value: number }>;
};

const StatTile = ({
  icon: Icon,
  label,
  value,
}: {
  icon: typeof DollarSign;
  label: string;
  value: string;
}) => (
  <div className="bg-white border border-slate-200 rounded-lg shadow-sm p-6">
    <div className="flex items-center gap-2 text-slate-500">
      <Icon className="h-4 w-4 text-teal-600" />
      <span className="text-sm font-medium">{label}</span>
    </div>
    <p className="mt-2 text-2xl font-semibold text-slate-900">{value}</p>
  </div>
);

const ChartCard = ({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) => (
  <Card className="border-slate-200 rounded-lg shadow-sm">
    <CardHeader>
      <CardTitle className="text-base font-semibold text-slate-900">
        {title}
      </CardTitle>
    </CardHeader>
    <CardContent>
      <ResponsiveContainer width="100%" height={260}>
        {children as React.ReactElement}
      </ResponsiveContainer>
    </CardContent>
  </Card>
);

const axisProps = {
  tick: { fontSize: 12, fill: SLATE },
  stroke: SLATE,
};

const gridProps = { strokeDasharray: "3 3", stroke: "#e2e8f0" };

const FreelancerView = ({ data }: { data: FreelancerData }) => {
  const acceptanceRate =
    data.totalBids > 0
      ? Math.round((data.acceptedBids / data.totalBids) * 100)
      : 0;

  return (
    <div className="space-y-8">
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatTile
          icon={DollarSign}
          label="Total Earned"
          value={currency.format(data.totalEarned)}
        />
        <StatTile icon={Gavel} label="Total Bids" value={String(data.totalBids)} />
        <StatTile
          icon={CheckCircle2}
          label="Acceptance Rate"
          value={`${acceptanceRate}%`}
        />
        <StatTile
          icon={Star}
          label="Avg Rating"
          value={data.avgRating === null ? "—" : data.avgRating.toFixed(1)}
        />
      </div>

      <ChartCard title="Earnings (last 6 months)">
        <AreaChart data={data.earnings} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
          <defs>
            <linearGradient id="earningsFill" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor={TEAL} stopOpacity={0.3} />
              <stop offset="95%" stopColor={TEAL} stopOpacity={0} />
            </linearGradient>
          </defs>
          <CartesianGrid {...gridProps} />
          <XAxis dataKey="label" {...axisProps} />
          <YAxis {...axisProps} />
          <Tooltip formatter={(v: number) => currency.format(v)} />
          <Area
            type="monotone"
            dataKey="value"
            name="Earnings"
            stroke={TEAL}
            strokeWidth={2}
            fill="url(#earningsFill)"
          />
        </AreaChart>
      </ChartCard>

      <ChartCard title="Bids per month">
        <BarChart data={data.bidsPerMonth} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
          <CartesianGrid {...gridProps} />
          <XAxis dataKey="label" {...axisProps} />
          <YAxis {...axisProps} allowDecimals={false} />
          <Tooltip />
          <Bar dataKey="total" name="Total Bids" fill={SLATE} radius={[4, 4, 0, 0]} />
          <Bar dataKey="accepted" name="Accepted" fill={TEAL} radius={[4, 4, 0, 0]} />
        </BarChart>
      </ChartCard>
    </div>
  );
};

const ClientView = ({ data }: { data: ClientData }) => (
  <div className="space-y-8">
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
      <StatTile
        icon={DollarSign}
        label="Total Spent"
        value={currency.format(data.totalSpent)}
      />
      <StatTile
        icon={ClipboardList}
        label="Jobs Posted"
        value={String(data.jobsPosted)}
      />
      <StatTile
        icon={Activity}
        label="Active Projects"
        value={String(data.activeProjects)}
      />
      <StatTile
        icon={Briefcase}
        label="Completed"
        value={String(data.completed)}
      />
    </div>

    <ChartCard title="Spending (last 6 months)">
      <AreaChart data={data.spending} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
        <defs>
          <linearGradient id="spendingFill" x1="0" y1="0" x2="0" y2="1">
            <stop offset="5%" stopColor={AMBER} stopOpacity={0.3} />
            <stop offset="95%" stopColor={AMBER} stopOpacity={0} />
          </linearGradient>
        </defs>
        <CartesianGrid {...gridProps} />
        <XAxis dataKey="label" {...axisProps} />
        <YAxis {...axisProps} />
        <Tooltip formatter={(v: number) => currency.format(v)} />
        <Area
          type="monotone"
          dataKey="value"
          name="Spending"
          stroke={AMBER}
          strokeWidth={2}
          fill="url(#spendingFill)"
        />
      </AreaChart>
    </ChartCard>

    <ChartCard title="Jobs posted per month">
      <BarChart data={data.jobsPerMonth} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
        <CartesianGrid {...gridProps} />
        <XAxis dataKey="label" {...axisProps} />
        <YAxis {...axisProps} allowDecimals={false} />
        <Tooltip />
        <Bar dataKey="value" name="Jobs Posted" fill={TEAL} radius={[4, 4, 0, 0]} />
      </BarChart>
    </ChartCard>
  </div>
);

const Analytics = () => {
  const { user } = useAuth();
  const { userRole, refreshRole } = useUserRole();

  const [activeView, setActiveView] = useState<"freelancer" | "client">(
    "freelancer"
  );
  const [loading, setLoading] = useState(true);
  const [freelancerData, setFreelancerData] = useState<FreelancerData | null>(
    null
  );
  const [clientData, setClientData] = useState<ClientData | null>(null);

  const buckets = useMemo(() => buildMonthBuckets(), []);

  // Default the toggle to the user's role once it resolves.
  useEffect(() => {
    setActiveView(userRole === "client" ? "client" : "freelancer");
  }, [userRole]);

  useEffect(() => {
    if (!user) return;
    let cancelled = false;

    const load = async () => {
      setLoading(true);

      const [
        escrowRes,
        bidsRes,
        reviewsRes,
        clientEscrowRes,
        jobsRes,
      ] = await Promise.all([
        supabase
          .from("escrow_transactions")
          .select("amount, status, released_at, created_at")
          .eq("freelancer_id", user.id),
        supabase
          .from("bids")
          .select("status, created_at")
          .eq("freelancer_id", user.id),
        supabase.from("reviews").select("rating").eq("reviewee_id", user.id),
        supabase
          .from("escrow_transactions")
          .select("amount, status, created_at")
          .eq("client_id", user.id),
        supabase
          .from("jobs")
          .select("status, created_at")
          .eq("client_id", user.id),
      ]);

      if (cancelled) return;

      // ---- Freelancer ----
      const escrow = escrowRes.data ?? [];
      const bids = bidsRes.data ?? [];
      const reviews = reviewsRes.data ?? [];

      const releasedEscrow = escrow.filter((e) => e.status === "released");
      const totalEarned = releasedEscrow.reduce(
        (sum, e) => sum + (Number(e.amount) || 0),
        0
      );
      const acceptedBids = bids.filter((b) => b.status === "accepted").length;
      const avgRating =
        reviews.length > 0
          ? reviews.reduce((sum, r) => sum + (Number(r.rating) || 0), 0) /
            reviews.length
          : null;

      const earnings = buckets.map((b) => {
        const value = releasedEscrow
          .filter((e) => monthKeyOf(e.released_at ?? e.created_at) === b.key)
          .reduce((sum, e) => sum + (Number(e.amount) || 0), 0);
        return { label: b.label, value };
      });

      const bidsPerMonth = buckets.map((b) => {
        const monthBids = bids.filter(
          (bid) => monthKeyOf(bid.created_at) === b.key
        );
        return {
          label: b.label,
          total: monthBids.length,
          accepted: monthBids.filter((bid) => bid.status === "accepted").length,
        };
      });

      setFreelancerData({
        totalEarned,
        totalBids: bids.length,
        acceptedBids,
        avgRating,
        earnings,
        bidsPerMonth,
      });

      // ---- Client ----
      const clientEscrow = clientEscrowRes.data ?? [];
      const jobs = jobsRes.data ?? [];

      const spentEscrow = clientEscrow.filter(
        (e) => e.status === "held" || e.status === "released"
      );
      const totalSpent = spentEscrow.reduce(
        (sum, e) => sum + (Number(e.amount) || 0),
        0
      );

      const spending = buckets.map((b) => {
        const value = spentEscrow
          .filter((e) => monthKeyOf(e.created_at) === b.key)
          .reduce((sum, e) => sum + (Number(e.amount) || 0), 0);
        return { label: b.label, value };
      });

      const jobsPerMonth = buckets.map((b) => ({
        label: b.label,
        value: jobs.filter((j) => monthKeyOf(j.created_at) === b.key).length,
      }));

      setClientData({
        totalSpent,
        jobsPosted: jobs.length,
        activeProjects: jobs.filter((j) => j.status === "in_progress").length,
        completed: jobs.filter((j) => j.status === "completed").length,
        spending,
        jobsPerMonth,
      });

      setLoading(false);
    };

    load();

    return () => {
      cancelled = true;
    };
  }, [user, buckets]);

  if (!user) return null;

  const hasFreelancerActivity =
    (freelancerData?.totalBids ?? 0) > 0 ||
    (freelancerData?.totalEarned ?? 0) > 0;
  const hasClientActivity =
    (clientData?.jobsPosted ?? 0) > 0 || (clientData?.totalSpent ?? 0) > 0;

  return (
    <DashboardShell userRole={userRole} onRoleChange={refreshRole}>
      <div className="space-y-8">
        <div>
          <h1 className="text-2xl font-semibold text-slate-900">Analytics</h1>
          <p className="mt-1 text-sm text-slate-500">
            Insights into your marketplace activity.
          </p>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-24">
            <Loader2 className="h-8 w-8 animate-spin text-teal-600" />
          </div>
        ) : (
          <Tabs
            value={activeView}
            onValueChange={(v) => setActiveView(v as "freelancer" | "client")}
          >
            <TabsList>
              <TabsTrigger value="freelancer">Freelancer</TabsTrigger>
              <TabsTrigger value="client">Client</TabsTrigger>
            </TabsList>

            <TabsContent value="freelancer" className="mt-6">
              {!hasFreelancerActivity && (
                <p className="mb-4 text-sm text-slate-500">
                  No freelancer activity yet — charts show a baseline until you
                  start bidding and earning.
                </p>
              )}
              {freelancerData && <FreelancerView data={freelancerData} />}
            </TabsContent>

            <TabsContent value="client" className="mt-6">
              {!hasClientActivity && (
                <p className="mb-4 text-sm text-slate-500">
                  No client activity yet — charts show a baseline until you post
                  jobs and fund escrow.
                </p>
              )}
              {clientData && <ClientView data={clientData} />}
            </TabsContent>
          </Tabs>
        )}
      </div>
    </DashboardShell>
  );
};

export default Analytics;
