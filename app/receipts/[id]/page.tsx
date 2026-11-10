import { Suspense } from "react";
import { AppShell } from "@/components/layout/AppShell";
import { ReceiptDetailView } from "@/components/receipts/ReceiptDetailView";

interface PageProps {
  params: Promise<{ id: string }>;
}

async function ReceiptDetailContent({ params }: PageProps) {
  const { id } = await params;
  return <ReceiptDetailView id={id} />;
}

export default function ReceiptDetailPage({ params }: PageProps) {
  return (
    <AppShell>
      <Suspense
        fallback={
          <div className="p-12 text-center text-xs text-[#777777]">
            Loading receipt...
          </div>
        }
      >
        <ReceiptDetailContent params={params} />
      </Suspense>
    </AppShell>
  );
}
