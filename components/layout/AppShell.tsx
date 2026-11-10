"use client";

import React, { useState, useEffect } from "react";
import { usePathname } from "next/navigation";
import { db, seedInitialDataIfEmpty } from "@/lib/offline/db";
import { AuthProvider, useAuth } from "@/lib/auth/auth-context";
import { ThemeProvider } from "@/lib/theme/theme-context";
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
  const { user, isLoading } = useAuth();
  const [authModalOpen, setAuthModalOpen] = useState(false);
  const [authModalMode, setAuthModalMode] = useState<"signup" | "login" | "switch">("signup");
  const [commandPaletteOpen, setCommandPaletteOpen] = useState(false);
  const [showPreloader, setShowPreloader] = useState(false);

  useEffect(() => {
    seedInitialDataIfEmpty();

    try {
      const hasSeenPreloader = sessionStorage.getItem("reciept_preloader_seen") === "true";
      if (!hasSeenPreloader) {
        setShowPreloader(true);
      }
    } catch (e) {}
  }, []);

  const isAuthRequired = !isLoading && !user;

  return (
    <div className="min-h-screen flex flex-col bg-[#F7F6F2] dark:bg-[#111111] text-[#171717] dark:text-[#F5F5F5] antialiased w-full max-w-full overflow-x-hidden transition-colors duration-200">
      {/* 1. Floating Island Navigation Dock */}
      <FloatingNavbar
        onOpenCommandPalette={() => setCommandPaletteOpen(true)}
        onOpenAuthModal={() => {
          setAuthModalMode("switch");
          setAuthModalOpen(true);
        }}
      />

      {/* 2. Main Full-Width Content Area */}
      <main className="flex-1 w-full max-w-[1600px] min-w-0 mx-auto px-3 sm:px-6 lg:px-8 pt-16 sm:pt-24 pb-24 sm:pb-16 transition-all print:p-0 print:m-0 print:max-w-none print:w-full print:pt-0">
        {children}
      </main>

      {/* 3. Mobile Bottom Navigation Bar */}
      <BottomNav
        onOpenAuthModal={() => {
          setAuthModalMode("switch");
          setAuthModalOpen(true);
        }}
      />

      {/* 4. Global Spotlight Command Palette (Ctrl+K / Cmd+K) */}
      <CommandPalette
        isOpen={commandPaletteOpen}
        onClose={() => setCommandPaletteOpen(false)}
      />

      {/* 5. Luxury Liquid Glass Logo Reveal Preloader - Full Screen Black */}
      {showPreloader && (
        <AppPreloader
          durationMs={2400}
          onComplete={() => setShowPreloader(false)}
        />
      )}

      {/* 6. Multi-Tenant Account & Profile Modal / Required Auth Gate */}
      <AuthModal
        isOpen={authModalOpen || isAuthRequired}
        onClose={() => setAuthModalOpen(false)}
        defaultMode={user ? authModalMode : "signup"}
        isDismissible={!isAuthRequired}
      />
    </div>
  );
};

export const AppShell: React.FC<AppShellProps> = (props) => {
  return (
    <React.Suspense fallback={<div className="min-h-screen bg-[#F7F6F2] dark:bg-[#111111]" />}>
      <ThemeProvider>
        <AuthProvider>
          <AppShellInner {...props} />
        </AuthProvider>
      </ThemeProvider>
    </React.Suspense>
  );
};

export default AppShell;
