"use client";

import React, { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import Image from "next/image";
import {
  LayoutDashboard,
  ReceiptText,
  Plus,
  PlusCircle,
  Users,
  Package,
  BarChart3,
  Palette,
  Settings,
  Search,
  Sparkles,
  ChevronDown,
  Dumbbell,
  ShoppingBag,
  Laptop,
  Coffee,
  Cloud,
  Check,
  RefreshCw,
  LogOut,
  UserCheck,
  Building2,
} from "lucide-react";
import { useAuth } from "@/lib/auth/auth-context";
import { BUSINESS_CATEGORIES, BusinessCategoryKey } from "@/lib/business-categories";
import { useCloudSync } from "@/lib/sync/sync-coordinator";

interface FloatingNavbarProps {
  onOpenCommandPalette: () => void;
  onOpenAuthModal: () => void;
}

export const FloatingNavbar: React.FC<FloatingNavbarProps> = ({
  onOpenCommandPalette,
  onOpenAuthModal,
}) => {
  const pathname = usePathname();
  const [profileDropdownOpen, setProfileDropdownOpen] = useState(false);
  const { user, businessProfile, switchIndustry, logout } = useAuth();
  const { state: syncState, triggerSync, lastSyncedAt } = useCloudSync();

  const currentCategory = (businessProfile?.businessCategory ||
    user?.businessCategory ||
    "freelancer_services") as BusinessCategoryKey;
  const currentCategoryConfig = BUSINESS_CATEGORIES[currentCategory] || BUSINESS_CATEGORIES.custom;

  const navItems = [
    { label: "Overview", href: "/", icon: LayoutDashboard },
    { label: "New Receipt", href: "/receipts/new", icon: PlusCircle },
    { label: "Receipts", href: "/receipts", icon: ReceiptText },
    { label: "Customers", href: "/customers", icon: Users },
    { label: "Products", href: "/products", icon: Package },
    { label: "Analytics", href: "/analytics", icon: BarChart3 },
    { label: "Templates", href: "/templates", icon: Palette },
    { label: "Settings", href: "/settings", icon: Settings },
  ];

  // Disambiguate routes accurately: /receipts/new must NEVER match /receipts
  const getActiveHref = (path: string | null): string => {
    if (!path || path === "/") return "/";
    if (path === "/receipts/new" || path.startsWith("/receipts/new")) return "/receipts/new";
    if (path.startsWith("/receipts")) return "/receipts";
    if (path.startsWith("/customers")) return "/customers";
    if (path.startsWith("/products")) return "/products";
    if (path.startsWith("/analytics")) return "/analytics";
    if (path.startsWith("/templates")) return "/templates";
    if (path.startsWith("/settings")) return "/settings";
    return "/";
  };

  const activeHref = getActiveHref(pathname);
  const [optimisticHref, setOptimisticHref] = useState<string | null>(null);
  const currentActive = optimisticHref ?? activeHref;

  // Clear optimistic click override once route finishes loading
  React.useEffect(() => {
    setOptimisticHref(null);
  }, [pathname]);

  // Animated sliding pill indicator state & measurements
  const navContainerRef = React.useRef<HTMLDivElement>(null);
  const itemRefs = React.useRef<Map<string, HTMLAnchorElement>>(new Map());
  const [pillStyle, setPillStyle] = useState<{
    left: number;
    top: number;
    width: number;
    height: number;
    opacity: number;
  }>({
    left: 0,
    top: 0,
    width: 36,
    height: 36,
    opacity: 0,
  });
  const [isPillReady, setIsPillReady] = useState(false);

  const measurePill = React.useCallback(
    (targetEl?: HTMLElement | null) => {
      const activeEl = targetEl || (currentActive ? itemRefs.current.get(currentActive) : null);
      const container = navContainerRef.current;
      if (activeEl && container) {
        const containerRect = container.getBoundingClientRect();
        const targetRect = activeEl.getBoundingClientRect();
        setPillStyle({
          left: targetRect.left - containerRect.left,
          top: targetRect.top - containerRect.top,
          width: targetRect.width,
          height: targetRect.height,
          opacity: 1,
        });
        setIsPillReady(true);
      } else if (!currentActive) {
        setPillStyle((prev) => ({ ...prev, opacity: 0 }));
      }
    },
    [currentActive]
  );

  const useIsomorphicLayoutEffect =
    typeof window !== "undefined" ? React.useLayoutEffect : React.useEffect;

  useIsomorphicLayoutEffect(() => {
    measurePill();
    const raf = requestAnimationFrame(() => measurePill());
    const onResize = () => measurePill();
    window.addEventListener("resize", onResize);
    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("resize", onResize);
    };
  }, [measurePill, pathname, currentActive]);

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

  return (
    <>
      {/* 1. Mobile Top App Header (Clean Edge-to-Edge Navigation for Phones) */}
      <header className="md:hidden fixed top-0 left-0 right-0 h-14 bg-white/95 backdrop-blur-xl border-b border-[#E9E7E1] z-50 flex items-center justify-between px-3.5 no-print shadow-2xs">
        <Link href="/" className="flex items-center gap-2" title="Reciept.io Home">
          <div className="w-8 h-8 rounded-full bg-[#090d16] flex items-center justify-center text-white overflow-hidden shadow-xs ring-1 ring-white/10 shrink-0">
            <span className="font-mono font-bold text-xs tracking-tight">R.</span>
          </div>
          <span className="font-bold text-sm text-[#171717] tracking-tight truncate max-w-[170px]">
            {businessProfile?.businessName || "reciept.io"}
          </span>
        </Link>

        <div className="flex items-center gap-1.5">
          <button
            type="button"
            onClick={onOpenCommandPalette}
            className="p-2 rounded-full hover:bg-black/5 text-[#555555] active:bg-black/10 transition cursor-pointer"
            title="Search commands"
          >
            <Search className="w-4 h-4" />
          </button>

          <button
            type="button"
            onClick={() => setProfileDropdownOpen(!profileDropdownOpen)}
            className="flex items-center p-0.5 rounded-full hover:bg-black/5 transition cursor-pointer"
            title="Account & Settings"
          >
            <div className="w-7 h-7 rounded-full bg-[#171717] text-white flex items-center justify-center font-bold text-[11px] shadow-xs">
              {(user?.fullName || "US").slice(0, 2).toUpperCase()}
            </div>
          </button>
        </div>
      </header>

      {/* 2. Desktop Floating Island Navigation Dock */}
      <div className="hidden md:flex fixed top-3.5 left-0 right-0 z-50 justify-center px-4 pointer-events-none no-print">
        <nav className="pointer-events-auto flex items-center gap-2 sm:gap-3 px-3 py-1.5 rounded-full bg-white/90 backdrop-blur-xl border border-black/10 shadow-2xl shadow-black/8 ring-1 ring-black/5 max-w-fit transition-all duration-300">
          
          {/* Left: Brand Icon */}
          <Link
            href="/"
            className="flex items-center p-1 rounded-full hover:bg-black/5 transition group shrink-0"
            title="Reciept.io Home"
          >
            <div className="w-8 h-8 rounded-full bg-[#090d16] flex items-center justify-center text-white overflow-hidden shadow-xs ring-1 ring-white/10 group-hover:scale-105 transition">
              <span className="font-mono font-bold text-xs tracking-tight">R.</span>
            </div>
          </Link>

          {/* Divider */}
          <div className="h-4 w-[1px] bg-black/10" />

          {/* Center: Desktop Navigation Icon Dock with Smooth Sliding Spring Indicator */}
          <div ref={navContainerRef} className="relative flex items-center gap-1 sm:gap-1.5 px-0.5">
            {/* Fluid Animated Sliding Indicator Pill - Pixel-perfect aligned */}
            <div
              className="absolute top-0 left-0 rounded-full bg-[#171717] shadow-xs pointer-events-none z-0"
              style={{
                transform: `translate3d(${pillStyle.left}px, ${pillStyle.top}px, 0)`,
                width: `${pillStyle.width}px`,
                height: `${pillStyle.height}px`,
                opacity: pillStyle.opacity,
                transition: isPillReady
                  ? "transform 280ms cubic-bezier(0.2, 0.8, 0.2, 1), opacity 150ms ease"
                  : "opacity 150ms ease",
              }}
            />

            {navItems.map((item) => {
              const isItemActive = currentActive === item.href;
              return (
                <Link
                  key={item.href}
                  ref={(el) => {
                    if (el) itemRefs.current.set(item.href, el);
                    else itemRefs.current.delete(item.href);
                  }}
                  href={item.href}
                  onClick={(e) => {
                    setOptimisticHref(item.href);
                    measurePill(e.currentTarget);
                  }}
                  title={item.label}
                  aria-label={item.label}
                  className={`relative z-10 w-9 h-9 rounded-full flex items-center justify-center transition-colors duration-200 select-none group cursor-pointer ${
                    isItemActive
                      ? "text-white"
                      : "text-[#555555] hover:text-[#171717] hover:bg-black/5 active:scale-95"
                  }`}
                >
                  <item.icon className="w-4 h-4 transition-transform duration-200 group-hover:scale-105 group-active:scale-90" />
                  <span className="sr-only">{item.label}</span>
                </Link>
              );
            })}
          </div>

          {/* Divider */}
          <div className="h-4 w-[1px] bg-black/10" />

          {/* Right: Floating Controls */}
          <div className="flex items-center gap-1 shrink-0">
            {/* Spotlight Search Icon Button */}
            <button
              onClick={onOpenCommandPalette}
              className="p-2 sm:p-2.5 rounded-full hover:bg-black/5 text-[#555555] hover:text-[#171717] transition cursor-pointer flex items-center justify-center"
              title="Search commands (Ctrl+K / Cmd+K)"
              aria-label="Search"
            >
              <Search className="w-4 h-4" />
            </button>

            {/* Profile & Settings Dropdown Trigger */}
            <div className="relative">
              <button
                onClick={() => setProfileDropdownOpen(!profileDropdownOpen)}
                className="flex items-center p-0.5 rounded-full hover:bg-black/5 transition cursor-pointer"
                title="Account & Optimization Modes"
              >
                <div className="w-8 h-8 rounded-full bg-[#171717] text-white flex items-center justify-center font-bold text-xs shadow-xs">
                  {(user?.fullName || "US").slice(0, 2).toUpperCase()}
                </div>
              </button>

            {profileDropdownOpen && (
              <>
                <div
                  className="fixed inset-0 z-40"
                  onClick={() => setProfileDropdownOpen(false)}
                />
                <div className="absolute right-0 top-full mt-2 w-64 bg-white/95 backdrop-blur-xl rounded-2xl shadow-2xl border border-black/10 p-2 z-50 text-xs space-y-2 animate-in fade-in zoom-in-95 duration-150">
                  {/* Account Header */}
                  <div className="p-2 border-b border-[#F2F0EA] space-y-0.5">
                    <div className="font-bold text-[#171717] truncate">
                      {user?.fullName || "Active Account"}
                    </div>
                    <div className="text-[11px] text-[#777777] truncate">
                      {user?.email || "Local user"}
                    </div>
                    <div className="text-[10px] font-mono text-emerald-700 bg-emerald-50 px-1.5 py-0.5 rounded inline-block mt-1 font-semibold">
                      {businessProfile?.businessName || "My Business"}
                    </div>
                  </div>

                  {/* Industry Optimization Selector */}
                  <div className="p-1 space-y-1">
                    <div className="text-[10px] font-mono uppercase text-[#777777] px-2 py-0.5">
                      Business Mode:
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
                              setProfileDropdownOpen(false);
                            }}
                            className={`w-full flex items-center justify-between p-2 rounded-xl text-left transition cursor-pointer ${
                              isCurrent
                                ? "bg-[#171717] text-white"
                                : "hover:bg-[#F7F6F2] text-[#171717]"
                            }`}
                          >
                            <div className="flex items-center gap-2">
                              {getCategoryIcon(cat.key)}
                              <span className="font-medium text-xs">{cat.shortName}</span>
                            </div>
                            {isCurrent && <Check className="w-3.5 h-3.5 text-white" />}
                          </button>
                        );
                      })}
                  </div>

                  {/* Actions */}
                  <div className="pt-1 border-t border-[#F2F0EA] space-y-1">
                    <button
                      onClick={() => {
                        setProfileDropdownOpen(false);
                        triggerSync();
                      }}
                      className="w-full flex items-center gap-2 p-2 rounded-xl text-emerald-900 hover:bg-emerald-50 transition text-left cursor-pointer"
                    >
                      <Cloud className="w-3.5 h-3.5 text-emerald-600" />
                      <span className="font-medium text-xs">Sync Supabase Ledger</span>
                    </button>

                    <button
                      onClick={() => {
                        setProfileDropdownOpen(false);
                        onOpenAuthModal();
                      }}
                      className="w-full flex items-center gap-2 p-2 rounded-xl text-[#171717] hover:bg-[#F7F6F2] transition text-left cursor-pointer"
                    >
                      <UserCheck className="w-3.5 h-3.5 text-blue-600" />
                      <span className="font-medium text-xs">Switch or Create Account</span>
                    </button>

                    <button
                      onClick={() => {
                        setProfileDropdownOpen(false);
                        logout();
                      }}
                      className="w-full flex items-center gap-2 p-2 rounded-xl text-rose-700 hover:bg-rose-50 transition text-left cursor-pointer border-t border-[#F2F0EA] mt-1"
                    >
                      <LogOut className="w-3.5 h-3.5 text-rose-600" />
                      <span className="font-medium text-xs">Log Out (Lock Workspace)</span>
                    </button>
                  </div>
                </div>
              </>
            )}
          </div>
        </div>
      </nav>
      </div>
    </>
  );
};

export default FloatingNavbar;
