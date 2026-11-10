import React from "react";
import { Receipt } from "@/lib/types/receipt";
import { formatCurrency } from "@/lib/financial/currencies";

interface TemplateProps {
  receipt: Receipt;
}

export const RetailTemplate: React.FC<TemplateProps> = ({ receipt }) => {
  const {
    id,
    receiptNumber,
    receiptType,
    status,
    currency,
    issueDate,
    transactionDate,
    businessSnapshot,
    customerSnapshot,
    items,
    subtotalMinor,
    discountMinor,
    taxMinor,
    totalMinor,
    amountPaidMinor,
    balanceDueMinor,
    notes,
    terms,
    footerMessage,
  } = receipt;

  return (
    <div className="receipt-card-wrapper w-full max-w-[420px] mx-auto bg-white text-slate-900 p-5 sm:p-6 font-mono text-xs shadow-sm border border-slate-200 print:border-none print:shadow-none print:rounded-none print:p-0 print:w-full print:max-w-full">
      {/* Header */}
      <div className="text-center pb-3 border-b border-dashed border-slate-400 space-y-1">
        {businessSnapshot.logoUrl && (
          <div className="flex justify-center mb-1.5">
            <img
              src={businessSnapshot.logoUrl}
              alt="Logo"
              className="max-h-12 max-w-[120px] object-contain grayscale"
            />
          </div>
        )}
        <h1 className="text-base sm:text-lg font-bold uppercase tracking-wider text-slate-900 leading-tight">
          {businessSnapshot.businessName || "RETAIL STORE"}
        </h1>
        {businessSnapshot.taxIdentifier && (
          <p className="text-[10px] sm:text-[11px] text-slate-600">GSTIN / TAX: {businessSnapshot.taxIdentifier}</p>
        )}
        {businessSnapshot.address?.line1 && (
          <p className="text-[10px] text-slate-500 leading-tight">{businessSnapshot.address.line1}</p>
        )}
        {businessSnapshot.phone && (
          <p className="text-[10px] text-slate-500">Tel: {businessSnapshot.phone}</p>
        )}
      </div>

      {/* Meta Information Bar - Clean, Symmetrical Key-Value Rows */}
      <div className="py-2.5 border-b border-dashed border-slate-400 text-[10px] sm:text-[11px] space-y-1">
        <div className="flex justify-between items-center">
          <span className="text-slate-600">RECEIPT #:</span>
          <span className="font-bold text-slate-900 font-mono">{receiptNumber}</span>
        </div>
        <div className="flex justify-between items-center">
          <span className="text-slate-600">DATE:</span>
          <span className="font-mono text-slate-800">{issueDate}</span>
        </div>
        {customerSnapshot.name && customerSnapshot.name !== "Walk-in Customer" && (
          <div className="flex justify-between items-center pt-1 border-t border-dotted border-slate-300">
            <span className="text-slate-600">CUSTOMER:</span>
            <span className="font-semibold truncate max-w-[160px] text-slate-900">{customerSnapshot.name}</span>
          </div>
        )}
      </div>

      {/* Itemized List - Universal 58mm & 80mm Overlap-Free POS Layout */}
      <div className="py-2.5 border-b border-dashed border-slate-400">
        <div className="flex justify-between items-center text-[9px] sm:text-[10px] font-bold text-slate-500 uppercase tracking-wider pb-1 mb-1.5 border-b border-slate-300">
          <span>ITEM</span>
          <span className="text-right">TOTAL</span>
        </div>

        <div className="divide-y divide-dotted divide-slate-200">
          {items.map((item, idx) => (
            <div key={item.id || idx} className="py-1.5 space-y-0.5">
              {/* Line 1: Item description gets full width, never wrapping into tiny slivers */}
              <div className="font-medium text-slate-900 leading-snug break-words text-[11px] sm:text-xs">
                {item.description}
              </div>

              {/* Line 2: Qty x Unit Price on Left, Total Amount on Far Right - Impossible to overlap */}
              <div className="flex justify-between items-center text-[10px] sm:text-[11px] font-mono text-slate-600 pt-0.5">
                <div className="flex items-center gap-1">
                  <span className="text-slate-800 font-semibold">{item.quantity}</span>
                  <span className="text-slate-400">×</span>
                  <span className="text-slate-700">
                    {formatCurrency(item.unitPriceMinor, currency, { showSymbol: false })}
                  </span>
                  {item.taxRate > 0 && (
                    <span className="text-slate-400 text-[9px]">({item.taxRate}% tax)</span>
                  )}
                </div>
                <div className="font-bold text-slate-900 text-right">
                  {formatCurrency(item.lineTotalMinor, currency, { showSymbol: false })}
                </div>
              </div>

              {item.skuSnapshot && (
                <div className="text-[9px] text-slate-400 font-mono">
                  SKU: {item.skuSnapshot}
                </div>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Totals Breakdown */}
      <div className="py-2.5 border-b border-dashed border-slate-400 space-y-1 text-[10px] sm:text-[11px]">
        <div className="flex justify-between items-center">
          <span className="text-slate-600">SUBTOTAL:</span>
          <span className="font-mono font-medium">{formatCurrency(subtotalMinor, currency)}</span>
        </div>
        {discountMinor > 0 && (
          <div className="flex justify-between items-center text-emerald-700">
            <span>DISCOUNT:</span>
            <span className="font-mono font-medium">-{formatCurrency(discountMinor, currency)}</span>
          </div>
        )}
        {taxMinor > 0 && (
          <div className="flex justify-between items-center text-slate-600">
            <span>TAX (GST/VAT):</span>
            <span className="font-mono font-medium">{formatCurrency(taxMinor, currency)}</span>
          </div>
        )}
        <div className="flex justify-between items-center text-xs sm:text-sm font-bold pt-1.5 border-t border-slate-900">
          <span>TOTAL:</span>
          <span className="font-mono">{formatCurrency(totalMinor, currency)}</span>
        </div>
        <div className="flex justify-between items-center text-slate-600 pt-0.5">
          <span>PAID AMOUNT:</span>
          <span className="font-semibold font-mono text-emerald-700">{formatCurrency(amountPaidMinor, currency)}</span>
        </div>
        {balanceDueMinor > 0 ? (
          <div className="flex justify-between items-center text-rose-700 font-bold">
            <span>BALANCE DUE:</span>
            <span className="font-mono">{formatCurrency(balanceDueMinor, currency)}</span>
          </div>
        ) : (
          <div className="flex justify-between items-center text-emerald-700 font-semibold text-[9px] sm:text-[10px]">
            <span>STATUS:</span>
            <span>PAID IN FULL</span>
          </div>
        )}
      </div>

      {/* Footer Notes & Barcode */}
      <div className="pt-3 text-center space-y-1.5 text-[9px] sm:text-[10px] text-slate-600">
        {notes && <p className="italic leading-snug">{notes}</p>}
        {terms && <p className="text-[9px] text-slate-500 leading-tight">{terms}</p>}
        {footerMessage ? (
          <p className="font-semibold">{footerMessage}</p>
        ) : (
          <p className="font-bold text-slate-800">*** THANK YOU FOR YOUR BUSINESS ***</p>
        )}

        {/* Authentic Vector Barcode */}
        <div className="pt-2 flex flex-col items-center justify-center space-y-0.5">
          <svg className="h-7 w-40 text-slate-900" viewBox="0 0 160 28" fill="currentColor">
            {/* Start Guard */}
            <rect x="0" y="0" width="2" height="28" />
            <rect x="4" y="0" width="2" height="28" />
            {/* Data bars */}
            <rect x="9" y="0" width="3" height="24" />
            <rect x="14" y="0" width="1.5" height="24" />
            <rect x="18" y="0" width="3.5" height="24" />
            <rect x="24" y="0" width="2" height="24" />
            <rect x="28" y="0" width="1.5" height="24" />
            <rect x="32" y="0" width="3" height="24" />
            <rect x="38" y="0" width="2" height="24" />
            <rect x="43" y="0" width="3.5" height="24" />
            <rect x="49" y="0" width="1.5" height="24" />
            <rect x="53" y="0" width="3" height="24" />
            <rect x="58" y="0" width="2" height="24" />
            <rect x="63" y="0" width="3.5" height="24" />
            <rect x="69" y="0" width="1.5" height="24" />
            <rect x="73" y="0" width="3" height="24" />
            <rect x="78" y="0" width="2" height="24" />
            {/* Center Guard */}
            <rect x="83" y="0" width="1.5" height="28" />
            <rect x="86" y="0" width="1.5" height="28" />
            {/* Data bars */}
            <rect x="91" y="0" width="3" height="24" />
            <rect x="96" y="0" width="2" height="24" />
            <rect x="100" y="0" width="3.5" height="24" />
            <rect x="106" y="0" width="1.5" height="24" />
            <rect x="110" y="0" width="3" height="24" />
            <rect x="115" y="0" width="2" height="24" />
            <rect x="120" y="0" width="3.5" height="24" />
            <rect x="126" y="0" width="1.5" height="24" />
            <rect x="130" y="0" width="3.5" height="24" />
            <rect x="136" y="0" width="2" height="24" />
            <rect x="141" y="0" width="3" height="24" />
            <rect x="146" y="0" width="1.5" height="24" />
            {/* End Guard */}
            <rect x="151" y="0" width="2" height="28" />
            <rect x="155" y="0" width="2" height="28" />
          </svg>
          <span className="font-mono text-[9px] text-slate-500 tracking-widest uppercase">
            *{receiptNumber}*
          </span>
        </div>
      </div>
    </div>
  );
};
