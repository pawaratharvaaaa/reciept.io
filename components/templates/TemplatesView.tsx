"use client";

import React, { useState } from "react";
import Link from "next/link";
import { Check, ArrowRight, Printer, Sparkles, Smartphone, Barcode } from "lucide-react";
import { ReceiptTemplateKey, Receipt } from "@/lib/types/receipt";
import { ReceiptRenderer } from "./ReceiptRenderer";

export const TemplatesView: React.FC = () => {
  const [selectedFormat, setSelectedFormat] = useState<"58mm" | "80mm" | "standard">("58mm");

  // Sample dummy receipt for template previewing
  const demoReceipt: Receipt = {
    id: "demo-rec-1",
    organizationId: "org-default-001",
    businessProfileId: "biz-001",
    receiptNumber: "REC-DEMO-01",
    receiptType: "sales",
    status: "paid",
    currency: "INR",
    issueDate: "2026-11-09",
    transactionDate: "2026-11-09",
    subtotalMinor: 5000000,
    discountMinor: 500000,
    taxMinor: 810000,
    totalMinor: 5310000, // ₹53,100.00
    amountPaidMinor: 5310000,
    balanceDueMinor: 0,
    customerSnapshot: {
      name: "Acme Corporation",
      email: "contact@acme.com",
      phone: "+91 98200 55443",
      address: { line1: "100 Innovation Way, BKC, Mumbai" },
      taxIdentifier: "27AAACA9988P1Z0",
    },
    businessSnapshot: {
      businessName: "Craft Studio & Labs Pvt Ltd",
      email: "billing@craftstudio.in",
      phone: "+91 98765 43210",
      address: { line1: "Suite 402, Innov8 Hub, BKC, Mumbai 400051" },
      taxIdentifier: "27AABCC1234F1Z5",
      website: "https://craftstudio.in",
    },
    items: [
      {
        id: "demo-item-1",
        description: "Quarterly Gym Membership Plan (3 Months)",
        skuSnapshot: "GYM-QTR-01",
        quantity: 1,
        unitPriceMinor: 550000,
        discountMinor: 0,
        taxRate: 18,
        taxMinor: 99000,
        lineTotalMinor: 649000,
      },
      {
        id: "demo-item-2",
        description: "Fullstack SaaS Architecture & Cloud Engineering",
        skuSnapshot: "SVC-ARCH-01",
        quantity: 1,
        unitPriceMinor: 12500000,
        discountMinor: 500000,
        taxRate: 18,
        taxMinor: 2160000,
        lineTotalMinor: 14160000,
      },
    ],
    payments: [],
    notes: "Official payment acknowledgement slip.",
    terms: "Thank you for your business! Please visit again.",
    templateKey: "retail",
    templateConfig: {
      accentColor: "#171717",
      fontSize: "base",
    },
    version: 1,
    createdBy: "usr-admin",
    createdAt: "2026-11-09T00:00:00.000Z",
    updatedAt: "2026-11-09T00:00:00.000Z",
  };

  const features = [
    {
      icon: Smartphone,
      title: "58mm Pocket Thermal",
      description: "Optimized for mobile Bluetooth thermal printers with 0mm side crop and clear two-line items.",
    },
    {
      icon: Printer,
      title: "80mm Counter POS",
      description: "Crisp formatting with wide margins for standard retail cash registers and supermarket printers.",
    },
    {
      icon: Barcode,
      title: "Vector SVG Barcode",
      description: "Crisp, scalable vector barcode guaranteed never to wrap or distort when printed or saved as PDF.",
    },
    {
      icon: Sparkles,
      title: "Zero-Overlap Item Layout",
      description: "Two-line item architecture guarantees rates, tax, and large numbers never collide.",
    },
  ];

  return (
    <div className="p-8 max-w-7xl mx-auto space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-[#171717]">Retail &amp; POS Receipt</h1>
        <p className="text-xs text-[#777777] mt-1">
          Universal, high-reliability retail slip designed for pocket thermal printers (58mm), counter POS (80mm), and standard PDF receipts.
        </p>
      </div>

      {/* Feature Highlights Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
        {features.map((feat, i) => {
          const Icon = feat.icon;
          return (
            <div
              key={i}
              className="p-5 rounded-xl border bg-white border-[#E9E7E1] shadow-2xs space-y-2"
            >
              <div className="w-8 h-8 rounded-lg bg-[#F2F0EA] flex items-center justify-center text-[#171717]">
                <Icon className="w-4 h-4" />
              </div>
              <h3 className="font-bold text-sm text-[#171717]">{feat.title}</h3>
              <p className="text-xs text-[#777777] leading-relaxed">{feat.description}</p>
            </div>
          );
        })}
      </div>

      {/* Live Preview of Retail Template */}
      <div className="bg-[#EFECE6] p-8 rounded-2xl border border-[#E9E7E1] flex flex-col items-center">
        <div className="w-full max-w-[420px] flex items-center justify-between mb-4 text-xs text-[#777777]">
          <span className="font-mono uppercase tracking-wider text-[11px] font-bold text-[#171717]">
            Active Format: Retail POS
          </span>
          <Link
            href="/receipts/new"
            className="flex items-center gap-1.5 px-3 py-1 bg-[#171717] text-white rounded-md text-xs font-medium hover:bg-[#222222] transition"
          >
            <span>Create New Receipt</span>
            <ArrowRight className="w-3 h-3" />
          </Link>
        </div>

        <div className="w-full max-w-[420px] shadow-lg rounded-xl overflow-hidden">
          <ReceiptRenderer receipt={demoReceipt} />
        </div>
      </div>
    </div>
  );
};
