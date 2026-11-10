"use client";

import React, { useState, useEffect } from "react";
import { GlassReveal21st } from "@/components/ui/liquid-glass-logo-reveal";
import { ArrowRight, Sparkles, VolumeX, ShieldCheck, Zap } from "lucide-react";

interface AppIntroSplashProps {
  onComplete: () => void;
  autoEnterSeconds?: number;
}

export const AppIntroSplash: React.FC<AppIntroSplashProps> = ({
  onComplete,
  autoEnterSeconds = 4.5,
}) => {
  const [secondsLeft, setSecondsLeft] = useState(autoEnterSeconds);
  const [isFadingOut, setIsFadingOut] = useState(false);
  const [dontShowAgain, setDontShowAgain] = useState(false);

  const handleEnter = () => {
    if (dontShowAgain) {
      try {
        localStorage.setItem("reciept_intro_disabled", "true");
      } catch (e) {}
    }
    try {
      sessionStorage.setItem("reciept_intro_seen", "true");
    } catch (e) {}
    setIsFadingOut(true);
    setTimeout(() => {
      onComplete();
    }, 600);
  };

  useEffect(() => {
    // Keyboard shortcuts: Enter or Escape to enter immediately
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Enter" || e.key === "Escape" || e.key === " ") {
        handleEnter();
      }
    };
    window.addEventListener("keydown", handleKeyDown);

    // Auto-countdown timer
    const interval = setInterval(() => {
      setSecondsLeft((prev) => {
        if (prev <= 1) {
          clearInterval(interval);
          handleEnter();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => {
      window.removeEventListener("keydown", handleKeyDown);
      clearInterval(interval);
    };
  }, [dontShowAgain]);

  return (
    <div
      className={`fixed inset-0 z-[9999] flex flex-col items-center justify-between bg-[#090d16] text-white select-none transition-all duration-700 ease-out print:hidden ${
        isFadingOut ? "opacity-0 pointer-events-none scale-105" : "opacity-100 scale-100"
      }`}
    >
      {/* Ambient background glow */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-[20%] left-1/2 -translate-x-1/2 w-[600px] h-[600px] bg-blue-600/15 rounded-full blur-[140px]" />
        <div className="absolute -bottom-[20%] left-1/3 w-[500px] h-[500px] bg-emerald-600/10 rounded-full blur-[130px]" />
      </div>

      {/* Top Bar with Brand Badge & Skip */}
      <header className="w-full max-w-6xl px-6 py-6 flex items-center justify-between relative z-10">
        <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/5 border border-white/10 backdrop-blur-md">
          <Sparkles className="w-4 h-4 text-blue-400" />
          <span className="text-xs font-semibold tracking-wider uppercase text-slate-300">
            Reciept.io Experience
          </span>
        </div>

        <button
          onClick={handleEnter}
          className="text-xs font-medium text-slate-400 hover:text-white px-3 py-1.5 rounded-lg bg-white/5 hover:bg-white/10 border border-white/10 backdrop-blur-md transition-all"
        >
          Skip Intro (Esc)
        </button>
      </header>

      {/* Center Hero: WebGL2 Liquid Glass Reveal with Bat Insignia */}
      <main className="relative z-10 flex-1 flex flex-col items-center justify-center w-full px-4 max-w-4xl -mt-6">
        <div className="w-full flex items-center justify-center">
          <div className="w-[320px] sm:w-[380px] md:w-[440px] aspect-square rounded-3xl overflow-hidden relative shadow-2xl shadow-blue-950/50">
            <GlassReveal21st
              logo="/logo.jpg"
              className="w-full h-full"
              speed={1.05}
              loop={false}
            />
          </div>
        </div>

        {/* Title & Tagline */}
        <div className="text-center mt-6 space-y-2 max-w-lg">
          <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight bg-gradient-to-r from-white via-slate-100 to-slate-400 bg-clip-text text-transparent">
            RECIEPT.IO
          </h1>
          <p className="text-sm sm:text-base text-slate-400 font-normal">
            Every receipt, beautifully organized in one place.
          </p>

          <div className="pt-2 flex items-center justify-center gap-4 text-xs text-slate-400">
            <span className="inline-flex items-center gap-1">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
              Tough Firewall Secured
            </span>
            <span>•</span>
            <span className="inline-flex items-center gap-1">
              <Zap className="w-3.5 h-3.5 text-amber-400" />
              Pocket Thermal Ready
            </span>
          </div>
        </div>
      </main>

      {/* Bottom Bar: Action & Preferences */}
      <footer className="w-full max-w-xl px-6 pb-8 relative z-10 flex flex-col items-center gap-4">
        {/* Main Enter Action Button */}
        <button
          onClick={handleEnter}
          className="group relative w-full sm:w-auto px-8 py-3.5 rounded-2xl bg-gradient-to-r from-blue-600 via-indigo-600 to-blue-500 hover:from-blue-500 hover:to-indigo-500 text-white font-semibold text-sm shadow-xl shadow-blue-600/25 border border-blue-400/30 flex items-center justify-center gap-3 transition-all transform hover:-translate-y-0.5 active:translate-y-0 cursor-pointer"
        >
          <span>Enter Workspace</span>
          <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-1" />
          <span className="text-xs px-2 py-0.5 rounded-full bg-black/20 text-blue-200 border border-white/10 font-mono">
            {secondsLeft}s
          </span>
        </button>

        {/* Options */}
        <div className="flex items-center gap-6 text-xs text-slate-400">
          <label className="flex items-center gap-2 cursor-pointer hover:text-slate-300">
            <input
              type="checkbox"
              checked={dontShowAgain}
              onChange={(e) => setDontShowAgain(e.target.checked)}
              className="rounded border-slate-700 bg-slate-800 text-blue-500 focus:ring-0 focus:ring-offset-0"
            />
            <span>Don't show automatically next time</span>
          </label>
        </div>
      </footer>
    </div>
  );
};

export default AppIntroSplash;
