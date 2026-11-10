"use client";

import React, { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  ReceiptText,
  PlusCircle,
  Users,
  Package,
  BarChart3,
  Palette,
  Settings,
  ChevronDown,
  Sparkles,
  Dumbbell,
  ShoppingBag,
  Laptop,
  Coffee,
  UserCheck,
  Search,
  Building2,
} from "lucide-react";
import { useAuth } from "@/lib/auth/auth-context";
import { BUSINESS_CATEGORIES, BusinessCategoryKey } from "@/lib/business-categories";
import { CloudSyncIndicator } from "./CloudSyncIndicator";

interface TopNavbarProps {
  onOpenCommandPalette: () => void;
  onOpenAuthModal: () => void;
  onOpenIntro: () => void;
}

export const TopNavbar: React.FC<TopNavbarProps> = ({
  onOpenCommandPalette,
  onOpenAuthModal,
  onOpenIntro,
}) => {
  const pathname = usePathname();
  const [industryDropdownOpen, setIndustryDropdownOpen] = useState(false);
  const { user, businessProfile, switchIndustry } = useAuth();

  const currentCategory = (businessProfile?.businessCategory ||
    user?.businessCategory ||
    "freelancer_services") as BusinessCategoryKey;
  const currentCategoryConfig = BUSINESS_CATEGORIES[currentCategory] || BUSINESS_CATEGORIES.custom;

  const getCategoryIcon = (catKey: BusinessCategoryKey) => {
    switch (catKey) {
      case "gym_fitness":
        return <Dumbbell className="w-3.5 h-3.5" />;
      case "general_store":
        return <ShoppingBag className="w-3.5 h-3.5" />;
      case "restaurant_cafe":
        return <Coffee className="w-3.5 h-3.5" />;
      case "freelancer_services":
      default:
        return <Laptop className="w-3.5 h-3.5" />;
    }
  };

  const navItems = [
    { label: "Overview", href: "/", icon: LayoutDashboard },
    { label: "Receipts", href: "/receipts", icon: ReceiptText },
    { label: "Customers", href: "/customers", icon: Users },
    { label: "Products", href: "/products", icon: Package },
    { label: "Analytics", href: "/analytics", icon: BarChart3 },
    { label: "Templates", href: "/templates", icon: Palette },
    { label: "Settings", href: "/settings", icon: Settings },
  ];

  const isActive = (href: string) => {
    if (href === "/") return pathname === "/";
    return pathname?.startsWith(href);
  };

  return (
    <header className="sticky top-0 z-30 w-full bg-white/95 backdrop-blur-md border-b border-[#E9E7E1] shrink-0 no-print">
      <div className="max-w-[1600px] mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between gap-4">
        {/* Left: Brand & Active Workspace */}
        <div className="flex items-center gap-4 shrink-0">
          <Link href="/" className="flex items-center gap-2.5 group">
            <div className="w-9 h-9 rounded-xl bg-[#090d16] border border-white/10 flex items-center justify-center text-white font-mono font-bold text-sm shadow-sm group-hover:scale-105 transition">
              R.
            </div>
            <div className="leading-tight">
              <span className="font-bold text-base tracking-tight text-[#171717] block">
                Reciept.io
              </span>
              <span className="block text-[10px] font-mono text-[#777777] uppercase tracking-wider">
                {currentCategoryConfig.shortName}
              </span>
            </div>
          </Link>

          {/* Workspace Pill */}
          <div className="hidden xl:flex items-center gap-2 px-2.5 py-1 rounded-lg bg-[#F7F6F2] border border-[#E9E7E1] text-xs">
            <span className="w-2 h-2 rounded-full bg-emerald-500" />
            <span className="font-medium text-[#171717] max-w-[140px] truncate">
              {businessProfile?.businessName || user?.businessName || "My Business"}
            </span>
            <button
              onClick={onOpenAuthModal}
              className="text-[10px] text-blue-600 hover:underline font-semibold ml-1 cursor-pointer"
            >
              Switch
            </button>
          </div>
        </div>

        {/* Center: Desktop Navigation Tabs */}
        <nav className="hidden lg:flex items-center gap-1">
          {navItems.map((item) => {
            const active = isActive(item.href);
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition ${
                  active
                    ? "bg-[#171717] text-white shadow-xs"
                    : "text-[#666666] hover:text-[#171717] hover:bg-[#F7F6F2]"
                }`}
              >
                <item.icon className="w-3.5 h-3.5" />
                <span>{item.label}</span>
              </Link>
            );
          })}

          {/* Prominent Create Receipt Button */}
          <Link
            href="/receipts/new"
            className="flex items-center gap-1.5 ml-2 px-3.5 py-1.5 rounded-lg text-xs font-bold bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white shadow-sm shadow-blue-500/20 active:scale-95 transition"
          >
            <PlusCircle className="w-3.5 h-3.5" />
            <span>Create Receipt</span>
          </Link>
        </nav>

        {/* Right: Search, Mode, Cloud Sync, User Profile */}
        <div className="flex items-center gap-2 sm:gap-2.5 shrink-0">
          {/* Spotlight Search / Command Palette */}
          <button
            onClick={onOpenCommandPalette}
            className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg border border-[#E9E7E1] bg-[#F7F6F2] hover:bg-[#EAE8E2] text-xs text-[#777777] transition cursor-pointer"
            title="Search commands (Ctrl+K)"
          >
            <Search className="w-3.5 h-3.5" />
            <span className="hidden md:inline font-medium">Search</span>
            <kbd className="hidden md:inline text-[9px] px-1 py-0.2 rounded bg-white border border-[#DDD] font-mono text-[#555]">
              ⌘K
            </kbd>
          </button>

          {/* Quick Industry Optimization Mode Dropdown */}
          <div className="relative">
            <button
              onClick={() => setIndustryDropdownOpen(!industryDropdownOpen)}
              className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg border border-[#E9E7E1] bg-[#F7F6F2] hover:bg-[#E9E7E1] text-xs font-medium text-[#171717] transition cursor-pointer"
              title="Switch business optimization type"
            >
              {getCategoryIcon(currentCategory)}
              <span className="hidden sm:inline font-semibold">{currentCategoryConfig.shortName}</span>
              <ChevronDown className="w-3 h-3 text-[#777777]" />
            </button>

            {industryDropdownOpen && (
              <>
                <div
                  className="fixed inset-0 z-40"
                  onClick={() => setIndustryDropdownOpen(false)}
                />
                <div className="absolute right-0 top-full mt-1.5 w-60 bg-white border border-[#E9E7E1] rounded-xl shadow-xl z-50 p-1.5 space-y-1 text-xs">
                  <div className="px-2 py-1 text-[10px] font-mono uppercase text-[#777777] border-b border-[#F2F0EA]">
                    Optimize Experience For:
                  </div>
                  {Object.values(BUSINESS_CATEGORIES)
                    .filter((c) => c.key !== "custom")
                    .map((cat) => {
                      const isCurrent = currentCategory === cat.key;
                      return (
                        <button
                          key={cat.key}
                          onClick={() => {
                            switchIndustry(cat.key);
                            setIndustryDropdownOpen(false);
                          }}
                          className={`w-full flex items-center gap-2 p-2 rounded-lg text-left transition cursor-pointer ${
                            isCurrent
                              ? "bg-[#171717] text-white"
                              : "hover:bg-[#F7F6F2] text-[#171717]"
                          }`}
                        >
                          <div className={isCurrent ? "text-white" : "text-[#777777]"}>
                            {getCategoryIcon(cat.key)}
                          </div>
                          <div>
                            <div className="font-semibold">{cat.shortName}</div>
                            <div
                              className={`text-[10px] ${
                                isCurrent ? "text-slate-300" : "text-[#777777]"
                              }`}
                            >
                              Prefix: {cat.receiptPrefix}
                            </div>
                          </div>
                        </button>
                      );
                    })}
                </div>
              </>
            )}
          </div>

          {/* Supabase Cloud Live Sync Indicator */}
          <CloudSyncIndicator />

          {/* Replay Logo Reveal Preloader */}
          <button
            onClick={onOpenIntro}
            className="hidden sm:flex items-center gap-1 px-2.5 py-1.5 rounded-lg border border-purple-200 bg-purple-50 hover:bg-purple-100 text-purple-900 text-xs font-semibold transition cursor-pointer"
            title="Replay Liquid Glass Preloader"
          >
            <Sparkles className="w-3.5 h-3.5 text-purple-600" />
            <span className="hidden xl:inline">Intro</span>
          </button>

          {/* User Account / Profile Button */}
          <button
            onClick={onOpenAuthModal}
            className="flex items-center gap-2 pl-2 pr-2.5 py-1 rounded-xl hover:bg-[#F7F6F2] border border-transparent hover:border-[#E9E7E1] transition cursor-pointer"
            title="User Profile & Multi-Tenant Accounts"
          >
            <div className="w-7 h-7 rounded-full bg-[#171717] text-white flex items-center justify-center font-bold text-xs shadow-xs">
              {(user?.fullName || "US").slice(0, 2).toUpperCase()}
            </div>
            <div className="hidden sm:block text-left leading-tight">
              <span className="font-semibold text-xs text-[#171717] block truncate max-w-[100px]">
                {user?.fullName || "Account"}
              </span>
            </div>
          </button>
        </div>
      </div>
    </header>
  );
};

export default TopNavbar;
