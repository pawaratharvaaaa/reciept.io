import { AppShell } from "@/components/layout/AppShell";
import { CustomerManager } from "@/components/customers/CustomerManager";

export default function CustomersPage() {
  return (
    <AppShell>
      <CustomerManager />
    </AppShell>
  );
}
