"use client";

import React, { useState, useEffect } from "react";
import { BarChart3, Download, Calendar, DollarSign, CreditCard, FileSpreadsheet, CheckCircle } from "lucide-react";
import { Receipt } from "@/lib/types/receipt";
import { formatCurrency } from "@/lib/financial/currencies";
import { fromMinorUnits } from "@/lib/financial/calculations";
import { db } from "@/lib/offline/db";

export const AnalyticsView: React.FC = () => {
  const [receipts, setReceipts] = useState<Receipt[]>([]);
  const [timeRange, setTimeRange] = useState<"all" | "30d" | "90d" | "year">("all");
  const [downloadSuccess, setDownloadSuccess] = useState(false);
  const [referenceTime, setReferenceTime] = useState<number>(0);

  useEffect(() => {
    setReferenceTime(Date.now());
    async function loadReceipts() {
      const all = await db.receipts.toArray();
      setReceipts(all);
    }
    loadReceipts();
  }, []);

  const defaultCurrency = receipts[0]?.currency || "INR";

  // Filter based on range
  const filteredReceipts = receipts.filter((r) => {
    if (r.status === "voided" || r.status === "cancelled") return false;
    if (timeRange === "all" || !referenceTime) return true;

    const receiptTime = new Date(r.issueDate).getTime();
    if (timeRange === "30d") return referenceTime - receiptTime <= 30 * 86400000;
    if (timeRange === "90d") return referenceTime - receiptTime <= 90 * 86400000;
    if (timeRange === "year") return referenceTime - receiptTime <= 365 * 86400000;
    return true;
  });

  const totalSalesMinor = filteredReceipts.reduce((acc, curr) => acc + (curr.totalMinor || 0), 0);
  const totalTaxMinor = filteredReceipts.reduce((acc, curr) => acc + (curr.taxMinor || 0), 0);
  const totalPaidMinor = filteredReceipts.reduce((acc, curr) => acc + (curr.amountPaidMinor || 0), 0);
  const totalOutstandingMinor = Math.max(0, totalSalesMinor - totalPaidMinor);

  // Group by Payment Method
  const methodMap: Record<string, number> = {};
  filteredReceipts.forEach((r) => {
    r.payments.forEach((p) => {
      methodMap[p.paymentMethod] = (methodMap[p.paymentMethod] || 0) + p.amountMinor;
    });
  });

  // Export to CSV function
  const handleExportCSV = () => {
    const headers = [
      "Receipt Number",
      "Type",
      "Status",
      "Issue Date",
      "Transaction Date",
      "Customer Name",
      "Customer Email",
      "Currency",
      "Subtotal",
      "Tax",
      "Total Amount",
      "Amount Paid",
      "Balance Due",
      "Notes",
    ];

    const rows = filteredReceipts.map((r) => [
      `"${r.receiptNumber}"`,
      `"${r.receiptType}"`,
      `"${r.status}"`,
      `"${r.issueDate}"`,
      `"${r.transactionDate}"`,
      `"${r.customerSnapshot.name.replace(/"/g, '""')}"`,
      `"${(r.customerSnapshot.email || "").replace(/"/g, '""')}"`,
      `"${r.currency}"`,
      fromMinorUnits(r.subtotalMinor).toFixed(2),
      fromMinorUnits(r.taxMinor).toFixed(2),
      fromMinorUnits(r.totalMinor).toFixed(2),
      fromMinorUnits(r.amountPaidMinor).toFixed(2),
      fromMinorUnits(r.balanceDueMinor).toFixed(2),
      `"${(r.notes || "").replace(/"/g, '""')}"`,
    ]);

    const csvContent =
      "data:text/csv;charset=utf-8," +
      [headers.join(","), ...rows.map((e) => e.join(","))].join("\n");

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute(
      "download",
      `reciept_io_financial_report_${new Date().toISOString().split("T")[0]}.csv`
    );
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    setDownloadSuccess(true);
    setTimeout(() => setDownloadSuccess(false), 3000);
  };

  return (
    <div className="p-8 max-w-7xl mx-auto space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-[#171717]">
            Financial Analytics & Reports
          </h1>
          <p className="text-xs text-[#777777] mt-1">
            Consolidated summaries, tax breakdowns, and accountant-ready CSV exports.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <select
            value={timeRange}
            onChange={(e) => setTimeRange(e.target.value as any)}
            className="px-3 py-2 rounded-lg border border-[#E9E7E1] bg-white text-xs font-medium"
          >
            <option value="all">All Time</option>
            <option value="30d">Last 30 Days</option>
            <option value="90d">Last Quarter</option>
            <option value="year">Past 12 Months</option>
          </select>

          <button
            onClick={handleExportCSV}
            className="inline-flex items-center gap-1.5 px-4 py-2 bg-[#171717] hover:bg-[#222222] text-white rounded-lg text-xs font-medium transition shadow-xs"
          >
            {downloadSuccess ? (
              <>
                <CheckCircle className="w-4 h-4 text-emerald-400" />
                <span>Downloaded!</span>
              </>
            ) : (
              <>
                <FileSpreadsheet className="w-4 h-4" />
                <span>Export CSV Report</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* Financial Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white p-5 rounded-xl border border-[#E9E7E1] shadow-xs space-y-2">
          <span className="text-xs text-[#777777]">Total Invoiced Sales</span>
          <div className="font-mono text-2xl font-bold text-[#171717]">
            {formatCurrency(totalSalesMinor, defaultCurrency)}
          </div>
          <p className="text-[11px] text-[#777777]">Across {filteredReceipts.length} receipts</p>
        </div>

        <div className="bg-white p-5 rounded-xl border border-[#E9E7E1] shadow-xs space-y-2">
          <span className="text-xs text-[#777777]">Total Recorded Payments</span>
          <div className="font-mono text-2xl font-bold text-[#24845B]">
            {formatCurrency(totalPaidMinor, defaultCurrency)}
          </div>
          <p className="text-[11px] text-[#24845B]">Verified collections</p>
        </div>

        <div className="bg-white p-5 rounded-xl border border-[#E9E7E1] shadow-xs space-y-2">
          <span className="text-xs text-[#777777]">Total Tax Collected (GST/VAT)</span>
          <div className="font-mono text-2xl font-bold text-[#171717]">
            {formatCurrency(totalTaxMinor, defaultCurrency)}
          </div>
          <p className="text-[11px] text-[#777777]">Accrued tax liabilities</p>
        </div>

        <div className="bg-white p-5 rounded-xl border border-[#E9E7E1] shadow-xs space-y-2">
          <span className="text-xs text-[#777777]">Pending Balance Due</span>
          <div className="font-mono text-2xl font-bold text-[#C64B4B]">
            {formatCurrency(totalOutstandingMinor, defaultCurrency)}
          </div>
          <p className="text-[11px] text-[#C64B4B]">Uncollected accounts receivable</p>
        </div>
      </div>

      {/* Payment Methods Breakdown */}
      <div className="bg-white p-6 rounded-xl border border-[#E9E7E1] shadow-xs space-y-4">
        <h2 className="text-sm font-semibold text-[#171717]">Collections by Payment Channel</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
          {Object.entries(methodMap).map(([method, amountMinor]) => (
            <div key={method} className="bg-[#F7F6F2] p-4 rounded-lg border border-[#E9E7E1] space-y-1">
              <span className="text-xs font-mono capitalize text-[#777777]">
                {method.replace("_", " ")}
              </span>
              <div className="font-mono text-lg font-bold text-[#171717]">
                {formatCurrency(amountMinor, defaultCurrency)}
              </div>
            </div>
          ))}
          {Object.keys(methodMap).length === 0 && (
            <div className="col-span-4 text-xs text-[#777777] italic py-2">
              No payments recorded within this period yet.
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
