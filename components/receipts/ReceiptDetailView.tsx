"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  Printer,
  ArrowLeft,
  Edit,
  CreditCard,
  CheckCircle2,
  Share2,
  Trash2,
  Palette,
  X,
} from "lucide-react";
import { Receipt, ReceiptTemplateKey, PaymentMethod } from "@/lib/types/receipt";
import { formatCurrency } from "@/lib/financial/currencies";
import { toMinorUnits, fromMinorUnits, determineReceiptStatus } from "@/lib/financial/calculations";
import { db } from "@/lib/offline/db";
import { ReceiptRenderer } from "../templates/ReceiptRenderer";
import { generateUUID } from "@/lib/utils";
import { ThermalPrinterEngine } from "@/lib/printing/thermal-printer";

interface ReceiptDetailProps {
  id: string;
}

export const ReceiptDetailView: React.FC<ReceiptDetailProps> = ({ id }) => {
  const router = useRouter();
  const [receipt, setReceipt] = useState<Receipt | null>(null);
  const [activeTemplate, setActiveTemplate] = useState<ReceiptTemplateKey>("retail");
  const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false);

  // Payment record fields
  const [paymentAmountStr, setPaymentAmountStr] = useState("");
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>("bank_transfer");
  const [paymentRef, setPaymentRef] = useState("");
  const [paymentNotes, setPaymentNotes] = useState("");

  useEffect(() => {
    loadReceipt();
  }, [id]);

  const loadReceipt = async () => {
    const found = await db.receipts.get(id);
    if (found) {
      setReceipt(found);
      setActiveTemplate("retail");
      setPaymentAmountStr(fromMinorUnits(found.balanceDueMinor).toString());
    }
  };

  if (!receipt) {
    return (
      <div className="p-12 text-center text-xs text-[#777777]">
        Loading receipt record...
      </div>
    );
  }

  // Handle adding payment
  const handleRecordPayment = async (e: React.FormEvent) => {
    e.preventDefault();
    const payMinor = toMinorUnits(paymentAmountStr || 0);
    if (payMinor <= 0) return;

    const newPayment = {
      id: generateUUID(),
      receiptId: receipt.id,
      organizationId: receipt.organizationId,
      amountMinor: payMinor,
      currency: receipt.currency,
      paymentMethod,
      paymentReference: paymentRef.trim() || undefined,
      paymentDate: new Date().toISOString().split("T")[0],
      status: "recorded" as const,
      isManualEntry: true,
      notes: paymentNotes.trim() || undefined,
      createdAt: new Date().toISOString(),
    };

    const newAmountPaid = receipt.amountPaidMinor + payMinor;
    const newBalanceDue = Math.max(0, receipt.totalMinor - newAmountPaid);
    const newStatus = determineReceiptStatus(receipt.totalMinor, newAmountPaid, false);

    const updatedReceipt: Receipt = {
      ...receipt,
      amountPaidMinor: newAmountPaid,
      balanceDueMinor: newBalanceDue,
      status: newStatus,
      payments: [...receipt.payments, newPayment],
      updatedAt: new Date().toISOString(),
    };

    await db.receipts.put(updatedReceipt);
    setReceipt(updatedReceipt);
    setIsPaymentModalOpen(false);
  };

  const handleDeleteReceipt = async () => {
    if (!receipt) return;
    if (confirm(`Are you sure you want to permanently delete receipt #${receipt.receiptNumber}?`)) {
      await db.receipts.delete(receipt.id);
      router.push("/receipts");
    }
  };

  const handlePrint = () => {
    const prefs = ThermalPrinterEngine.getPreferences();
    ThermalPrinterEngine.prepareAndPrint(prefs.paperWidth || "standard");
  };

  return (
    <div className="min-h-screen bg-[#F7F6F2]">
      {/* Top Action Bar */}
      <div className="bg-white border-b border-[#E9E7E1] px-3.5 sm:px-6 lg:px-8 py-3.5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 no-print">
        <div className="flex items-center gap-3">
          <Link
            href="/receipts"
            className="p-1.5 rounded-lg border border-[#E9E7E1] hover:bg-[#F7F6F2] text-[#777777] hover:text-[#171717] transition"
          >
            <ArrowLeft className="w-4 h-4" />
          </Link>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="font-mono text-base font-bold text-[#171717]">
                Receipt #{receipt.receiptNumber}
              </h1>
              <span
                className={`text-[10px] uppercase font-mono font-bold px-2 py-0.5 rounded-full ${
                  receipt.status === "paid"
                    ? "bg-[#EAF5F0] text-[#24845B]"
                    : receipt.status === "partially_paid"
                    ? "bg-[#FCF6EC] text-[#B7791F]"
                    : "bg-[#E9E7E1] text-[#171717]"
                }`}
              >
                {receipt.status.replace("_", " ")}
              </span>
            </div>
            <p className="text-[11px] text-[#777777]">
              Issued on {receipt.issueDate} for {receipt.customerSnapshot.name}
            </p>
          </div>
        </div>

        {/* Actions */}
        <div className="flex flex-wrap items-center gap-2 w-full sm:w-auto">

          {receipt.balanceDueMinor > 0 && (
            <button
              onClick={() => setIsPaymentModalOpen(true)}
              className="flex-1 sm:flex-none inline-flex items-center justify-center gap-1.5 px-3 py-1.5 bg-[#24845B] hover:bg-[#1E704C] text-white rounded-md text-xs font-medium transition shadow-xs"
            >
              <CreditCard className="w-3.5 h-3.5" />
              <span>Record Payment</span>
            </button>
          )}

          <button
            onClick={handlePrint}
            className="flex-1 sm:flex-none inline-flex items-center justify-center gap-1.5 px-3 py-1.5 bg-[#171717] hover:bg-[#222222] text-white rounded-md text-xs font-medium transition shadow-xs"
          >
            <Printer className="w-3.5 h-3.5" />
            <span>Print / PDF</span>
          </button>

          <button
            onClick={handleDeleteReceipt}
            className="inline-flex items-center justify-center gap-1.5 px-3 py-1.5 bg-white hover:bg-rose-50 text-rose-600 border border-rose-200 hover:border-rose-300 rounded-md text-xs font-medium transition shadow-xs cursor-pointer"
            title="Delete this receipt"
          >
            <Trash2 className="w-3.5 h-3.5" />
            <span>Delete</span>
          </button>
        </div>
      </div>

      {/* Main Document Preview Display - Centered and stripped of card borders when printing */}
      <div className="max-w-4xl mx-auto py-4 sm:py-10 px-2 sm:px-4 flex justify-center print-only-container print:p-0 print:m-0 print:max-w-none print:w-full">
        <div className="w-full max-w-[650px] shadow-lg rounded-xl overflow-hidden bg-white print-document-box print:shadow-none print:rounded-none print:border-none print:overflow-visible print:max-w-none print:w-full print:p-0">
          <ReceiptRenderer receipt={{ ...receipt, templateKey: activeTemplate }} />
        </div>
      </div>

      {/* Record Payment Modal */}
      {isPaymentModalOpen && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-xs flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl border border-[#E9E7E1] shadow-xl max-w-sm w-full p-6 space-y-4">
            <div className="flex items-center justify-between border-b border-[#F2F0EA] pb-3">
              <div>
                <h3 className="font-bold text-sm text-[#171717]">Record Manual Payment</h3>
                <p className="text-[11px] text-[#777777]">
                  Outstanding: {formatCurrency(receipt.balanceDueMinor, receipt.currency)}
                </p>
              </div>
              <button
                onClick={() => setIsPaymentModalOpen(false)}
                className="text-[#777777] hover:text-[#171717]"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleRecordPayment} className="space-y-3 text-xs">
              <div>
                <label className="block text-[#777777] mb-1">
                  Payment Amount ({receipt.currency}) *
                </label>
                <input
                  type="text"
                  required
                  value={paymentAmountStr}
                  onChange={(e) => setPaymentAmountStr(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg border border-[#E9E7E1] font-mono text-base font-bold text-emerald-700"
                />
              </div>

              <div>
                <label className="block text-[#777777] mb-1">Payment Method</label>
                <select
                  value={paymentMethod}
                  onChange={(e) => setPaymentMethod(e.target.value as any)}
                  className="w-full px-2.5 py-2 rounded-lg border border-[#E9E7E1] bg-white capitalize"
                >
                  <option value="bank_transfer">Bank Transfer (NEFT/RTGS/IMPS)</option>
                  <option value="upi">UPI / QR Code</option>
                  <option value="card">Credit / Debit Card</option>
                  <option value="cash">Cash</option>
                  <option value="other">Other</option>
                </select>
              </div>

              <div>
                <label className="block text-[#777777] mb-1">Reference / UTR Number</label>
                <input
                  type="text"
                  value={paymentRef}
                  onChange={(e) => setPaymentRef(e.target.value)}
                  placeholder="e.g. UTR-982110294"
                  className="w-full px-3 py-2 rounded-lg border border-[#E9E7E1] font-mono"
                />
              </div>

              <div>
                <label className="block text-[#777777] mb-1">Notes</label>
                <input
                  type="text"
                  value={paymentNotes}
                  onChange={(e) => setPaymentNotes(e.target.value)}
                  placeholder="e.g. 50% Milestone settlement"
                  className="w-full px-3 py-2 rounded-lg border border-[#E9E7E1]"
                />
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-[#F2F0EA]">
                <button
                  type="button"
                  onClick={() => setIsPaymentModalOpen(false)}
                  className="px-3 py-1.5 border border-[#E9E7E1] rounded-lg text-[#777777] hover:bg-[#F7F6F2]"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 bg-[#24845B] hover:bg-[#1E704C] text-white rounded-lg font-medium"
                >
                  Confirm Payment
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
