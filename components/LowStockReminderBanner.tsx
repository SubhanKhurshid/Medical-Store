"use client";

import { useAuth } from "@/app/providers/AuthProvider";
import { useInventory } from "@/app/context/InventoryContext";
import { LOW_STOCK_INVALIDATED_EVENT } from "@/lib/low-stock-events";
import { Button } from "@/components/ui/button";
import { Package, ArrowRight, ChevronRight } from "lucide-react";
import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import { toast } from "sonner";

const TOAST_INTERVAL_MS = 3 * 60 * 1000; // 3 minutes between toasts
const LOW_STOCK_TOAST_KEY = "low-stock-toast-last-shown";

export function LowStockReminderBanner() {
  const { user } = useAuth();
  const { getLowStockItems } = useInventory();
  const pathname = usePathname();
  const [lowStockCount, setLowStockCount] = useState(0);
  const [isLoading, setIsLoading] = useState(true);

  const fetchLowStock = useCallback(async () => {
    if (user?.role !== "pharmacist") return;
    try {
      const items = await getLowStockItems();
      setLowStockCount(items.length);
      return items.length;
    } catch {
      setLowStockCount(0);
      return 0;
    } finally {
      setIsLoading(false);
    }
  }, [user?.role, getLowStockItems]);

  useEffect(() => {
    if (user?.role !== "pharmacist") return;
    fetchLowStock();
  }, [user?.role, fetchLowStock]);

  useEffect(() => {
    if (user?.role !== "pharmacist") return;
    const onInvalidated = () => fetchLowStock();
    window.addEventListener(LOW_STOCK_INVALIDATED_EVENT, onInvalidated);
    return () => window.removeEventListener(LOW_STOCK_INVALIDATED_EVENT, onInvalidated);
  }, [user?.role, fetchLowStock]);

  useEffect(() => {
    if (user?.role !== "pharmacist") return;
    const onVisibilityChange = () => {
      if (document.visibilityState === "visible") fetchLowStock();
    };
    document.addEventListener("visibilitychange", onVisibilityChange);
    return () => document.removeEventListener("visibilitychange", onVisibilityChange);
  }, [user?.role, fetchLowStock]);

  useEffect(() => {
    if (user?.role !== "pharmacist") return;
    const interval = setInterval(fetchLowStock, 2 * 60 * 1000);
    return () => clearInterval(interval);
  }, [user?.role, fetchLowStock]);

  useEffect(() => {
    if (user?.role !== "pharmacist" || lowStockCount === 0 || isLoading) return;

    const lastShown = sessionStorage.getItem(LOW_STOCK_TOAST_KEY);
    const now = Date.now();
    const shouldShowToast =
      !lastShown || now - parseInt(lastShown, 10) > TOAST_INTERVAL_MS;

    if (shouldShowToast) {
      sessionStorage.setItem(LOW_STOCK_TOAST_KEY, String(now));
      toast.error(
        `🚨 ${lowStockCount} item(s) LOW ON STOCK — Restock now to avoid running out!`,
        {
          duration: 15000,
          action: {
            label: "Restock Now",
            onClick: () => window.open("/pharmacist/purchase-orders/create", "_self"),
          },
        }
      );
    }
  }, [lowStockCount, user?.role, isLoading, pathname]);

  if (user?.role !== "pharmacist" || isLoading || lowStockCount === 0) {
    return null;
  }

  return (
    <div
      role="alert"
      className="mb-4 w-full min-w-0 max-w-full rounded-xl border border-amber-200/80 bg-gradient-to-r from-amber-50 to-orange-50/80 px-4 py-3 shadow-sm"
    >
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between sm:gap-4">
        <div className="flex min-w-0 flex-1 items-center gap-3">
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-amber-100">
            <Package className="h-4 w-4 text-amber-700" />
          </div>
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-semibold text-amber-900">
              Low stock — {lowStockCount} item{lowStockCount !== 1 ? "s" : ""} need restocking
            </p>
            <p className="mt-0.5 truncate text-xs text-amber-800/90">
              Below minimum level. Restock to avoid running out.
            </p>
          </div>
        </div>
        <div className="flex shrink-0 flex-wrap items-center gap-2">
          <Button asChild size="sm" className="h-8 rounded-lg bg-amber-600 text-white hover:bg-amber-700">
            <Link href="/pharmacist/purchase-orders/create" className="inline-flex items-center gap-1">
              Create order
              <ChevronRight className="h-3.5 w-3.5" />
            </Link>
          </Button>
          <Button asChild size="sm" variant="outline" className="h-8 rounded-lg border-amber-300 text-amber-800 hover:bg-amber-100">
            <Link href="/pharmacist/inventory-view">View inventory</Link>
          </Button>
        </div>
      </div>
    </div>
  );
}
