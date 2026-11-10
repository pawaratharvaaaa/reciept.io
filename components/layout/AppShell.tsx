"use client";

import React, { useState, useEffect } from "react";
import { usePathname } from "next/navigation";
import { db, seedInitialDataIfEmpty } from "@/lib/offline/db";
import { AuthProvider, useAuth } from "@/lib/auth/auth-context";
import { AuthModal } from "../auth/AuthModal";
import { FloatingNavbar } from "./FloatingNavbar";
import { BottomNav } from "./BottomNav";
import { CommandPalette } from "./CommandPalette";
import { AppPreloader } from "./AppPreloader";

interface AppShellProps {
  children: React.ReactNode;
}

const AppShellInner: React.FC<AppShellProps> = ({ children }) => {
  const pathname = usePathname();
  const [authModalOpen, setAuthModalOpen] = useState(false);
  const [authModalMode, setAuthModalMode] = useState<"signup" | "login" | "switch">("signup");
  const [commandPaletteOpen, setCommandPaletteOpen] = useState(false);
  const [showPreloader, setShowPreloader] = useState(false);

  useEffect(() => {
    seedInitialDataIfEmpty();

    try {
      const hasSeenPreloader = sessionStorage.getItem("reciept_preloader_seen") === "true";
      const params = new URLSearchParams(window.location.search);
      if (params.get("intro") === "true") {
        setShowPreloader(true);
      } else if (!hasSeenPreloader && pathname === "/") {
        setShowPreloader(true);
      }
    } catch (e) {}
  }, [pathname]);

  return (
    <div className="min-h-screen flex flex-col bg-[#F7F6F2] text-[#171717] antialiased">
      {/* 1. Floating Island Navigation Dock */}
      <FloatingNavbar
        onOpenCommandPalette={() => setCommandPaletteOpen(true)}
        onOpenAuthModal={() => {
          setAuthModalMode("switch");
          setAuthModalOpen(true);
        }}
        onOpenIntro={() => setShowPreloader(true)}
      />

      {/* 2. Main Full-Width Content Area with generous airspace below floating dock */}
      <main className="flex-1 w-full max-w-[1600px] mx-auto px-4 sm:px-6 lg:px-8 pt-24 sm:pt-28 pb-16 transition-all print:p-0 print:m-0 print:max-w-none print:w-full print:pt-0">
        {children}
      </main>

      {/* 3. Mobile Bottom Navigation Bar (Visible on phone/tablet form factors) */}
      <BottomNav
        onOpenAuthModal={() => {
          setAuthModalMode("switch");
          setAuthModalOpen(true);
        }}
        onOpenIntro={() => setShowPreloader(true)}
      />

      {/* 4. Global Spotlight Command Palette (Ctrl+K / Cmd+K) */}
      <CommandPalette
        isOpen={commandPaletteOpen}
        onClose={() => setCommandPaletteOpen(false)}
        onOpenIntro={() => setShowPreloader(true)}
      />

      {/* 5. Luxury Liquid Glass Logo Reveal Preloader */}
      {showPreloader && (
        <AppPreloader
          durationMs={2600}
          onComplete={() => setShowPreloader(false)}
        />
      )}

      {/* 6. Multi-Tenant Account & Profile Modal */}
      <AuthModal
        isOpen={authModalOpen}
        onClose={() => setAuthModalOpen(false)}
        defaultMode={authModalMode}
      />
    </div>
  );
};

export const AppShell: React.FC<AppShellProps> = (props) => {
  return (
    <React.Suspense fallback={<div className="min-h-screen bg-[#F7F6F2]" />}>
      <AuthProvider>
        <AppShellInner {...props} />
      </AuthProvider>
    </React.Suspense>
  );
};

export default AppShell;
