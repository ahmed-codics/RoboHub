import DashboardShell from "@/components/layout/DashboardShell";
import { useAuth } from "@/hooks/useAuth";

const Payments = () => {
  const { user } = useAuth();
  
  if (!user) return null;

  return (
    <DashboardShell userRole="all" onRoleChange={() => {}}>
      <div className="space-y-8">
        <div>
          <h1 className="text-3xl font-bold text-slate-900 tracking-tight">Payments & Escrow</h1>
          <p className="text-slate-600 mt-1">Manage your transactions and premium status.</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
           <div className="bg-white border border-slate-200 p-6 rounded-lg shadow-sm">
             <h3 className="font-bold text-lg mb-4">Payment History</h3>
             <div className="text-slate-500 text-sm">No recent transactions.</div>
           </div>
           
           <div className="bg-white border border-slate-200 p-6 rounded-lg shadow-sm">
             <h3 className="font-bold text-lg mb-4">Escrow Status</h3>
             <div className="text-slate-500 text-sm">No active escrow funds.</div>
           </div>
        </div>
      </div>
    </DashboardShell>
  );
};

export default Payments;
