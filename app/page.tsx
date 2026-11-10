import { AppShell } from "@/components/layout/AppShell";
import { FinancialDashboard } from "@/components/dashboard/FinancialDashboard";

export default function HomePage() {
  return (
    <AppShell>
      <FinancialDashboard />
    </AppShell>
  );
}
