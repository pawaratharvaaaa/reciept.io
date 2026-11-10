"use client";

import { useState, useEffect, useCallback } from "react";
import { db } from "../offline/db";

export type SyncState = "idle" | "syncing" | "synced" | "error" | "offline";

export interface SyncStatus {
  state: SyncState;
  lastSyncedAt: Date | null;
  pendingCount: number;
  errorMessage?: string;
}

let globalSyncStatus: SyncStatus = {
  state: "idle",
  lastSyncedAt: null,
  pendingCount: 0,
};

const listeners = new Set<(status: SyncStatus) => void>();

function notify() {
  listeners.forEach((fn) => fn(globalSyncStatus));
}

export async function pushAllToCloud(organizationId: string = "org-default-001"): Promise<boolean> {
  if (typeof window === "undefined" || !navigator.onLine) {
    globalSyncStatus = { ...globalSyncStatus, state: "offline" };
    notify();
    return false;
  }

  globalSyncStatus = { ...globalSyncStatus, state: "syncing" };
  notify();

  try {
    const [businessProfiles, customers, products, receipts] = await Promise.all([
      db.businessProfiles.toArray(),
      db.customers.toArray(),
      db.products.toArray(),
      db.receipts.toArray(),
    ]);

    const res = await fetch("/api/sync", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        organizationId,
        businessProfiles,
        customers,
        products,
        receipts,
      }),
    });

    if (!res.ok) {
      const err = await res.json().catch(() => ({ error: "Sync failed" }));
      throw new Error(err.error || `HTTP ${res.status}`);
    }

    const data = await res.json();
    globalSyncStatus = {
      state: "synced",
      lastSyncedAt: new Date(),
      pendingCount: 0,
    };
    notify();

    // Auto-reset from 'synced' to 'idle' after 4s
    setTimeout(() => {
      if (globalSyncStatus.state === "synced") {
        globalSyncStatus = { ...globalSyncStatus, state: "idle" };
        notify();
      }
    }, 4000);

    return true;
  } catch (err: any) {
    console.error("Cloud push failed:", err);
    globalSyncStatus = {
      state: "error",
      lastSyncedAt: globalSyncStatus.lastSyncedAt,
      pendingCount: 0,
      errorMessage: err.message || "Failed to connect to Supabase Cloud",
    };
    notify();
    return false;
  }
}

export function useCloudSync(organizationId?: string) {
  const [status, setStatus] = useState<SyncStatus>(globalSyncStatus);

  useEffect(() => {
    listeners.add(setStatus);
    return () => {
      listeners.delete(setStatus);
    };
  }, []);

  const triggerSync = useCallback(() => {
    return pushAllToCloud(organizationId);
  }, [organizationId]);

  useEffect(() => {
    const handleOnline = () => {
      pushAllToCloud(organizationId);
    };
    const handleOffline = () => {
      globalSyncStatus = { ...globalSyncStatus, state: "offline" };
      notify();
    };

    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);

    // Initial sync trigger after 2s once app mounts
    const timer = setTimeout(() => {
      pushAllToCloud(organizationId);
    }, 2000);

    return () => {
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
      clearTimeout(timer);
    };
  }, [organizationId]);

  return {
    ...status,
    triggerSync,
  };
}
