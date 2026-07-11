import { useEffect, useState, useCallback } from "react";
import DashboardShell from "@/components/layout/DashboardShell";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Loader2, TrendingUp, Wallet, ArrowDownCircle, ShieldCheck } from "lucide-react";

interface EscrowRow {
  id: string;
  amount: number;
  status: string;
  created_at: string;
  released_at: string | null;
  client_id: string;
  freelancer_id: string;
  jobs: { title: string } | null;
}

interface PaymentRow {
  id: string;
  amount: number;
  status: string;
  type: string;
  created_at: string;
}

const currency = (value: number) =>
  new Intl.NumberFormat(undefined, { style: "currency", currency: "USD", maximumFractionDigits: 0 }).format(value || 0);

const statusColor: Record<string, string> = {
  completed: "bg-green-100 text-green-700",
  released: "bg-green-100 text-green-700",
  held: "bg-amber-100 text-amber-700",
  pending: "bg-amber-100 text-amber-700",
  failed: "bg-red-100 text-red-700",
  refunded: "bg-slate-100 text-slate-600",
};

const StatCard = ({ label, value, icon: Icon, tone }: { label: string; value: string; icon: any; tone: string }) => (
  <div className="bg-white border border-slate-200 rounded-lg p-5 shadow-sm">
    <div className={`h-10 w-10 rounded-lg flex items-center justify-center mb-3 ${tone}`}>
      <Icon className="h-5 w-5" />
    </div>
    <p className="text-sm font-medium text-slate-500">{label}</p>
    <p className="text-2xl font-extrabold text-slate-900 mt-1">{value}</p>
  </div>
);

const Payments = () => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [escrows, setEscrows] = useState<EscrowRow[]>([]);
  const [payments, setPayments] = useState<PaymentRow[]>([]);
  const [statusFilter, setStatusFilter] = useState<string>("all");

  const load = useCallback(async () => {
    if (!user) return;
    setLoading(true);

    const [escrowRes, paymentRes] = await Promise.all([
      supabase
        .from("escrow_transactions")
        .select("id, amount, status, created_at, released_at, client_id, freelancer_id, jobs(title)")
        .or(`client_id.eq.${user.id},freelancer_id.eq.${user.id}`)
        .order("created_at", { ascending: false }),
      supabase
        .from("payments")
        .select("id, amount, status, type, created_at")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false }),
    ]);

    setEscrows((escrowRes.data as any) || []);
    setPayments((paymentRes.data as any) || []);
    setLoading(false);
  }, [user]);

  useEffect(() => { load(); }, [load]);

  const earned = escrows
    .filter((e) => e.freelancer_id === user?.id && e.status === "released")
    .reduce((sum, e) => sum + Number(e.amount), 0);
  const inEscrow = escrows
    .filter((e) => e.freelancer_id === user?.id && e.status === "held")
    .reduce((sum, e) => sum + Number(e.amount), 0);
  const spent = escrows
    .filter((e) => e.client_id === user?.id && (e.status === "released" || e.status === "held"))
    .reduce((sum, e) => sum + Number(e.amount), 0);
  const activeEscrows = escrows.filter((e) => e.status === "held").length;

  const visibleEscrows = statusFilter === "all" ? escrows : escrows.filter((e) => e.status === statusFilter);

  if (!user) return null;

  return (
    <DashboardShell userRole="all" onRoleChange={() => {}}>
      <div className="space-y-8">
        <div>
          <h1 className="text-3xl font-bold text-slate-900 tracking-tight">Payments &amp; Escrow</h1>
          <p className="text-slate-600 mt-1">Track your earnings, spending, and escrow activity.</p>
        </div>

        {loading ? (
          <div className="flex justify-center py-20"><Loader2 className="h-8 w-8 animate-spin text-teal-600" /></div>
        ) : (
          <>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
              <StatCard label="Total Earned" value={currency(earned)} icon={TrendingUp} tone="bg-green-100 text-green-600" />
              <StatCard label="Pending in Escrow" value={currency(inEscrow)} icon={Wallet} tone="bg-amber-100 text-amber-600" />
              <StatCard label="Total Spent" value={currency(spent)} icon={ArrowDownCircle} tone="bg-blue-100 text-blue-600" />
              <StatCard label="Active Escrows" value={String(activeEscrows)} icon={ShieldCheck} tone="bg-teal-100 text-teal-600" />
            </div>

            {/* Escrow ledger */}
            <div className="bg-white border border-slate-200 rounded-lg shadow-sm">
              <div className="flex items-center justify-between p-5 border-b border-slate-100">
                <h3 className="font-bold text-lg text-slate-900">Escrow Transactions</h3>
                <Select value={statusFilter} onValueChange={setStatusFilter}>
                  <SelectTrigger className="w-[160px] h-9 border-slate-200"><SelectValue placeholder="Status" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All statuses</SelectItem>
                    <SelectItem value="held">Held</SelectItem>
                    <SelectItem value="released">Released</SelectItem>
                    <SelectItem value="refunded">Refunded</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              {visibleEscrows.length === 0 ? (
                <div className="p-8 text-center text-slate-500 text-sm">No escrow transactions yet.</div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead className="text-left text-slate-500 border-b border-slate-100">
                      <tr>
                        <th className="px-5 py-3 font-medium">Project</th>
                        <th className="px-5 py-3 font-medium">Role</th>
                        <th className="px-5 py-3 font-medium">Amount</th>
                        <th className="px-5 py-3 font-medium">Status</th>
                        <th className="px-5 py-3 font-medium">Date</th>
                      </tr>
                    </thead>
                    <tbody>
                      {visibleEscrows.map((e) => (
                        <tr key={e.id} className="border-b border-slate-50 last:border-0 hover:bg-slate-50">
                          <td className="px-5 py-3 font-medium text-slate-900">{e.jobs?.title || "Project"}</td>
                          <td className="px-5 py-3 text-slate-600">{e.freelancer_id === user.id ? "Freelancer" : "Client"}</td>
                          <td className="px-5 py-3 font-semibold text-slate-900">{currency(Number(e.amount))}</td>
                          <td className="px-5 py-3">
                            <Badge className={`${statusColor[e.status] || "bg-slate-100 text-slate-600"} border-0 capitalize`}>{e.status}</Badge>
                          </td>
                          <td className="px-5 py-3 text-slate-500">{new Date(e.created_at).toLocaleDateString()}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>

            {/* Payment history */}
            <div className="bg-white border border-slate-200 rounded-lg shadow-sm">
              <div className="p-5 border-b border-slate-100">
                <h3 className="font-bold text-lg text-slate-900">Payment History</h3>
              </div>
              {payments.length === 0 ? (
                <div className="p-8 text-center text-slate-500 text-sm">No payments recorded yet.</div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead className="text-left text-slate-500 border-b border-slate-100">
                      <tr>
                        <th className="px-5 py-3 font-medium">Type</th>
                        <th className="px-5 py-3 font-medium">Amount</th>
                        <th className="px-5 py-3 font-medium">Status</th>
                        <th className="px-5 py-3 font-medium">Date</th>
                      </tr>
                    </thead>
                    <tbody>
                      {payments.map((p) => (
                        <tr key={p.id} className="border-b border-slate-50 last:border-0 hover:bg-slate-50">
                          <td className="px-5 py-3 font-medium text-slate-900 capitalize">{p.type.replace(/_/g, " ")}</td>
                          <td className="px-5 py-3 font-semibold text-slate-900">{currency(Number(p.amount))}</td>
                          <td className="px-5 py-3">
                            <Badge className={`${statusColor[p.status] || "bg-slate-100 text-slate-600"} border-0 capitalize`}>{p.status}</Badge>
                          </td>
                          <td className="px-5 py-3 text-slate-500">{new Date(p.created_at).toLocaleDateString()}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </>
        )}
      </div>
    </DashboardShell>
  );
};

export default Payments;
