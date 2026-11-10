import { AppShell } from "@/components/layout/AppShell";
import { ProductCatalog } from "@/components/products/ProductCatalog";

export default function ProductsPage() {
  return (
    <AppShell>
      <ProductCatalog />
    </AppShell>
  );
}
