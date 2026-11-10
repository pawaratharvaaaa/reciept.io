"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  Search,
  Plus,
  Eye,
  Trash2,
  Receipt as ReceiptIcon,
  CheckSquare,
  Square,
  AlertTriangle,
} from "lucide-react";
import { Receipt, ReceiptStatus } from "@/lib/types/receipt";
import { formatCurrency } from "@/lib/financial/currencies";
import { db } from "@/lib/offline/db";

export const ReceiptLibrary: React.FC = () => {
  const router = useRouter();
  const [receipts, setReceipts] = useState<Receipt[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [typeFilter, setTypeFilter] = useState<string>("all");
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());

  useEffect(() => {
    loadReceipts();
  }, []);

  const loadReceipts = async () => {
    const all = await db.receipts.toArray();
    // Sort by issue date descending
    all.sort((a, b) => new Date(b.issueDate).getTime() - new Date(a.issueDate).getTime());
    setReceipts(all);
    setSelectedIds(new Set());
  };

  const filteredReceipts = receipts.filter((r) => {
    const matchesSearch =
      r.receiptNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
      r.customerSnapshot.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      r.items.some((it) => it.description.toLowerCase().includes(searchTerm.toLowerCase()));

    const matchesStatus = statusFilter === "all" || r.status === statusFilter;
    const matchesType = typeFilter === "all" || r.receiptType === typeFilter;

    return matchesSearch && matchesStatus && matchesType;
  });

  const handleDelete = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (confirm("Are you sure you want to delete this receipt record?")) {
      await db.receipts.delete(id);
      loadReceipts();
    }
  };

  const handleDeleteAll = async () => {
    if (receipts.length === 0) return;
    if (
      confirm(
        `Are you sure you want to permanently delete ALL ${receipts.length} receipts? This cannot be undone.`
      )
    ) {
      await db.receipts.clear();
      await db.payments.clear();
      loadReceipts();
    }
  };

  const handleDeleteSelected = async () => {
    if (selectedIds.size === 0) return;
    if (
      confirm(
        `Are you sure you want to delete ${selectedIds.size} selected receipt(s)?`
      )
    ) {
      await db.receipts.bulkDelete(Array.from(selectedIds));
      loadReceipts();
    }
  };

  const toggleSelectAll = () => {
    if (selectedIds.size === filteredReceipts.length && filteredReceipts.length > 0) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(filteredReceipts.map((r) => r.id)));
    }
  };

  const toggleSelectOne = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    const updated = new Set(selectedIds);
    if (updated.has(id)) {
      updated.delete(id);
    } else {
      updated.add(id);
    }
    setSelectedIds(updated);
  };

  const getStatusBadge = (status: ReceiptStatus) => {
    switch (status) {
      case "paid":
        return (
          <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-medium bg-[#EAF5F0] text-[#24845B]">
            Paid
          </span>
        );
      case "partially_paid":
        return (
          <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-medium bg-[#FCF6EC] text-[#B7791F]">
            Partially Paid
          </span>
        );
      case "voided":
        return (
          <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-medium bg-[#FDF2F2] text-[#C64B4B]">
            Voided
          </span>
        );
      case "draft":
        return (
          <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-medium bg-[#F2F0EA] text-[#777777]">
            Draft
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-medium bg-[#E9E7E1] text-[#171717]">
            Issued
          </span>
        );
    }
  };

  return (
    <div className="p-8 max-w-7xl mx-auto space-y-6">
      {/* Top Banner */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-[#171717]">Receipt Library</h1>
          <p className="text-xs text-[#777777] mt-1">
            Search, filter, manage, or delete your historical sales and payment receipts.
          </p>
        </div>

        <div className="flex items-center gap-2">
          {selectedIds.size > 0 && (
            <button
              onClick={handleDeleteSelected}
              className="inline-flex items-center gap-1.5 px-3 py-2 bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 rounded-lg text-xs font-semibold transition cursor-pointer"
            >
              <Trash2 className="w-3.5 h-3.5" />
              <span>Delete Selected ({selectedIds.size})</span>
            </button>
          )}

          {receipts.length > 0 && (
            <button
              onClick={handleDeleteAll}
              className="inline-flex items-center gap-1.5 px-3 py-2 bg-white hover:bg-rose-50 text-rose-600 border border-slate-300 hover:border-rose-300 rounded-lg text-xs font-medium transition cursor-pointer"
              title="Delete all receipts in database"
            >
              <Trash2 className="w-3.5 h-3.5" />
              <span>Delete All</span>
            </button>
          )}

          <Link
            href="/receipts/new"
            className="inline-flex items-center gap-1.5 px-4 py-2 bg-[#171717] hover:bg-[#222222] text-white rounded-lg text-xs font-medium transition shadow-xs"
          >
            <Plus className="w-4 h-4" />
            <span>Create New Receipt</span>
          </Link>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white p-4 rounded-xl border border-[#E9E7E1] shadow-xs flex flex-col md:flex-row items-center justify-between gap-3 text-xs">
        <div className="relative w-full md:w-80">
          <Search className="w-4 h-4 text-[#777777] absolute left-3 top-2.5" />
          <input
            type="text"
            placeholder="Search by receipt #, customer, item..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-9 pr-3 py-2 rounded-lg border border-[#E9E7E1] focus:outline-hidden focus:border-[#171717]"
          />
        </div>

        <div className="flex items-center gap-2 w-full md:w-auto">
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-3 py-2 rounded-lg border border-[#E9E7E1] bg-white font-medium cursor-pointer"
          >
            <option value="all">All Statuses</option>
            <option value="paid">Paid</option>
            <option value="partially_paid">Partially Paid</option>
            <option value="issued">Issued</option>
            <option value="draft">Draft</option>
            <option value="voided">Voided</option>
          </select>

          <select
            value={typeFilter}
            onChange={(e) => setTypeFilter(e.target.value)}
            className="px-3 py-2 rounded-lg border border-[#E9E7E1] bg-white font-medium cursor-pointer"
          >
            <option value="all">All Types</option>
            <option value="sales">Sales Receipts</option>
            <option value="payment">Payment Receipts</option>
          </select>
        </div>
      </div>

      {/* Receipts Table */}
      <div className="bg-white rounded-xl border border-[#E9E7E1] shadow-xs overflow-hidden">
        {filteredReceipts.length === 0 ? (
          <div className="p-12 text-center space-y-3">
            <div className="w-12 h-12 rounded-full bg-[#F2F0EA] flex items-center justify-center mx-auto text-[#777777]">
              <ReceiptIcon className="w-6 h-6" />
            </div>
            <div className="text-sm font-semibold text-[#171717]">No receipts found</div>
            <p className="text-xs text-[#777777] max-w-sm mx-auto">
              No matching records for the current search or filters. Create your first receipt to get started!
            </p>
            <Link
              href="/receipts/new"
              className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-[#171717] text-white rounded-md text-xs font-medium"
            >
              <Plus className="w-3.5 h-3.5" /> Create Receipt
            </Link>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="bg-[#F7F6F2] border-b border-[#E9E7E1] text-[#777777] font-mono uppercase text-[11px]">
                  <th className="py-3 px-3 w-8 text-center">
                    <button
                      type="button"
                      onClick={toggleSelectAll}
                      className="p-1 text-slate-500 hover:text-slate-900 cursor-pointer"
                      title={selectedIds.size === filteredReceipts.length ? "Deselect all" : "Select all"}
                    >
                      {selectedIds.size === filteredReceipts.length && filteredReceipts.length > 0 ? (
                        <CheckSquare className="w-4 h-4 text-[#171717]" />
                      ) : (
                        <Square className="w-4 h-4 text-slate-400" />
                      )}
                    </button>
                  </th>
                  <th className="py-3 px-4 font-medium">Receipt #</th>
                  <th className="py-3 px-4 font-medium">Customer</th>
                  <th className="py-3 px-4 font-medium">Date</th>
                  <th className="py-3 px-4 font-medium">Type</th>
                  <th className="py-3 px-4 font-medium">Status</th>
                  <th className="py-3 px-4 font-medium text-right">Total</th>
                  <th className="py-3 px-4 font-medium text-right">Balance Due</th>
                  <th className="py-3 px-4 font-medium text-center">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#F2F0EA]">
                {filteredReceipts.map((receipt) => {
                  const isSelected = selectedIds.has(receipt.id);
                  return (
                    <tr
                      key={receipt.id}
                      className={`transition cursor-pointer ${
                        isSelected ? "bg-slate-100/70" : "hover:bg-[#F7F6F2]"
                      }`}
                      onClick={() => {
                        router.push(`/receipts/${receipt.id}`);
                      }}
                    >
                      <td
                        className="py-3.5 px-3 text-center"
                        onClick={(e) => toggleSelectOne(receipt.id, e)}
                      >
                        <button
                          type="button"
                          className="p-1 text-slate-500 hover:text-slate-900 cursor-pointer"
                        >
                          {isSelected ? (
                            <CheckSquare className="w-4 h-4 text-[#171717]" />
                          ) : (
                            <Square className="w-4 h-4 text-slate-300" />
                          )}
                        </button>
                      </td>
                      <td className="py-3.5 px-4 font-mono font-bold text-[#171717]">
                        {receipt.receiptNumber}
                      </td>
                      <td className="py-3.5 px-4">
                        <div className="font-semibold text-[#171717]">
                          {receipt.customerSnapshot.name}
                        </div>
                        {receipt.customerSnapshot.email && (
                          <div className="text-[10px] text-[#777777]">
                            {receipt.customerSnapshot.email}
                          </div>
                        )}
                      </td>
                      <td className="py-3.5 px-4 text-[#777777] font-mono">{receipt.issueDate}</td>
                      <td className="py-3.5 px-4 capitalize text-[#777777]">
                        {receipt.receiptType}
                      </td>
                      <td className="py-3.5 px-4">{getStatusBadge(receipt.status)}</td>
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
                      <td
                        className="py-3.5 px-4 text-center"
                        onClick={(e) => e.stopPropagation()}
                      >
                        <div className="flex items-center justify-center gap-1.5">
                          <Link
                            href={`/receipts/${receipt.id}`}
                            className="p-1 text-[#777777] hover:text-[#171717] rounded hover:bg-[#E9E7E1]"
                            title="View & Print"
                          >
                            <Eye className="w-3.5 h-3.5" />
                          </Link>
                          <button
                            onClick={(e) => handleDelete(receipt.id, e)}
                            className="p-1 text-[#777777] hover:text-[#C64B4B] rounded hover:bg-[#FDF2F2] cursor-pointer"
                            title="Delete this receipt"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};
