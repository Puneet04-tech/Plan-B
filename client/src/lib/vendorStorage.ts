"use strict";

import { useEffect, useState, useCallback } from "react";
import type { VendorChecklistItem, VendorPlan } from "@shared/types";

const STORAGE_KEY = "plan-b-vendor-status";

interface StoredStatus {
  [vendorId: string]: {
    status: VendorChecklistItem["status"];
    contacted: boolean;
    notes: string;
  };
}

/** localStorage wrapper that survives unavailable/empty storage. */
export function loadVendorStatus(): StoredStatus {
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    return raw ? (JSON.parse(raw) as StoredStatus) : {};
  } catch {
    return {};
  }
}

export function saveVendorStatus(status: StoredStatus): void {
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(status));
  } catch {
    // storage unavailable — state stays in memory for this session
  }
}

export function useVendorChecklist(vendors: VendorPlan | undefined) {
  const [items, setItems] = useState<VendorChecklistItem[]>([]);
  const [storageAvailable, setStorageAvailable] = useState(true);

  useEffect(() => {
    if (!vendors) return;
    const stored = loadVendorStatus();
    try {
      window.localStorage.setItem("__plan_b_probe__", "1");
      window.localStorage.removeItem("__plan_b_probe__");
    } catch {
      setStorageAvailable(false);
    }
    setItems(
      vendors.items.map((v) => ({
        ...v,
        status: stored[v.id]?.status ?? "to-contact",
        contacted: stored[v.id]?.contacted ?? false,
        notes: stored[v.id]?.notes ?? "",
      })),
    );
  }, [vendors]);

  const update = useCallback(
    (id: string, patch: Partial<VendorChecklistItem>) => {
      setItems((prev) => {
        const next = prev.map((i) => (i.id === id ? { ...i, ...patch } : i));
        const stored: StoredStatus = {};
        for (const i of next)
          stored[i.id] = {
            status: i.status,
            contacted: i.contacted,
            notes: i.notes,
          };
        saveVendorStatus(stored);
        return next;
      });
    },
    [],
  );

  return { items, update, storageAvailable };
}
