"use client";

import React from "react";
import Link from "next/link";
import GlassReveal21stDemo from "@/components/ui/demo";
import { ArrowLeft, RefreshCw, LayoutDashboard } from "lucide-react";

export default function DemoPage() {
  const [key, setKey] = React.useState(0);

  return (
    <div className="relative min-h-screen bg-[#090d16] text-white flex flex-col">
      {/* Floating Header Controls */}
      <div className="absolute top-4 left-4 right-4 z-50 flex items-center justify-between pointer-events-none">
        <Link
          href="/"
          className="pointer-events-auto inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-white/10 hover:bg-white/20 text-white backdrop-blur-md border border-white/10 text-sm font-medium transition-all shadow-lg"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Reciept.io
        </Link>

        <div className="flex items-center gap-2 pointer-events-auto">
          <button
            onClick={() => setKey((k) => k + 1)}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-blue-600/80 hover:bg-blue-600 text-white backdrop-blur-md border border-blue-400/30 text-sm font-medium transition-all shadow-lg shadow-blue-500/20"
          >
            <RefreshCw className="w-4 h-4" />
            Replay Reveal
          </button>
          <Link
            href="/"
            className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-emerald-600/80 hover:bg-emerald-600 text-white backdrop-blur-md border border-emerald-400/30 text-sm font-medium transition-all shadow-lg shadow-emerald-500/20"
          >
            <LayoutDashboard className="w-4 h-4" />
            Enter Dashboard
          </Link>
        </div>
      </div>

      {/* Main Glass Reveal Container */}
      <div className="flex-1 w-full h-full min-h-screen flex items-center justify-center">
        <GlassReveal21stDemo key={key} />
      </div>

      {/* Footer Info */}
      <div className="absolute bottom-6 left-0 right-0 text-center pointer-events-none z-50">
        <p className="text-xs text-white/50 tracking-wider uppercase font-semibold">
          Reciept.io  Liquid Glass Shader Reveal  Click anywhere on glass to replay
        </p>
      </div>
    </div>
  );
}
