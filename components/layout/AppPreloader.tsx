"use client";

import React, { useState, useEffect } from "react";
import { GlassReveal21st } from "@/components/ui/liquid-glass-logo-reveal";

interface AppPreloaderProps {
  onComplete?: () => void;
  durationMs?: number;
}

export const AppPreloader: React.FC<AppPreloaderProps> = ({
  onComplete,
  durationMs = 2600,
}) => {
  const [phase, setPhase] = useState<"loading" | "fading" | "done">("loading");
  const [progress, setProgress] = useState(0);
  const [statusText, setStatusText] = useState("Initializing workspace...");

  useEffect(() => {
    // Smooth progress bar increment
    const start = Date.now();
    const interval = setInterval(() => {
      const elapsed = Date.now() - start;
      const pct = Math.min(100, Math.round((elapsed / durationMs) * 100));
      setProgress(pct);

      if (pct > 30 && pct < 70) {
        setStatusText("Synchronizing Supabase ledger...");
      } else if (pct >= 70 && pct < 95) {
        setStatusText("Loading business modules...");
      } else if (pct >= 95) {
        setStatusText("Ready");
      }

      if (elapsed >= durationMs) {
        clearInterval(interval);
        dismiss();
      }
    }, 30);

    const dismiss = () => {
      setPhase("fading");
      setTimeout(() => {
        setPhase("done");
        try {
          sessionStorage.setItem("reciept_preloader_seen", "true");
        } catch (e) {}
        onComplete?.();
      }, 700);
    };

    // User can click or press any key to skip immediately
    const handleQuickDismiss = () => {
      clearInterval(interval);
      dismiss();
    };

    window.addEventListener("keydown", handleQuickDismiss, { once: true });
    window.addEventListener("pointerdown", handleQuickDismiss, { once: true });

    return () => {
      clearInterval(interval);
      window.removeEventListener("keydown", handleQuickDismiss);
      window.removeEventListener("pointerdown", handleQuickDismiss);
    };
  }, [durationMs, onComplete]);

  if (phase === "done") return null;

  return (
    <div
      className={`fixed inset-0 z-[99999] flex flex-col items-center justify-center bg-[#090d16] text-white select-none transition-all duration-700 ease-out print:hidden cursor-pointer ${
        phase === "fading"
          ? "opacity-0 pointer-events-none scale-105 filter blur-xs"
          : "opacity-100 scale-100"
      }`}
      title="Click anywhere or press any key to skip preloader"
    >
      {/* Ambient background glow */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-blue-600/10 rounded-full blur-[140px]" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[300px] h-[300px] bg-indigo-500/10 rounded-full blur-[90px]" />
      </div>

      {/* Center: Liquid Glass Logo Reveal Engine */}
      <div className="relative z-10 flex flex-col items-center justify-center">
        <div className="w-[280px] sm:w-[340px] aspect-square rounded-3xl overflow-hidden relative shadow-2xl shadow-blue-950/60">
          <GlassReveal21st
            logo="/logo.jpg"
            className="w-full h-full"
            speed={1.15}
            loop={false}
          />
        </div>

        {/* Minimal Luxury Preloader Elements */}
        <div className="mt-8 flex flex-col items-center space-y-3">
          {/* Brand Name */}
          <span className="font-mono text-xs sm:text-sm font-bold tracking-[0.25em] uppercase text-white/90">
            RECIEPT.IO
          </span>

          {/* Luxury Progress Bar */}
          <div className="w-44 h-1 bg-white/10 rounded-full overflow-hidden relative">
            <div
              className="h-full bg-gradient-to-r from-blue-500 via-indigo-400 to-emerald-400 rounded-full transition-all duration-75 ease-out shadow-sm shadow-blue-400/50"
              style={{ width: `${progress}%` }}
            />
          </div>

          {/* Dynamic Status Text */}
          <p className="text-[11px] font-mono text-white/50 tracking-wider transition-all duration-200">
            {statusText}
          </p>
        </div>
      </div>

      {/* Subtle Hint */}
      <div className="absolute bottom-6 text-[10px] font-mono text-white/20 tracking-widest uppercase">
        Click anywhere to enter
      </div>
    </div>
  );
};

export default AppPreloader;
