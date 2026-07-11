import { ReactNode } from "react";
import AppShell from "./AppShell";
import DashboardShell from "./DashboardShell";
import { useAuth } from "@/hooks/useAuth";
import { useUserRole } from "@/hooks/useUserRole";

/**
 * Renders the authenticated dashboard chrome (sidebar) for signed-in users and
 * the public marketing chrome (navbar/footer) for guests. Used by pages that are
 * both reachable from the dashboard sidebar and publicly browsable (e.g. Services).
 */
const AdaptiveShell = ({ children }: { children: ReactNode }) => {
  const { user, loading } = useAuth();
  const { userRole, refreshRole } = useUserRole();

  if (loading) return null;

  if (user) {
    return (
      <DashboardShell userRole={userRole} onRoleChange={refreshRole}>
        {children}
      </DashboardShell>
    );
  }

  return <AppShell>{children}</AppShell>;
};

export default AdaptiveShell;
