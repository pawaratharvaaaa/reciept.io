"use client";

import React, { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  ReceiptText,
  Plus,
  Users,
  Menu,
  X,
  Package,
  BarChart3,
  Palette,
  Settings,
  Sparkles,
  UserCheck,
  ChevronRight,
  ShieldCheck,
  LogOut,
} from "lucide-react";
import { useAuth } from "@/lib/auth/auth-context";
import { BUSINESS_CATEGORIES, BusinessCategoryKey } from "@/lib/business-categories";

interface BottomNavProps {
  onOpenAuthModal?: () => void;
}

export const BottomNav: React.FC<BottomNavProps> = ({ onOpenAuthModal }) => {
  const pathname = usePathname();
  const [moreDrawerOpen, setMoreDrawerOpen] = useState(false);
  const { user, businessProfile, switchIndustry, logout } = useAuth();

  const currentCategory = (businessProfile?.businessCategory ||
    user?.businessCategory ||
    "freelancer_services") as BusinessCategoryKey;
  const currentCategoryConfig = BUSINESS_CATEGORIES[currentCategory] || BUSINESS_CATEGORIES.custom;

  const isActive = (href: string) => {
    if (href === "/") return pathname === "/";
    return pathname?.startsWith(href);
  };

  return (
    <>
      {/* Fixed Bottom Navigation Bar - Mobile App Style */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 w-full max-w-full bg-white/95 backdrop-blur-xl border-t border-[#E9E7E1] z-40 px-1 py-1 pb-[max(0.5rem,env(safe-area-inset-bottom))] shadow-lg print:hidden">
        <div className="grid grid-cols-5 items-center w-full">
          {/* 1. Home */}
          <Link
            href="/"
            className={`flex flex-col items-center justify-center py-1 transition ${
              isActive("/") ? "text-[#171717] font-bold" : "text-[#777777] hover:text-[#171717]"
            }`}
          >
            <LayoutDashboard className={`w-5 h-5 ${isActive("/") ? "stroke-[2.5]" : "stroke-2"}`} />
            <span className="text-[10px] mt-0.5 font-medium">Home</span>
          </Link>

          {/* 2. Receipts */}
          <Link
            href="/receipts"
            className={`flex flex-col items-center justify-center py-1 transition ${
              isActive("/receipts") && pathname !== "/receipts/new"
                ? "text-[#171717] font-bold"
                : "text-[#777777] hover:text-[#171717]"
            }`}
          >
            <ReceiptText
              className={`w-5 h-5 ${
                isActive("/receipts") && pathname !== "/receipts/new"
                  ? "stroke-[2.5]"
                  : "stroke-2"
              }`}
            />
            <span className="text-[10px] mt-0.5 font-medium">Receipts</span>
          </Link>

          {/* 3. CENTER CREATE BUTTON (Native App FAB) */}
          <div className="flex justify-center -mt-5">
            <Link
              href="/receipts/new"
              className="flex items-center justify-center w-12 h-12 rounded-full bg-[#171717] text-white shadow-xl shadow-black/20 active:scale-90 transition transform border-2 border-white cursor-pointer"
              title="Issue New Receipt"
            >
              <Plus className="w-6 h-6 stroke-[2.5]" />
            </Link>
          </div>

          {/* 4. Customers */}
          <Link
            href="/customers"
            className={`flex flex-col items-center justify-center py-1 transition ${
              isActive("/customers")
                ? "text-[#171717] font-bold"
                : "text-[#777777] hover:text-[#171717]"
            }`}
          >
            <Users
              className={`w-5 h-5 ${isActive("/customers") ? "stroke-[2.5]" : "stroke-2"}`}
            />
            <span className="text-[10px] mt-0.5 font-medium">Clients</span>
          </Link>

          {/* 5. More App Drawer Trigger */}
          <button
            type="button"
            onClick={() => setMoreDrawerOpen(true)}
            className={`flex flex-col items-center justify-center py-1 transition cursor-pointer ${
              moreDrawerOpen ? "text-[#171717] font-bold" : "text-[#777777] hover:text-[#171717]"
            }`}
          >
            <Menu className="w-5 h-5 stroke-2" />
            <span className="text-[10px] mt-0.5 font-medium">More</span>
          </button>
        </div>
      </nav>

      {/* Mobile "More" Native Action Sheet / Drawer */}
      {moreDrawerOpen && (
        <>
          <div
            className="fixed inset-0 bg-black/50 backdrop-blur-xs z-50 transition-opacity"
            onClick={() => setMoreDrawerOpen(false)}
          />
          <div className="fixed inset-x-0 bottom-0 bg-white rounded-t-3xl shadow-2xl z-50 p-5 pb-[max(1.5rem,env(safe-area-inset-bottom))] max-h-[85vh] overflow-y-auto animate-in slide-in-from-bottom duration-200">
            {/* Drawer Handle */}
            <div className="w-12 h-1.5 bg-[#E9E7E1] rounded-full mx-auto mb-4" />

            {/* Profile Header */}
            <div className="flex items-center justify-between pb-4 border-b border-[#F2F0EA]">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-[#171717] text-white flex items-center justify-center font-bold text-sm">
                  {(user?.fullName || "US").slice(0, 2).toUpperCase()}
                </div>
                <div>
                  <h3 className="font-bold text-sm text-[#171717]">
                    {businessProfile?.businessName || user?.businessName || "My Business"}
                  </h3>
                  <p className="text-xs text-[#777777]">
                    {currentCategoryConfig.shortName} • {user?.email || "Local User"}
                  </p>
                </div>
              </div>
              <button
                onClick={() => setMoreDrawerOpen(false)}
                className="p-1.5 rounded-full bg-[#F7F6F2] text-[#777777]"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Quick App Actions */}
            <div className="grid grid-cols-2 gap-2.5 my-4">
              <button
                onClick={() => {
                  setMoreDrawerOpen(false);
                  onOpenAuthModal?.();
                }}
                className="flex items-center gap-2 p-3 rounded-xl bg-[#F7F6F2] hover:bg-[#E9E7E1] text-left transition cursor-pointer"
              >
                <UserCheck className="w-4 h-4 text-blue-600" />
                <span className="text-xs font-semibold text-[#171717]">Switch Account</span>
              </button>

              <button
                onClick={() => {
                  setMoreDrawerOpen(false);
                  logout();
                }}
                className="flex items-center gap-2 p-3 rounded-xl bg-rose-50 hover:bg-rose-100 text-left transition cursor-pointer"
              >
                <LogOut className="w-4 h-4 text-rose-600" />
                <span className="text-xs font-semibold text-rose-700">Log Out</span>
              </button>
            </div>

            {/* Navigation Links */}
            <div className="space-y-1">
              {[
                { label: "Product Catalogue", href: "/products", icon: Package },
                { label: "Financial Analytics & Export", href: "/analytics", icon: BarChart3 },
                { label: "Receipt Templates", href: "/templates", icon: Palette },
                { label: "System & Thermal Settings", href: "/settings", icon: Settings },
              ].map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={() => setMoreDrawerOpen(false)}
                  className="flex items-center justify-between p-3 rounded-xl hover:bg-[#F7F6F2] text-[#171717] transition"
                >
                  <div className="flex items-center gap-3">
                    <item.icon className="w-4 h-4 text-[#777777]" />
                    <span className="text-sm font-medium">{item.label}</span>
                  </div>
                  <ChevronRight className="w-4 h-4 text-[#CCCCCC]" />
                </Link>
              ))}
            </div>

            {/* Security Badge */}
            <div className="mt-5 pt-3 border-t border-[#F2F0EA] flex items-center justify-center gap-2 text-xs text-[#777777]">
              <ShieldCheck className="w-4 h-4 text-emerald-600" />
              <span>Firewall Protected • Supabase Cloud Synchronized</span>
            </div>
          </div>
        </>
      )}
    </>
  );
};
