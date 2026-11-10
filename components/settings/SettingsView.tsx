"use client";

import React, { useState, useEffect } from "react";
import {
  Settings,
  Building2,
  Globe,
  Database,
  CheckCircle2,
  Dumbbell,
  ShoppingBag,
  Laptop,
  Coffee,
  User,
  Sparkles,
  Trash2,
  AlertTriangle,
  Sun,
  Moon,
  Monitor,
  UserCheck,
  LogOut,
  PlusCircle,
  Printer,
  ShieldCheck,
} from "lucide-react";
import { BusinessProfile } from "@/lib/types/receipt";
import { db } from "@/lib/offline/db";
import { useAuth } from "@/lib/auth/auth-context";
import { useTheme } from "@/lib/theme/theme-context";
import { BUSINESS_CATEGORIES, BusinessCategoryKey } from "@/lib/business-categories";
import { ThermalPrinterEngine, ThermalPaperWidth } from "@/lib/printing/thermal-printer";
import { AuthModal } from "@/components/auth/AuthModal";

export const SettingsView: React.FC = () => {
  const { user, businessProfile, switchIndustry, logout, allUsers, deleteAccount } = useAuth();
  const { theme, setTheme } = useTheme();

  // Auth modal inside settings for switching / creating accounts
  const [authModalOpen, setAuthModalOpen] = useState(false);
  const [authModalMode, setAuthModalMode] = useState<"signup" | "login" | "switch">("switch");

  // Business profile form fields
  const [businessName, setBusinessName] = useState("");
  const [taxIdentifier, setTaxIdentifier] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [addressLine, setAddressLine] = useState("");
  const [city, setCity] = useState("");
  const [receiptPrefix, setReceiptPrefix] = useState("REC-");
  const [selectedCategory, setSelectedCategory] = useState<BusinessCategoryKey>("gym_fitness");
  const [savedSuccess, setSavedSuccess] = useState(false);

  // Thermal printer preference
  const [printerWidth, setPrinterWidth] = useState<ThermalPaperWidth>("58mm");
  const [autoPrintOnSave, setAutoPrintOnSave] = useState(false);

  // Record counts
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
    try {
      const prefs = ThermalPrinterEngine.getPreferences();
      if (prefs.paperWidth) setPrinterWidth(prefs.paperWidth);
      if (typeof prefs.autoPrintOnSave === "boolean") setAutoPrintOnSave(prefs.autoPrintOnSave);
    } catch (e) {}
  }, []);

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

  const handleSaveBusiness = async (e: React.FormEvent) => {
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

  const handleUpdatePrinterPrefs = (newWidth: ThermalPaperWidth, autoPrint: boolean) => {
    setPrinterWidth(newWidth);
    setAutoPrintOnSave(autoPrint);
    ThermalPrinterEngine.savePreferences({
      paperWidth: newWidth,
      autoPrintOnSave: autoPrint,
      soundNotification: true,
    });
  };

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
    <div className="p-3.5 sm:p-6 lg:p-8 max-w-4xl mx-auto space-y-5 sm:space-y-6">
      {/* Title */}
      <div>
        <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-[#171717] dark:text-[#F5F5F5]">
          App &amp; Workspace Settings
        </h1>
        <p className="text-xs text-[#777777] dark:text-[#A1A1A1] mt-1">
          Manage your active account, theme appearance, store profile, thermal printer, and data backups.
        </p>
      </div>

      {savedSuccess && (
        <div className="p-3 bg-[#EAF5F0] dark:bg-[#14281E] text-[#24845B] dark:text-[#34A853] rounded-lg text-xs font-medium flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4" />
          <span>Business settings updated successfully!</span>
        </div>
      )}

      {actionMessage && (
        <div className="p-3 bg-rose-50 dark:bg-[#2B1414] text-rose-700 dark:text-[#EB5757] border border-rose-200 dark:border-rose-900 rounded-lg text-xs font-medium flex items-center gap-2 animate-in fade-in">
          <AlertTriangle className="w-4 h-4 shrink-0 text-rose-600" />
          <span>{actionMessage}</span>
        </div>
      )}

      {/* 1. USEFUL SETTING: Account Management & Switching */}
      <div className="bg-white dark:bg-[#1A1A1A] p-4 sm:p-6 rounded-xl border border-[#E9E7E1] dark:border-[#2B2B2B] shadow-xs space-y-4">
        <div className="flex items-center justify-between border-b border-[#F2F0EA] dark:border-[#262626] pb-3">
          <div className="flex items-center gap-2">
            <UserCheck className="w-4 h-4 text-blue-600" />
            <h2 className="text-sm font-bold text-[#171717] dark:text-[#F5F5F5]">Active Account &amp; Profiles</h2>
          </div>
          <span className="text-[10px] font-mono bg-blue-50 dark:bg-blue-950 text-blue-700 dark:text-blue-300 font-semibold px-2 py-0.5 rounded-full border border-blue-200 dark:border-blue-900">
            {allUsers.length} profile{allUsers.length === 1 ? "" : "s"} on device
          </span>
        </div>

        {user ? (
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 p-3.5 rounded-xl bg-[#F7F6F2] dark:bg-[#242424] border border-[#E9E7E1] dark:border-[#333333]">
            <div className="flex items-center gap-3">
              <div className="w-11 h-11 rounded-full bg-[#171717] dark:bg-white text-white dark:text-[#171717] flex items-center justify-center font-bold text-sm shrink-0 shadow-xs">
                {(user.fullName || "US").slice(0, 2).toUpperCase()}
              </div>
              <div>
                <div className="font-bold text-sm text-[#171717] dark:text-[#F5F5F5]">{user.fullName}</div>
                <div className="text-xs text-[#777777] dark:text-[#A1A1A1]">{user.email}</div>
                <div className="text-[11px] font-medium text-emerald-700 dark:text-emerald-400 mt-0.5">
                  Store: {businessProfile?.businessName || "My Business"}
                </div>
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-2 w-full sm:w-auto">
              <button
                type="button"
                onClick={() => {
                  setAuthModalMode("switch");
                  setAuthModalOpen(true);
                }}
                className="flex-1 sm:flex-none px-3.5 py-2 bg-white dark:bg-[#1A1A1A] hover:bg-[#F2F0EA] dark:hover:bg-[#2A2A2A] text-[#171717] dark:text-[#F5F5F5] border border-[#E9E7E1] dark:border-[#333333] rounded-lg text-xs font-semibold transition cursor-pointer text-center"
              >
                Switch Account
              </button>

              <button
                type="button"
                onClick={() => {
                  setAuthModalMode("signup");
                  setAuthModalOpen(true);
                }}
                className="flex-1 sm:flex-none px-3.5 py-2 bg-[#171717] dark:bg-white hover:bg-[#2A2A2A] dark:hover:bg-neutral-200 text-white dark:text-[#171717] rounded-lg text-xs font-semibold transition cursor-pointer text-center flex items-center justify-center gap-1.5"
              >
                <PlusCircle className="w-3.5 h-3.5" />
                <span>Add Account</span>
              </button>

              <button
                type="button"
                onClick={logout}
                className="px-3.5 py-2 bg-slate-100 dark:bg-neutral-800 hover:bg-slate-200 text-slate-700 dark:text-slate-300 rounded-lg text-xs font-semibold transition cursor-pointer flex items-center justify-center gap-1.5"
                title="Log out and return to sign in"
              >
                <LogOut className="w-3.5 h-3.5" />
                <span>Log Out</span>
              </button>

              <button
                type="button"
                onClick={async () => {
                  if (confirm(`Permanently delete profile "${user.businessName}" (${user.email})? All local store data associated with this account will be erased.`)) {
                    await deleteAccount(user.id);
                  }
                }}
                className="px-3.5 py-2 bg-rose-50 dark:bg-[#2B1414] hover:bg-rose-100 text-rose-700 dark:text-[#EB5757] border border-rose-200 dark:border-rose-900 rounded-lg text-xs font-semibold transition cursor-pointer flex items-center justify-center gap-1.5"
                title="Delete this account"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>Delete Account</span>
              </button>
            </div>
          </div>
        ) : (
          <div className="p-4 rounded-xl bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-900 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-xs">
            <div>
              <div className="font-bold text-amber-900 dark:text-amber-200">Zero active accounts</div>
              <p className="text-amber-700 dark:text-amber-300 mt-0.5">Please sign in or create an account to activate your workspace.</p>
            </div>
            <button
              type="button"
              onClick={() => {
                setAuthModalMode("signup");
                setAuthModalOpen(true);
              }}
              className="px-4 py-2 bg-[#171717] dark:bg-white text-white dark:text-[#171717] rounded-lg font-semibold"
            >
              Sign In / Register
            </button>
          </div>
        )}
      </div>

      {/* 2. USEFUL SETTING: Appearance & Dark Mode Toggle */}
      <div className="bg-white dark:bg-[#1A1A1A] p-4 sm:p-6 rounded-xl border border-[#E9E7E1] dark:border-[#2B2B2B] shadow-xs space-y-4">
        <div className="flex items-center gap-2 border-b border-[#F2F0EA] dark:border-[#262626] pb-3">
          <Moon className="w-4 h-4 text-purple-600" />
          <h2 className="text-sm font-bold text-[#171717] dark:text-[#F5F5F5]">Theme &amp; Appearance</h2>
        </div>
        <p className="text-xs text-[#777777] dark:text-[#A1A1A1]">
          Choose how Reciept.io looks to match your workspace lighting conditions.
        </p>

        <div className="grid grid-cols-3 gap-3 pt-1">
          <button
            type="button"
            onClick={() => setTheme("light")}
            className={`p-3.5 rounded-xl border flex flex-col items-center justify-center gap-2 transition cursor-pointer ${
              theme === "light"
                ? "border-[#171717] dark:border-white bg-[#F7F6F2] dark:bg-neutral-800 shadow-xs"
                : "border-[#E9E7E1] dark:border-[#333333] hover:bg-[#FAF9F5] dark:hover:bg-neutral-900"
            }`}
          >
            <Sun className={`w-5 h-5 ${theme === "light" ? "text-amber-600" : "text-[#777777]"}`} />
            <span className="text-xs font-bold text-[#171717] dark:text-[#F5F5F5]">Light Mode</span>
          </button>

          <button
            type="button"
            onClick={() => setTheme("dark")}
            className={`p-3.5 rounded-xl border flex flex-col items-center justify-center gap-2 transition cursor-pointer ${
              theme === "dark"
                ? "border-[#171717] dark:border-white bg-[#171717] text-white shadow-xs"
                : "border-[#E9E7E1] dark:border-[#333333] hover:bg-[#FAF9F5] dark:hover:bg-neutral-900 text-[#171717] dark:text-[#F5F5F5]"
            }`}
          >
            <Moon className={`w-5 h-5 ${theme === "dark" ? "text-purple-400" : "text-[#777777]"}`} />
            <span className="text-xs font-bold">Dark Mode</span>
          </button>

          <button
            type="button"
            onClick={() => setTheme("system")}
            className={`p-3.5 rounded-xl border flex flex-col items-center justify-center gap-2 transition cursor-pointer ${
              theme === "system"
                ? "border-[#171717] dark:border-white bg-[#F7F6F2] dark:bg-neutral-800 shadow-xs"
                : "border-[#E9E7E1] dark:border-[#333333] hover:bg-[#FAF9F5] dark:hover:bg-neutral-900"
            }`}
          >
            <Monitor className={`w-5 h-5 ${theme === "system" ? "text-blue-600" : "text-[#777777]"}`} />
            <span className="text-xs font-bold text-[#171717] dark:text-[#F5F5F5]">System Sync</span>
          </button>
        </div>
      </div>

      {/* 3. USEFUL SETTING: Business Profile & Branding */}
      <div className="bg-white dark:bg-[#1A1A1A] p-4 sm:p-6 rounded-xl border border-[#E9E7E1] dark:border-[#2B2B2B] shadow-xs space-y-5">
        <div className="flex items-center gap-2 border-b border-[#F2F0EA] dark:border-[#262626] pb-3">
          <Building2 className="w-4 h-4 text-[#171717] dark:text-white" />
          <h2 className="text-sm font-bold text-[#171717] dark:text-[#F5F5F5]">Store Information &amp; Branding</h2>
        </div>

        <form onSubmit={handleSaveBusiness} className="space-y-4 text-xs">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
            <div>
              <label className="block text-[#777777] dark:text-[#A1A1A1] mb-1 font-medium">Business / Trade Name *</label>
              <input
                type="text"
                required
                value={businessName}
                onChange={(e) => setBusinessName(e.target.value)}
                className="w-full px-3 py-2 rounded-lg border border-[#E9E7E1] dark:border-[#333333] bg-white dark:bg-[#222222] text-[#171717] dark:text-white focus:outline-hidden focus:border-[#171717]"
              />
            </div>

            <div>
              <label className="block text-[#777777] dark:text-[#A1A1A1] mb-1 font-medium">Receipt ID Prefix</label>
              <input
                type="text"
                value={receiptPrefix}
                onChange={(e) => setReceiptPrefix(e.target.value)}
                placeholder="e.g. GYM-, STR-, REC-"
                className="w-full px-3 py-2 rounded-lg border border-[#E9E7E1] dark:border-[#333333] bg-white dark:bg-[#222222] text-[#171717] dark:text-white font-mono focus:outline-hidden focus:border-[#171717]"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
            <div>
              <label className="block text-[#777777] dark:text-[#A1A1A1] mb-1 font-medium">GSTIN / Tax Registration</label>
              <input
                type="text"
                value={taxIdentifier}
                onChange={(e) => setTaxIdentifier(e.target.value)}
                placeholder="e.g. 27AABCC1234F1Z5"
                className="w-full px-3 py-2 rounded-lg border border-[#E9E7E1] dark:border-[#333333] bg-white dark:bg-[#222222] text-[#171717] dark:text-white font-mono focus:outline-hidden focus:border-[#171717]"
              />
            </div>

            <div>
              <label className="block text-[#777777] dark:text-[#A1A1A1] mb-1 font-medium">Official Contact Email</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full px-3 py-2 rounded-lg border border-[#E9E7E1] dark:border-[#333333] bg-white dark:bg-[#222222] text-[#171717] dark:text-white focus:outline-hidden focus:border-[#171717]"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
            <div>
              <label className="block text-[#777777] dark:text-[#A1A1A1] mb-1 font-medium">Contact Phone</label>
              <input
                type="text"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                className="w-full px-3 py-2 rounded-lg border border-[#E9E7E1] dark:border-[#333333] bg-white dark:bg-[#222222] text-[#171717] dark:text-white focus:outline-hidden focus:border-[#171717]"
              />
            </div>

            <div>
              <label className="block text-[#777777] dark:text-[#A1A1A1] mb-1 font-medium">Registered Address</label>
              <input
                type="text"
                value={addressLine}
                onChange={(e) => setAddressLine(e.target.value)}
                className="w-full px-3 py-2 rounded-lg border border-[#E9E7E1] dark:border-[#333333] bg-white dark:bg-[#222222] text-[#171717] dark:text-white focus:outline-hidden focus:border-[#171717]"
              />
            </div>
          </div>

          <div className="flex justify-end pt-2">
            <button
              type="submit"
              className="w-full sm:w-auto px-4 py-2 bg-[#171717] dark:bg-white hover:bg-[#222222] dark:hover:bg-neutral-200 text-white dark:text-[#171717] rounded-lg font-medium transition shadow-xs cursor-pointer text-center"
            >
              Save Store Details
            </button>
          </div>
        </form>
      </div>

      {/* 4. USEFUL SETTING: Business Type Optimization */}
      <div className="bg-white dark:bg-[#1A1A1A] p-4 sm:p-6 rounded-xl border border-[#E9E7E1] dark:border-[#2B2B2B] shadow-xs space-y-4">
        <div className="flex items-center gap-2 border-b border-[#F2F0EA] dark:border-[#262626] pb-3">
          <Sparkles className="w-4 h-4 text-amber-600" />
          <h2 className="text-sm font-bold text-[#171717] dark:text-[#F5F5F5]">Business Category &amp; Layout Optimization</h2>
        </div>
        <p className="text-xs text-[#777777] dark:text-[#A1A1A1]">
          Tailors your default catalogue products, item descriptions, and receipt prefix.
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
                className={`p-3 rounded-xl border text-left flex items-start gap-2.5 transition cursor-pointer ${
                  isSelected
                    ? "bg-[#171717] dark:bg-white text-white dark:text-[#171717] border-[#171717] dark:border-white shadow-sm"
                    : "bg-white dark:bg-[#222222] text-[#171717] dark:text-[#F5F5F5] border-[#E9E7E1] dark:border-[#333333] hover:bg-[#F7F6F2] dark:hover:bg-[#2A2A2A]"
                }`}
              >
                <div
                  className={`w-7 h-7 rounded-lg flex items-center justify-center shrink-0 ${
                    isSelected ? "bg-white/20 dark:bg-black/10 text-white dark:text-black" : "bg-[#F2F0EA] dark:bg-neutral-800 text-[#171717] dark:text-white"
                  }`}
                >
                  <Icon className="w-3.5 h-3.5" />
                </div>
                <div>
                  <div className="font-bold text-xs">{c.label}</div>
                  <div className={`text-[10px] ${isSelected ? "text-slate-300 dark:text-neutral-600" : "text-[#777777] dark:text-[#A1A1A1]"}`}>
                    {c.desc}
                  </div>
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* 5. USEFUL SETTING: Pocket Bluetooth & POS Thermal Printer Configuration */}
      <div className="bg-white dark:bg-[#1A1A1A] p-4 sm:p-6 rounded-xl border border-[#E9E7E1] dark:border-[#2B2B2B] shadow-xs space-y-4">
        <div className="flex items-center gap-2 border-b border-[#F2F0EA] dark:border-[#262626] pb-3">
          <Printer className="w-4 h-4 text-[#171717] dark:text-white" />
          <h2 className="text-sm font-bold text-[#171717] dark:text-[#F5F5F5]">Pocket &amp; POS Thermal Printer Setup</h2>
        </div>

        <p className="text-xs text-[#777777] dark:text-[#A1A1A1] leading-relaxed">
          Configure direct hardware printing for mini handheld Bluetooth pocket printers (58mm) and supermarket POS thermal slip printers (80mm).
        </p>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs pt-1">
          <div>
            <label className="block text-[#555555] dark:text-[#A1A1A1] mb-1 font-medium">Default Slip Width</label>
            <select
              value={printerWidth}
              onChange={(e) => handleUpdatePrinterPrefs(e.target.value as ThermalPaperWidth, autoPrintOnSave)}
              className="w-full px-3 py-2 rounded-lg border border-[#E9E7E1] dark:border-[#333333] bg-white dark:bg-[#222222] text-[#171717] dark:text-white font-medium"
            >
              <option value="58mm">58mm (2-inch Pocket Bluetooth Printer)</option>
              <option value="80mm">80mm (3-inch Supermarket POS Counter Roll)</option>
              <option value="standard">Standard A4 / Laser Printer</option>
            </select>
          </div>

          <div className="flex items-center gap-2 pt-2 sm:pt-6">
            <label className="flex items-center gap-2 cursor-pointer text-xs font-medium text-[#171717] dark:text-[#F5F5F5]">
              <input
                type="checkbox"
                checked={autoPrintOnSave}
                onChange={(e) => handleUpdatePrinterPrefs(printerWidth, e.target.checked)}
                className="rounded border-[#E9E7E1] text-[#171717] focus:ring-0"
              />
              <span>Auto-trigger print when issuing a receipt</span>
            </label>
          </div>
        </div>
      </div>

      {/* 6. USEFUL SETTING: Local Database & Offline Snapshots (JSON Backup) */}
      <div className="bg-white dark:bg-[#1A1A1A] p-4 sm:p-6 rounded-xl border border-[#E9E7E1] dark:border-[#2B2B2B] shadow-xs space-y-4">
        <div className="flex items-center gap-2 border-b border-[#F2F0EA] dark:border-[#262626] pb-3">
          <Database className="w-4 h-4 text-[#171717] dark:text-white" />
          <h2 className="text-sm font-bold text-[#171717] dark:text-[#F5F5F5]">Data Backup &amp; Offline Export</h2>
        </div>

        <p className="text-xs text-[#777777] dark:text-[#A1A1A1] leading-relaxed">
          Your receipts, products, and customer profiles are preserved safely on your device via IndexedDB. You can export a full JSON snapshot of your data at any time.
        </p>

        <div className="pt-1 flex items-center gap-3">
          <button
            onClick={handleExportJSON}
            className="w-full sm:w-auto px-4 py-2 border border-[#E9E7E1] dark:border-[#333333] hover:bg-[#F7F6F2] dark:hover:bg-[#2A2A2A] text-[#171717] dark:text-[#F5F5F5] rounded-lg text-xs font-semibold transition shadow-xs cursor-pointer text-center"
          >
            Export Complete Database (JSON)
          </button>
        </div>
      </div>

      {/* 7. USEFUL SETTING: Danger Zone & Granular Delete Options */}
      <div className="bg-white dark:bg-[#1A1A1A] p-4 sm:p-6 rounded-xl border border-rose-200 dark:border-rose-900 shadow-xs space-y-5">
        <div className="flex items-center justify-between border-b border-rose-100 dark:border-rose-900 pb-3">
          <div className="flex items-center gap-2">
            <Trash2 className="w-4 h-4 text-rose-600" />
            <h2 className="text-sm font-bold text-rose-950 dark:text-rose-200">Data Management &amp; Delete Options</h2>
          </div>
          <span className="text-[10px] uppercase font-mono px-2 py-0.5 rounded-full bg-rose-50 dark:bg-rose-950/60 text-rose-700 dark:text-rose-300 font-semibold border border-rose-200 dark:border-rose-900">
            Irreversible Actions
          </span>
        </div>

        <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
          Select individual data categories to wipe or initiate a complete clean reset. Once confirmed, deleted records cannot be recovered.
        </p>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          {/* Delete Receipts */}
          <div className="p-4 rounded-xl border border-slate-200 dark:border-neutral-800 bg-slate-50/60 dark:bg-neutral-900 flex flex-col justify-between space-y-3">
            <div>
              <div className="flex items-center justify-between">
                <span className="font-bold text-xs text-slate-900 dark:text-white">Receipts</span>
                <span className="font-mono text-xs font-semibold px-2 py-0.5 rounded-md bg-white dark:bg-neutral-800 border border-slate-200 dark:border-neutral-700 text-slate-700 dark:text-slate-300">
                  {receiptsCount}
                </span>
              </div>
              <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1 leading-snug">
                Permanently wipes all recorded sales and payment receipts.
              </p>
            </div>
            <button
              type="button"
              onClick={handleClearReceipts}
              disabled={receiptsCount === 0}
              className="w-full py-2 px-3 bg-white dark:bg-neutral-800 hover:bg-rose-50 dark:hover:bg-rose-950/40 text-rose-600 dark:text-rose-400 border border-slate-300 dark:border-neutral-700 hover:border-rose-300 rounded-lg text-xs font-medium transition cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
            >
              Delete All Receipts
            </button>
          </div>

          {/* Delete Customers */}
          <div className="p-4 rounded-xl border border-slate-200 dark:border-neutral-800 bg-slate-50/60 dark:bg-neutral-900 flex flex-col justify-between space-y-3">
            <div>
              <div className="flex items-center justify-between">
                <span className="font-bold text-xs text-slate-900 dark:text-white">Customers</span>
                <span className="font-mono text-xs font-semibold px-2 py-0.5 rounded-md bg-white dark:bg-neutral-800 border border-slate-200 dark:border-neutral-700 text-slate-700 dark:text-slate-300">
                  {customersCount}
                </span>
              </div>
              <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1 leading-snug">
                Permanently wipes all client profiles and contact addresses.
              </p>
            </div>
            <button
              type="button"
              onClick={handleClearCustomers}
              disabled={customersCount === 0}
              className="w-full py-2 px-3 bg-white dark:bg-neutral-800 hover:bg-rose-50 dark:hover:bg-rose-950/40 text-rose-600 dark:text-rose-400 border border-slate-300 dark:border-neutral-700 hover:border-rose-300 rounded-lg text-xs font-medium transition cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
            >
              Delete All Customers
            </button>
          </div>

          {/* Delete Catalogue */}
          <div className="p-4 rounded-xl border border-slate-200 dark:border-neutral-800 bg-slate-50/60 dark:bg-neutral-900 flex flex-col justify-between space-y-3">
            <div>
              <div className="flex items-center justify-between">
                <span className="font-bold text-xs text-slate-900 dark:text-white">Catalogue</span>
                <span className="font-mono text-xs font-semibold px-2 py-0.5 rounded-md bg-white dark:bg-neutral-800 border border-slate-200 dark:border-neutral-700 text-slate-700 dark:text-slate-300">
                  {productsCount}
                </span>
              </div>
              <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1 leading-snug">
                Permanently wipes all product items, gym plans, and SKUs.
              </p>
            </div>
            <button
              type="button"
              onClick={handleClearProducts}
              disabled={productsCount === 0}
              className="w-full py-2 px-3 bg-white dark:bg-neutral-800 hover:bg-rose-50 dark:hover:bg-rose-950/40 text-rose-600 dark:text-rose-400 border border-slate-300 dark:border-neutral-700 hover:border-rose-300 rounded-lg text-xs font-medium transition cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
            >
              Delete All Catalogue
            </button>
          </div>
        </div>

        {/* Master Delete Everything Button */}
        <div className="pt-3 border-t border-rose-100 dark:border-rose-900 flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="space-y-0.5 text-center sm:text-left">
            <span className="font-bold text-xs text-rose-900 dark:text-rose-300 block">
              Delete Everything (Master Reset)
            </span>
            <span className="text-[11px] text-slate-500 dark:text-slate-400 block">
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

      {/* Auth Modal for switching / adding accounts */}
      <AuthModal
        isOpen={authModalOpen}
        onClose={() => setAuthModalOpen(false)}
        defaultMode={authModalMode}
        isDismissible={true}
      />
    </div>
  );
};
