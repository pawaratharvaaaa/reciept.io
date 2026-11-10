import React from "react";
import { Receipt } from "@/lib/types/receipt";
import { RetailTemplate } from "./RetailTemplate";

interface ReceiptRendererProps {
  receipt: Receipt;
  className?: string;
}

export const ReceiptRenderer: React.FC<ReceiptRendererProps> = ({
  receipt,
  className = "",
}) => {
  return (
    <div className={`receipt-printable-canvas ${className}`}>
      <RetailTemplate receipt={receipt} />
    </div>
  );
};
