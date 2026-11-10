"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  TrendingUp,
  Receipt as ReceiptIcon,
  CreditCard,
  AlertCircle,
  PlusCircle,
  ArrowUpRight,
  ChevronRight,
  Users,
  Calendar,
} from "lucide-react";
import { Receipt, Customer } from "@/lib/types/receipt";
import { formatCurrency } from "@/lib/financial/currencies";
import { db } from "@/lib/offline/db";
import { useAuth } from "@/lib/auth/auth-context";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
} from "recharts";

export const FinancialDashboard: React.FC = () => {
  const router = useRouter();
  const { user, businessProfile } = useAuth();
  const [receipts, setReceipts] = useState<Receipt[]>([]);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function loadData() {
      const allReceipts = await db.receipts.toArray();
      const allCustomers = await db.customers.toArray();
      setReceipts(allReceipts);
      setCustomers(allCustomers);
      setIsLoading(false);
    }
    loadData();
  }, []);

  // Compute metrics strictly from underlying records
  const totalReceiptsCount = receipts.length;

  const totalRecordedSalesMinor = receipts
    .filter((r) => r.status !== "voided" && r.status !== "cancelled")
    .reduce((acc, curr) => acc + (curr.totalMinor || 0), 0);

  const totalRecordedPaymentsMinor = receipts
    .filter((r) => r.status !== "voided" && r.status !== "cancelled")
    .reduce((acc, curr) => acc + (curr.amountPaidMinor || 0), 0);

  const totalOutstandingMinor = Math.max(
    0,
    totalRecordedSalesMinor - totalRecordedPaymentsMinor
  );

  // Currency from default or first receipt
  const defaultCurrency = receipts[0]?.currency || "INR";

  // Prepare monthly aggregated chart data
  const monthlyDataMap: Record<string, { month: string; sales: number; payments: number }> = {};

  receipts.forEach((r) => {
    if (r.status === "voided" || r.status === "cancelled") return;
    const dateObj = new Date(r.issueDate);
    const monthKey = dateObj.toLocaleDateString("en-US", { month: "short", year: "numeric" });
    if (!monthlyDataMap[monthKey]) {
      monthlyDataMap[monthKey] = { month: monthKey, sales: 0, payments: 0 };
    }
    monthlyDataMap[monthKey].sales += (r.totalMinor || 0) / 100;
    monthlyDataMap[monthKey].payments += (r.amountPaidMinor || 0) / 100;
  });

  const chartData = Object.values(monthlyDataMap);
  if (chartData.length === 0) {
    chartData.push({ month: "Nov 2026", sales: 0, payments: 0 });
  }

  // Payment status distribution for Donut Chart
  const statusCounts = {
    Paid: receipts.filter((r) => r.status === "paid").length,
    "Partially Paid": receipts.filter((r) => r.status === "partially_paid").length,
    Issued: receipts.filter((r) => r.status === "issued").length,
    Draft: receipts.filter((r) => r.status === "draft").length,
  };

  const statusPieData = Object.entries(statusCounts).map(([name, value]) => ({
    name,
    value,
  }));

  const PIE_COLORS = ["#24845B", "#B7791F", "#171717", "#777777"];

  return (
    <div className="p-8 max-w-7xl mx-auto space-y-8">
      {/* Welcome Banner */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-[#171717]">
            Financial Overview
          </h1>
          <p className="text-xs text-[#777777] mt-1">
            Real-time sales, collections, and receipt records for {businessProfile?.businessName || user?.businessName || "Your Business"}.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <Link
            href="/receipts/new"
            className="inline-flex items-center gap-1.5 px-4 py-2 bg-[#171717] hover:bg-[#222222] text-white rounded-lg text-xs font-medium transition shadow-xs"
          >
            <PlusCircle className="w-4 h-4" />
            <span>Create Receipt</span>
          </Link>
        </div>
      </div>

      {/* 4 Stat Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white p-5 rounded-xl border border-[#E9E7E1] shadow-xs space-y-3">
          <div className="flex items-center justify-between text-[#777777]">
            <span className="text-xs font-medium">Total Recorded Sales</span>
            <TrendingUp className="w-4 h-4 text-[#171717]" />
          </div>
          <div className="font-mono text-2xl font-bold text-[#171717]">
            {formatCurrency(totalRecordedSalesMinor, defaultCurrency)}
          </div>
          <div className="text-[11px] text-[#777777] flex items-center gap-1">
            <span>Derived from issued receipts</span>
          </div>
        </div>

        <div className="bg-white p-5 rounded-xl border border-[#E9E7E1] shadow-xs space-y-3">
          <div className="flex items-center justify-between text-[#777777]">
            <span className="text-xs font-medium">Recorded Payments</span>
            <CreditCard className="w-4 h-4 text-[#24845B]" />
          </div>
          <div className="font-mono text-2xl font-bold text-[#24845B]">
            {formatCurrency(totalRecordedPaymentsMinor, defaultCurrency)}
          </div>
          <div className="text-[11px] text-[#24845B] font-medium">
            Settled via UPI & Bank Transfers
          </div>
        </div>

        <div className="bg-white p-5 rounded-xl border border-[#E9E7E1] shadow-xs space-y-3">
          <div className="flex items-center justify-between text-[#777777]">
            <span className="text-xs font-medium">Outstanding Balances</span>
            <AlertCircle className="w-4 h-4 text-[#C64B4B]" />
          </div>
          <div className="font-mono text-2xl font-bold text-[#C64B4B]">
            {formatCurrency(totalOutstandingMinor, defaultCurrency)}
          </div>
          <div className="text-[11px] text-[#C64B4B]">
            Pending customer collection
          </div>
        </div>

        <div className="bg-white p-5 rounded-xl border border-[#E9E7E1] shadow-xs space-y-3">
          <div className="flex items-center justify-between text-[#777777]">
            <span className="text-xs font-medium">Total Receipts</span>
            <ReceiptIcon className="w-4 h-4 text-[#171717]" />
          </div>
          <div className="font-mono text-2xl font-bold text-[#171717]">
            {totalReceiptsCount}
          </div>
          <div className="text-[11px] text-[#777777]">
            Across {customers.length} registered clients
          </div>
        </div>
      </div>

      {/* Analytics Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Monthly Activity Bar Chart */}
        <div className="lg:col-span-2 bg-white p-6 rounded-xl border border-[#E9E7E1] shadow-xs space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-sm font-semibold text-[#171717]">Sales & Collections Trend</h2>
              <p className="text-xs text-[#777777]">Comparison of total billed vs received payments</p>
            </div>
            <span className="text-[11px] font-mono text-[#777777]">In {defaultCurrency}</span>
          </div>

          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                <XAxis dataKey="month" stroke="#777777" fontSize={11} tickLine={false} />
                <YAxis
                  stroke="#777777"
                  fontSize={11}
                  tickLine={false}
                  tickFormatter={(val) => `₹${(val / 1000).toFixed(0)}k`}
                />
                <Tooltip
                  formatter={(val: any) => [`₹${Number(val).toLocaleString()}`, ""]}
                  contentStyle={{
                    backgroundColor: "#171717",
                    borderRadius: "8px",
                    color: "#fff",
                    fontSize: "12px",
                  }}
                />
                <Bar dataKey="sales" name="Billed Sales" fill="#171717" radius={[4, 4, 0, 0]} />
                <Bar dataKey="payments" name="Received Payments" fill="#24845B" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Status Distribution Pie Chart */}
        <div className="bg-white p-6 rounded-xl border border-[#E9E7E1] shadow-xs space-y-4 flex flex-col justify-between">
          <div>
            <h2 className="text-sm font-semibold text-[#171717]">Receipt Status Breakdown</h2>
            <p className="text-xs text-[#777777]">Distribution across all receipts</p>
          </div>

          <div className="h-44 w-full flex items-center justify-center">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={statusPieData}
                  cx="50%"
                  cy="50%"
                  innerRadius={45}
                  outerRadius={65}
                  paddingAngle={4}
                  dataKey="value"
                >
                  {statusPieData.map((_, index) => (
                    <Cell key={`cell-${index}`} fill={PIE_COLORS[index % PIE_COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </div>

          <div className="grid grid-cols-2 gap-2 text-xs pt-3 border-t border-[#F2F0EA]">
            {statusPieData.map((entry, idx) => (
              <div key={entry.name} className="flex items-center gap-2">
                <span
                  className="w-2.5 h-2.5 rounded-full shrink-0"
                  style={{ backgroundColor: PIE_COLORS[idx % PIE_COLORS.length] }}
                />
                <span className="text-[#777777] truncate">{entry.name}:</span>
                <span className="font-mono font-semibold text-[#171717]">{entry.value}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Recent Receipts Section */}
      <div className="bg-white rounded-xl border border-[#E9E7E1] shadow-xs overflow-hidden">
        <div className="p-5 border-b border-[#E9E7E1] flex items-center justify-between">
          <div>
            <h2 className="text-sm font-semibold text-[#171717]">Recent Receipts</h2>
            <p className="text-xs text-[#777777]">Latest issued documents and transactions</p>
          </div>
          <Link
            href="/receipts"
            className="text-xs font-medium text-[#171717] hover:underline flex items-center gap-1"
          >
            <span>View All</span>
            <ChevronRight className="w-3.5 h-3.5" />
          </Link>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="bg-[#F7F6F2] border-b border-[#E9E7E1] text-[#777777] font-mono uppercase text-[11px]">
                <th className="py-3 px-4 font-medium">Receipt #</th>
                <th className="py-3 px-4 font-medium">Customer</th>
                <th className="py-3 px-4 font-medium">Date</th>
                <th className="py-3 px-4 font-medium">Status</th>
                <th className="py-3 px-4 font-medium text-right">Grand Total</th>
                <th className="py-3 px-4 font-medium text-right">Balance Due</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#F2F0EA]">
              {receipts.slice(0, 5).map((receipt) => (
                <tr
                  key={receipt.id}
                  className="hover:bg-[#F7F6F2] transition cursor-pointer"
                  onClick={() => {
                    router.push(`/receipts/${receipt.id}`);
                  }}
                >
                  <td className="py-3.5 px-4 font-mono font-bold text-[#171717]">
                    {receipt.receiptNumber}
                  </td>
                  <td className="py-3.5 px-4 font-medium text-[#171717]">
                    {receipt.customerSnapshot.name}
                  </td>
                  <td className="py-3.5 px-4 text-[#777777] font-mono">{receipt.issueDate}</td>
                  <td className="py-3.5 px-4">
                    <span
                      className={`inline-block px-2 py-0.5 rounded-full text-[11px] font-medium capitalize ${
                        receipt.status === "paid"
                          ? "bg-[#EAF5F0] text-[#24845B]"
                          : receipt.status === "partially_paid"
                          ? "bg-[#FCF6EC] text-[#B7791F]"
                          : "bg-[#E9E7E1] text-[#171717]"
                      }`}
                    >
                      {receipt.status.replace("_", " ")}
                    </span>
                  </td>
                  <td className="py-3.5 px-4 text-right font-mono font-bold text-[#171717]">
                    {formatCurrency(receipt.totalMinor, receipt.currency)}
                  </td>
                  <td className="py-3.5 px-4 text-right font-mono">
                    {receipt.balanceDueMinor > 0 ? (
                      <span className="text-[#C64B4B] font-semibold">
                        {formatCurrency(receipt.balanceDueMinor, receipt.currency)}
                      </span>
                    ) : (
                      <span className="text-[#24845B]">Settled</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
