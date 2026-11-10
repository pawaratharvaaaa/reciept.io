"use client";

import React, { useState, useEffect } from "react";
import {
  Settings,
  Building2,
  Globe,
  Shield,
  Database,
  RefreshCw,
  CheckCircle2,
  Dumbbell,
  ShoppingBag,
  Laptop,
  Coffee,
  User,
  Sparkles,
  Trash2,
  AlertTriangle,
} from "lucide-react";
import { BusinessProfile } from "@/lib/types/receipt";
import { db } from "@/lib/offline/db";
import { SUPPORTED_CURRENCIES } from "@/lib/financial/currencies";
import { useAuth } from "@/lib/auth/auth-context";
import { BUSINESS_CATEGORIES, BusinessCategoryKey } from "@/lib/business-categories";

export const SettingsView: React.FC = () => {
  const { user, businessProfile, switchIndustry } = useAuth();

  const [businessName, setBusinessName] = useState("");
  const [taxIdentifier, setTaxIdentifier] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [addressLine, setAddressLine] = useState("");
  const [city, setCity] = useState("");
  const [receiptPrefix, setReceiptPrefix] = useState("REC-");
  const [selectedCategory, setSelectedCategory] = useState<BusinessCategoryKey>("gym_fitness");
  const [savedSuccess, setSavedSuccess] = useState(false);
  const [receiptsCount, setReceiptsCount] = useState(0);
  const [customersCount, setCustomersCount] = useState(0);
  const [productsCount, setProductsCount] = useState(0);
  const [actionMessage, setActionMessage] = useState<string | null>(null);

  const refreshCounts = async () => {
    const rc = await db.receipts.count();
    const cc = await db.customers.count();
    const pc = await db.products.count();
    setReceiptsCount(rc);
    setCustomersCount(cc);
    setProductsCount(pc);
  };

  useEffect(() => {
    refreshCounts();
  }, []);

  const handleClearReceipts = async () => {
    if (confirm(`Are you sure you want to permanently delete ALL ${receiptsCount} receipts? This action cannot be undone.`)) {
      await db.receipts.clear();
      await db.payments.clear();
      await refreshCounts();
      setActionMessage("All receipts have been permanently deleted.");
      setTimeout(() => setActionMessage(null), 3500);
    }
  };

  const handleClearCustomers = async () => {
    if (confirm(`Are you sure you want to permanently delete ALL ${customersCount} customer records? This action cannot be undone.`)) {
      await db.customers.clear();
      await refreshCounts();
      setActionMessage("All customer profiles have been permanently deleted.");
      setTimeout(() => setActionMessage(null), 3500);
    }
  };

  const handleClearProducts = async () => {
    if (confirm(`Are you sure you want to permanently delete ALL ${productsCount} catalogue items & plans? This action cannot be undone.`)) {
      await db.products.clear();
      await refreshCounts();
      setActionMessage("All catalogue items have been permanently deleted.");
      setTimeout(() => setActionMessage(null), 3500);
    }
  };

  const handleWipeEverything = async () => {
    const promptText = prompt("Type DELETE to confirm permanently wiping ALL receipts, customers, and product catalogue data:");
    if (promptText === "DELETE" || promptText === "delete") {
      await db.receipts.clear();
      await db.payments.clear();
      await db.customers.clear();
      await db.products.clear();
      await refreshCounts();
      setActionMessage("Complete database wipe successful. All receipts, customers, and catalogue data were deleted.");
      setTimeout(() => setActionMessage(null), 4000);
    } else if (promptText !== null) {
      alert("Wipe cancelled. Confirmation keyword did not match.");
    }
  };

  useEffect(() => {
    if (businessProfile) {
      setBusinessName(businessProfile.businessName || "");
      setTaxIdentifier(businessProfile.taxIdentifier || "");
      setEmail(businessProfile.email || "");
      setPhone(businessProfile.phone || "");
      setAddressLine(businessProfile.address?.line1 || "");
      setCity(businessProfile.address?.city || "");
      setReceiptPrefix(businessProfile.receiptPrefix || "REC-");
      setSelectedCategory((businessProfile.businessCategory as BusinessCategoryKey) || "gym_fitness");
    }
  }, [businessProfile]);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!businessProfile) return;

    const updated: BusinessProfile = {
      ...businessProfile,
      businessName,
      taxIdentifier: taxIdentifier.trim() || undefined,
      email: email.trim() || undefined,
      phone: phone.trim() || undefined,
      receiptPrefix: receiptPrefix.trim() || "REC-",
      businessCategory: selectedCategory,
      address: {
        line1: addressLine.trim() || undefined,
        city: city.trim() || undefined,
      },
    };

    await db.businessProfiles.put(updated);
    if (selectedCategory !== businessProfile.businessCategory) {
      await switchIndustry(selectedCategory);
    }

    setSavedSuccess(true);
    setTimeout(() => setSavedSuccess(false), 3000);
  };

  const handleExportJSON = async () => {
    const receipts = await db.receipts.toArray();
    const customers = await db.customers.toArray();
    const products = await db.products.toArray();

    const data = {
      exportTimestamp: new Date().toISOString(),
      businessProfile,
      receipts,
      customers,
      products,
    };

    const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `reciept_io_backup_${new Date().toISOString().split("T")[0]}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const categories = [
    { key: "gym_fitness" as BusinessCategoryKey, label: "Gym & Fitness Club", icon: Dumbbell, desc: "Memberships & Training" },
    { key: "general_store" as BusinessCategoryKey, label: "General Store / Retail", icon: ShoppingBag, desc: "Grocery & Retail Sales" },
    { key: "freelancer_services" as BusinessCategoryKey, label: "Freelancer & Agency", icon: Laptop, desc: "Consulting & Tech Services" },
    { key: "restaurant_cafe" as BusinessCategoryKey, label: "Restaurant & Cafe", icon: Coffee, desc: "Food & Beverage Orders" },
    { key: "individual_personal" as BusinessCategoryKey, label: "Individual / Personal", icon: User, desc: "Rent & Personal Records" },
  ];

  return (
    <div className="p-8 max-w-4xl mx-auto space-y-8">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-[#171717]">Workspace & Profile Settings</h1>
        <p className="text-xs text-[#777777] mt-1">
          Customize your business information, industry optimization, receipt numbering prefix, and local database backup.
        </p>
      </div>

      {savedSuccess && (
        <div className="p-3 bg-[#EAF5F0] text-[#24845B] rounded-lg text-xs font-medium flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4" />
          <span>Business settings & optimization updated successfully!</span>
        </div>
      )}

      {actionMessage && (
        <div className="p-3 bg-rose-50 text-rose-700 border border-rose-200 rounded-lg text-xs font-medium flex items-center gap-2 animate-in fade-in">
          <AlertTriangle className="w-4 h-4 shrink-0 text-rose-600" />
          <span>{actionMessage}</span>
        </div>
      )}

      {/* Business Type Optimization Selector */}
      <div className="bg-white p-6 rounded-xl border border-[#E9E7E1] shadow-xs space-y-4">
        <div className="flex items-center gap-2 border-b border-[#F2F0EA] pb-3">
          <Sparkles className="w-4 h-4 text-amber-600" />
          <h2 className="text-sm font-bold text-[#171717]">Business Type & Optimization</h2>
        </div>
        <p className="text-xs text-[#777777]">
          Select what you use this receipt generator for. The application will tailor your catalogue defaults, receipt numbering, and layout recommendations.
        </p>

        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3 pt-1">
          {categories.map((c) => {
            const Icon = c.icon;
            const isSelected = selectedCategory === c.key;
            return (
              <button
                key={c.key}
                type="button"
                onClick={() => {
                  setSelectedCategory(c.key);
                  setReceiptPrefix(BUSINESS_CATEGORIES[c.key]?.receiptPrefix || "REC-");
                }}
                className={`p-3 rounded-xl border text-left flex items-start gap-2.5 transition ${
                  isSelected
                    ? "bg-[#171717] text-white border-[#171717] shadow-sm"
                    : "bg-white text-[#171717] border-[#E9E7E1] hover:bg-[#F7F6F2]"
                }`}
              >
                <div
                  className={`w-7 h-7 rounded-lg flex items-center justify-center shrink-0 ${
                    isSelected ? "bg-white/20 text-white" : "bg-[#F2F0EA] text-[#171717]"
                  }`}
                >
                  <Icon className="w-3.5 h-3.5" />
                </div>
                <div>
                  <div className="font-bold text-xs">{c.label}</div>
                  <div className={`text-[10px] ${isSelected ? "text-slate-300" : "text-[#777777]"}`}>
                    {c.desc}
                  </div>
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* Business Profile Form */}
      <div className="bg-white p-6 rounded-xl border border-[#E9E7E1] shadow-xs space-y-5">
        <div className="flex items-center gap-2 border-b border-[#F2F0EA] pb-3">
          <Building2 className="w-4 h-4 text-[#171717]" />
          <h2 className="text-sm font-bold text-[#171717]">Business Information & Branding</h2>
        </div>

        <form onSubmit={handleSave} className="space-y-4 text-xs">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-[#777777] mb-1 font-medium">Business / Trade Name *</label>
              <input
                type="text"
                required
                value={businessName}
                onChange={(e) => setBusinessName(e.target.value)}
                className="w-full px-3 py-2 rounded-lg border border-[#E9E7E1] focus:outline-hidden focus:border-[#171717]"
              />
            </div>

            <div>
              <label className="block text-[#777777] mb-1 font-medium">Receipt ID Prefix</label>
              <input
                type="text"
                value={receiptPrefix}
                onChange={(e) => setReceiptPrefix(e.target.value)}
                placeholder="e.g. GYM-, STR-, REC-"
                className="w-full px-3 py-2 rounded-lg border border-[#E9E7E1] font-mono focus:outline-hidden focus:border-[#171717]"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-[#777777] mb-1 font-medium">GSTIN / Tax Registration</label>
              <input
                type="text"
                value={taxIdentifier}
                onChange={(e) => setTaxIdentifier(e.target.value)}
                placeholder="e.g. 27AABCC1234F1Z5"
                className="w-full px-3 py-2 rounded-lg border border-[#E9E7E1] font-mono focus:outline-hidden focus:border-[#171717]"
              />
            </div>

            <div>
              <label className="block text-[#777777] mb-1 font-medium">Official Contact Email</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full px-3 py-2 rounded-lg border border-[#E9E7E1] focus:outline-hidden focus:border-[#171717]"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-[#777777] mb-1 font-medium">Contact Phone</label>
              <input
                type="text"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                className="w-full px-3 py-2 rounded-lg border border-[#E9E7E1] focus:outline-hidden focus:border-[#171717]"
              />
            </div>

            <div>
              <label className="block text-[#777777] mb-1 font-medium">Registered Address</label>
              <input
                type="text"
                value={addressLine}
                onChange={(e) => setAddressLine(e.target.value)}
                className="w-full px-3 py-2 rounded-lg border border-[#E9E7E1] focus:outline-hidden focus:border-[#171717]"
              />
            </div>
          </div>

          <div className="flex justify-end pt-3">
            <button
              type="submit"
              className="px-4 py-2 bg-[#171717] hover:bg-[#222222] text-white rounded-lg font-medium transition shadow-xs"
            >
              Save Business Details
            </button>
          </div>
        </form>
      </div>

      {/* Thermal & Pocket Printer Preferences */}
      <div className="bg-white p-6 rounded-xl border border-[#E9E7E1] shadow-xs space-y-4">
        <div className="flex items-center gap-2 border-b border-[#F2F0EA] pb-3">
          <Settings className="w-4 h-4 text-[#171717]" />
          <h2 className="text-sm font-bold text-[#171717]">Pocket Machine & POS Thermal Printer Configuration</h2>
        </div>

        <p className="text-xs text-[#777777] leading-relaxed">
          Configure direct hardware printing for mini handheld Bluetooth pocket printers (58mm) and supermarket POS thermal slip printers (80mm).
        </p>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs pt-1">
          <div>
            <label className="block text-[#555555] mb-1 font-medium">Default Thermal Slip Width</label>
            <select
              value={receiptPrefix.startsWith("STR") ? "80mm" : "58mm"}
              onChange={() => {}}
              className="w-full px-3 py-2 rounded-lg border border-[#E9E7E1] bg-white font-medium"
            >
              <option value="58mm">58mm (2-inch Pocket Bluetooth Printer)</option>
              <option value="80mm">80mm (3-inch Supermarket POS Counter Roll)</option>
              <option value="standard">Standard A4 / Laser Printer</option>
            </select>
          </div>

          <div className="flex items-end pb-2">
            <div className="p-3 bg-[#F7F6F2] rounded-lg border border-[#E9E7E1] w-full text-[11px] text-[#555555] flex items-center gap-2">
              <span className="text-emerald-700 font-bold">✓ ESC/POS Continuous Roll</span>
              <span>• Auto-feed & clean tear-off support active</span>
            </div>
          </div>
        </div>
      </div>

      {/* Security & Firewall Status Section */}
      <div className="bg-white p-6 rounded-xl border border-[#E9E7E1] shadow-xs space-y-4">
        <div className="flex items-center gap-2 border-b border-[#F2F0EA] pb-3">
          <Shield className="w-4 h-4 text-emerald-700" />
          <h2 className="text-sm font-bold text-[#171717]">Security Firewall & Protection Status</h2>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
          <div className="p-3 rounded-xl border border-[#E9E7E1] bg-[#F7F6F2] space-y-1">
            <div className="flex items-center gap-1.5 font-bold text-emerald-700 text-xs">
              <CheckCircle2 className="w-3.5 h-3.5" />
              <span>Brute-Force Defense Firewall</span>
            </div>
            <p className="text-[11px] text-[#777777]">
              Locks accounts automatically for 15 minutes upon 5 consecutive failed authentication attempts.
            </p>
          </div>

          <div className="p-3 rounded-xl border border-[#E9E7E1] bg-[#F7F6F2] space-y-1">
            <div className="flex items-center gap-1.5 font-bold text-emerald-700 text-xs">
              <CheckCircle2 className="w-3.5 h-3.5" />
              <span>Tough Password Encryption</span>
            </div>
            <p className="text-[11px] text-[#777777]">
              Enforces 8+ characters, uppercase, lowercase, numbers & symbols with SHA-256 salted hashing.
            </p>
          </div>

          <div className="p-3 rounded-xl border border-[#E9E7E1] bg-[#F7F6F2] space-y-1">
            <div className="flex items-center gap-1.5 font-bold text-emerald-700 text-xs">
              <CheckCircle2 className="w-3.5 h-3.5" />
              <span>XSS & Script Injection Shield</span>
            </div>
            <p className="text-[11px] text-[#777777]">
              Sanitizes customer names, receipt notes, and all input fields against malicious HTML/script payloads.
            </p>
          </div>

          <div className="p-3 rounded-xl border border-[#E9E7E1] bg-[#F7F6F2] space-y-1">
            <div className="flex items-center gap-1.5 font-bold text-emerald-700 text-xs">
              <CheckCircle2 className="w-3.5 h-3.5" />
              <span>HTTP Security Headers</span>
            </div>
            <p className="text-[11px] text-[#777777]">
              Strict-Transport-Security, X-Frame-Options: DENY (anti-clickjacking), and X-Content-Type-Options.
            </p>
          </div>
        </div>
      </div>

      {/* Storage and Backup Section */}
      <div className="bg-white p-6 rounded-xl border border-[#E9E7E1] shadow-xs space-y-4">
        <div className="flex items-center gap-2 border-b border-[#F2F0EA] pb-3">
          <Database className="w-4 h-4 text-[#171717]" />
          <h2 className="text-sm font-bold text-[#171717]">Local Database & Offline Snapshots</h2>
        </div>

        <p className="text-xs text-[#777777] leading-relaxed">
          Your receipts, products, and customer profiles are preserved safely on your device via IndexedDB. You can export a full JSON snapshot of your data at any time.
        </p>

        <div className="pt-2 flex items-center gap-3">
          <button
            onClick={handleExportJSON}
            className="px-4 py-2 border border-[#E9E7E1] hover:bg-[#F7F6F2] text-[#171717] rounded-lg text-xs font-medium transition shadow-xs cursor-pointer"
          >
            Export Complete Database (JSON)
          </button>
        </div>
      </div>

      {/* Danger Zone: Data Reset & Everything Delete Options */}
      <div className="bg-white p-6 rounded-xl border border-rose-200 shadow-xs space-y-5">
        <div className="flex items-center justify-between border-b border-rose-100 pb-3">
          <div className="flex items-center gap-2">
            <Trash2 className="w-4 h-4 text-rose-600" />
            <h2 className="text-sm font-bold text-rose-950">Data Management &amp; Delete Options</h2>
          </div>
          <span className="text-[10px] uppercase font-mono px-2 py-0.5 rounded-full bg-rose-50 text-rose-700 font-semibold border border-rose-200">
            Irreversible Actions
          </span>
        </div>

        <p className="text-xs text-slate-600 leading-relaxed">
          Select individual data categories to wipe or initiate a complete clean reset. Once confirmed, deleted records cannot be recovered.
        </p>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          {/* 1. Delete Receipts */}
          <div className="p-4 rounded-xl border border-slate-200 bg-slate-50/60 flex flex-col justify-between space-y-3">
            <div>
              <div className="flex items-center justify-between">
                <span className="font-bold text-xs text-slate-900">Receipts</span>
                <span className="font-mono text-xs font-semibold px-2 py-0.5 rounded-md bg-white border border-slate-200 text-slate-700">
                  {receiptsCount} records
                </span>
              </div>
              <p className="text-[11px] text-slate-500 mt-1 leading-snug">
                Permanently wipes all recorded sales and payment receipts.
              </p>
            </div>
            <button
              type="button"
              onClick={handleClearReceipts}
              disabled={receiptsCount === 0}
              className="w-full py-2 px-3 bg-white hover:bg-rose-50 text-rose-600 border border-slate-300 hover:border-rose-300 rounded-lg text-xs font-medium transition cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
            >
              Delete All Receipts
            </button>
          </div>

          {/* 2. Delete Customers */}
          <div className="p-4 rounded-xl border border-slate-200 bg-slate-50/60 flex flex-col justify-between space-y-3">
            <div>
              <div className="flex items-center justify-between">
                <span className="font-bold text-xs text-slate-900">Customers</span>
                <span className="font-mono text-xs font-semibold px-2 py-0.5 rounded-md bg-white border border-slate-200 text-slate-700">
                  {customersCount} profiles
                </span>
              </div>
              <p className="text-[11px] text-slate-500 mt-1 leading-snug">
                Permanently wipes all client profiles and contact addresses.
              </p>
            </div>
            <button
              type="button"
              onClick={handleClearCustomers}
              disabled={customersCount === 0}
              className="w-full py-2 px-3 bg-white hover:bg-rose-50 text-rose-600 border border-slate-300 hover:border-rose-300 rounded-lg text-xs font-medium transition cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
            >
              Delete All Customers
            </button>
          </div>

          {/* 3. Delete Catalogue */}
          <div className="p-4 rounded-xl border border-slate-200 bg-slate-50/60 flex flex-col justify-between space-y-3">
            <div>
              <div className="flex items-center justify-between">
                <span className="font-bold text-xs text-slate-900">Catalogue</span>
                <span className="font-mono text-xs font-semibold px-2 py-0.5 rounded-md bg-white border border-slate-200 text-slate-700">
                  {productsCount} items
                </span>
              </div>
              <p className="text-[11px] text-slate-500 mt-1 leading-snug">
                Permanently wipes all product items, gym plans, and SKUs.
              </p>
            </div>
            <button
              type="button"
              onClick={handleClearProducts}
              disabled={productsCount === 0}
              className="w-full py-2 px-3 bg-white hover:bg-rose-50 text-rose-600 border border-slate-300 hover:border-rose-300 rounded-lg text-xs font-medium transition cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
            >
              Delete All Catalogue
            </button>
          </div>
        </div>

        {/* Master Delete Everything Button */}
        <div className="pt-3 border-t border-rose-100 flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="space-y-0.5 text-center sm:text-left">
            <span className="font-bold text-xs text-rose-900 block">
              Delete Everything (Master Reset)
            </span>
            <span className="text-[11px] text-slate-500 block">
              Wipes all receipts, customers, and product catalogue in a single operation.
            </span>
          </div>

          <button
            type="button"
            onClick={handleWipeEverything}
            className="w-full sm:w-auto px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white rounded-lg text-xs font-bold transition shadow-xs cursor-pointer flex items-center justify-center gap-1.5"
          >
            <Trash2 className="w-4 h-4" />
            <span>Wipe Everything</span>
          </button>
        </div>
      </div>
    </div>
  );
};
