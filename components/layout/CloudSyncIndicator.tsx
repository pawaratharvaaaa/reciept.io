"use client";

import React, { useState } from "react";
import { useCloudSync } from "@/lib/sync/sync-coordinator";
import { Cloud, CloudCheck, CloudOff, RefreshCw, AlertCircle, Database, Check } from "lucide-react";

export const CloudSyncIndicator: React.FC = () => {
  const { state, lastSyncedAt, triggerSync, errorMessage } = useCloudSync();
  const [isOpen, setIsOpen] = useState(false);
  const [isManualSyncing, setIsManualSyncing] = useState(false);

  const handleManualSync = async (e: React.MouseEvent) => {
    e.stopPropagation();
    setIsManualSyncing(true);
    await triggerSync();
    setIsManualSyncing(false);
  };

  const getStatusDisplay = () => {
    if (state === "syncing" || isManualSyncing) {
      return {
        icon: <RefreshCw className="w-3.5 h-3.5 text-blue-500 animate-spin" />,
        text: "Syncing...",
        colorClass: "bg-blue-50 text-blue-700 border-blue-200",
        dotClass: "bg-blue-500",
      };
    }
    if (state === "offline") {
      return {
        icon: <CloudOff className="w-3.5 h-3.5 text-amber-600" />,
        text: "Offline Cache",
        colorClass: "bg-amber-50 text-amber-800 border-amber-200",
        dotClass: "bg-amber-500",
      };
    }
    if (state === "error") {
      return {
        icon: <AlertCircle className="w-3.5 h-3.5 text-rose-600" />,
        text: "Sync Alert",
        colorClass: "bg-rose-50 text-rose-800 border-rose-200",
        dotClass: "bg-rose-500",
      };
    }
    // Synced / Idle
    return {
      icon: <Cloud className="w-3.5 h-3.5 text-emerald-600" />,
      text: "Supabase Synced",
      colorClass: "bg-emerald-50 text-emerald-800 border-emerald-200 hover:bg-emerald-100",
      dotClass: "bg-emerald-500",
    };
  };

  const current = getStatusDisplay();

  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg border text-xs font-medium transition cursor-pointer select-none ${current.colorClass}`}
        title="Supabase Cloud Synchronization Status"
      >
        <span className="relative flex h-2 w-2">
          {state !== "offline" && (
            <span
              className={`animate-ping absolute inline-flex h-full w-full rounded-full opacity-75 ${current.dotClass}`}
            />
          )}
          <span className={`relative inline-flex rounded-full h-2 w-2 ${current.dotClass}`} />
        </span>
        {current.icon}
        <span className="hidden sm:inline font-mono text-[11px] font-semibold">{current.text}</span>
      </button>

      {isOpen && (
        <>
          <div
            className="fixed inset-0 z-40"
            onClick={() => setIsOpen(false)}
          />
          <div className="absolute right-0 top-full mt-2 w-72 bg-white rounded-xl shadow-2xl border border-[#E9E7E1] p-3.5 z-50 text-xs space-y-3">
            <div className="flex items-center justify-between pb-2 border-b border-[#F2F0EA]">
              <div className="flex items-center gap-2">
                <Database className="w-4 h-4 text-emerald-600" />
                <span className="font-bold text-[#171717]">Supabase Cloud Sync</span>
              </div>
              <span className="px-1.5 py-0.5 rounded text-[10px] font-mono bg-emerald-100 text-emerald-800 font-bold">
                Live
              </span>
            </div>

            <div className="space-y-1.5 text-[#555555]">
              <div className="flex justify-between text-[11px]">
                <span>Project ID:</span>
                <span className="font-mono font-medium text-[#171717]">bsspsgukpzgsgwjwnidv</span>
              </div>
              <div className="flex justify-between text-[11px]">
                <span>Cloud Engine:</span>
                <span className="font-medium text-[#171717]">PostgreSQL 17 (Supavisor)</span>
              </div>
              <div className="flex justify-between text-[11px]">
                <span>Last Cloud Backup:</span>
                <span className="font-medium text-[#171717]">
                  {lastSyncedAt ? lastSyncedAt.toLocaleTimeString() : "Just now"}
                </span>
              </div>
            </div>

            {errorMessage && (
              <div className="p-2 rounded-lg bg-rose-50 text-rose-800 text-[11px]">
                {errorMessage}
              </div>
            )}

            <button
              onClick={handleManualSync}
              disabled={isManualSyncing}
              className="w-full flex items-center justify-center gap-2 py-2 rounded-lg bg-[#171717] hover:bg-[#2e2e2e] text-white font-medium transition cursor-pointer disabled:opacity-50"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isManualSyncing ? "animate-spin" : ""}`} />
              <span>{isManualSyncing ? "Pushing Changes..." : "Sync to Supabase Now"}</span>
            </button>

            <p className="text-[10px] text-[#888888] leading-tight text-center">
              Offline-first indexed local records automatically mirror to your remote Supabase database.
            </p>
          </div>
        </>
      )}
    </div>
  );
};
