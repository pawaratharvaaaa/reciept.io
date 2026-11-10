"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import {
  Search,
  PlusCircle,
  ReceiptText,
  Users,
  Package,
  BarChart3,
  Palette,
  Settings,
  Sparkles,
  Cloud,
  Command,
  X,
  Dumbbell,
  ShoppingBag,
  Laptop,
  Trash2,
} from "lucide-react";
import { useCloudSync } from "@/lib/sync/sync-coordinator";
import { useAuth } from "@/lib/auth/auth-context";

interface CommandPaletteProps {
  isOpen: boolean;
  onClose: () => void;
  onOpenIntro?: () => void;
}

export const CommandPalette: React.FC<CommandPaletteProps> = ({
  isOpen,
  onClose,
  onOpenIntro,
}) => {
  const router = useRouter();
  const [query, setQuery] = useState("");
  const { triggerSync } = useCloudSync();
  const { switchIndustry } = useAuth();

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        if (isOpen) onClose();
        else {
          setQuery("");
        }
      }
      if (e.key === "Escape" && isOpen) {
        onClose();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const actions = [
    {
      id: "new-receipt",
      title: "Create New Receipt",
      category: "Quick Actions",
      icon: PlusCircle,
      action: () => router.push("/receipts/new"),
    },
    {
      id: "receipts",
      title: "View All Receipts & Filter",
      category: "Navigation",
      icon: ReceiptText,
      action: () => router.push("/receipts"),
    },
    {
      id: "customers",
      title: "Customer Directory",
      category: "Navigation",
      icon: Users,
      action: () => router.push("/customers"),
    },
    {
      id: "products",
      title: "Product & Services Catalogue",
      category: "Navigation",
      icon: Package,
      action: () => router.push("/products"),
    },
    {
      id: "analytics",
      title: "Financial Analytics & Charts",
      category: "Navigation",
      icon: BarChart3,
      action: () => router.push("/analytics"),
    },
    {
      id: "sync",
      title: "Sync with Supabase Cloud Now",
      category: "Cloud",
      icon: Cloud,
      action: () => triggerSync(),
    },
    {
      id: "intro",
      title: "Play Liquid Glass Logo Reveal",
      category: "Experience",
      icon: Sparkles,
      action: () => onOpenIntro?.(),
    },
    {
      id: "mode-gym",
      title: "Switch Mode: Gym & Fitness Studio",
      category: "Business Optimization",
      icon: Dumbbell,
      action: () => switchIndustry("gym_fitness"),
    },
    {
      id: "mode-store",
      title: "Switch Mode: General Store / Kirana",
      category: "Business Optimization",
      icon: ShoppingBag,
      action: () => switchIndustry("general_store"),
    },
    {
      id: "mode-freelance",
      title: "Switch Mode: Freelancers & Services",
      category: "Business Optimization",
      icon: Laptop,
      action: () => switchIndustry("freelancer_services"),
    },
    {
      id: "settings",
      title: "Settings & Thermal Printer Config",
      category: "Navigation",
      icon: Settings,
      action: () => router.push("/settings"),
    },
    {
      id: "reset-data",
      title: "Data Reset & Delete Options",
      category: "Danger Zone",
      icon: Trash2,
      action: () => router.push("/settings"),
    },
  ];

  const filtered = actions.filter((a) =>
    a.title.toLowerCase().includes(query.toLowerCase()) ||
    a.category.toLowerCase().includes(query.toLowerCase())
  );

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center pt-16 sm:pt-24 px-4 bg-black/50 backdrop-blur-xs">
      <div
        className="fixed inset-0 -z-10"
        onClick={onClose}
      />
      <div className="w-full max-w-xl bg-white rounded-2xl shadow-2xl border border-[#E9E7E1] overflow-hidden animate-in fade-in zoom-in-95 duration-150">
        {/* Search Input Bar */}
        <div className="flex items-center gap-3 px-4 py-3.5 border-b border-[#E9E7E1]">
          <Search className="w-5 h-5 text-[#888888]" />
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search commands, navigate, or switch modes... (Esc to exit)"
            className="flex-1 bg-transparent border-0 outline-hidden text-sm text-[#171717] placeholder:text-[#999999]"
            autoFocus
          />
          <button
            onClick={onClose}
            className="p-1 rounded-md text-[#888888] hover:text-[#171717] hover:bg-[#F7F6F2]"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Action List */}
        <div className="max-h-80 overflow-y-auto p-2 space-y-1">
          {filtered.length === 0 ? (
            <div className="p-8 text-center text-xs text-[#888888]">
              No commands matching "{query}"
            </div>
          ) : (
            filtered.map((item) => (
              <button
                key={item.id}
                onClick={() => {
                  item.action();
                  onClose();
                }}
                className="w-full flex items-center justify-between p-2.5 rounded-xl hover:bg-[#F7F6F2] transition text-left group cursor-pointer"
              >
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg bg-[#F7F6F2] group-hover:bg-white flex items-center justify-center text-[#555555] group-hover:text-[#171717] border border-transparent group-hover:border-[#E9E7E1] transition">
                    <item.icon className="w-4 h-4" />
                  </div>
                  <div>
                    <div className="text-xs font-semibold text-[#171717]">
                      {item.title}
                    </div>
                    <div className="text-[10px] text-[#888888]">
                      {item.category}
                    </div>
                  </div>
                </div>
                <span className="text-[10px] font-mono text-[#AAAAAA] opacity-0 group-hover:opacity-100 transition">
                  Execute ↵
                </span>
              </button>
            ))
          )}
        </div>

        {/* Footer shortcuts */}
        <div className="px-4 py-2 bg-[#F7F6F2] border-t border-[#E9E7E1] flex items-center justify-between text-[11px] text-[#777777]">
          <span>Tip: Press <kbd className="px-1.5 py-0.5 rounded bg-white border border-[#DDD] font-mono text-[10px]">Ctrl</kbd> + <kbd className="px-1.5 py-0.5 rounded bg-white border border-[#DDD] font-mono text-[10px]">K</kbd> anywhere</span>
          <span>Reciept.io App Shell</span>
        </div>
      </div>
    </div>
  );
};
