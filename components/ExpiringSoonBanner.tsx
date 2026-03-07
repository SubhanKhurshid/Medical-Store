"use client";

import { useAuth } from "@/app/providers/AuthProvider";
import { useInventory } from "@/app/context/InventoryContext";
import { EXPIRING_INVALIDATED_EVENT } from "@/lib/expiring-events";
import { Button } from "@/components/ui/button";
import { AlertTriangle, ChevronRight } from "lucide-react";
import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import { toast } from "sonner";

const TOAST_INTERVAL_MS = 3 * 60 * 1000; // 3 minutes between toasts
const EXPIRING_TOAST_KEY = "expiring-soon-toast-last-shown";

export function ExpiringSoonBanner() {
  const { user } = useAuth();
  const { getExpiringItems } = useInventory();
  const [expiringCount, setExpiringCount] = useState(0);
  const [isLoading, setIsLoading] = useState(true);

  const fetchExpiring = useCallback(async () => {
    if (user?.role !== "pharmacist") return;
    try {
      const items = await getExpiringItems();
      setExpiringCount(items.length);
      return items.length;
    } catch {
      setExpiringCount(0);
      return 0;
    } finally {
      setIsLoading(false);
    }
  }, [user?.role, getExpiringItems]);

  useEffect(() => {
    if (user?.role !== "pharmacist") return;
    fetchExpiring();
  }, [user?.role, fetchExpiring]);

  useEffect(() => {
    if (user?.role !== "pharmacist") return;
    const onInvalidated = () => fetchExpiring();
    window.addEventListener(EXPIRING_INVALIDATED_EVENT, onInvalidated);
    return () => window.removeEventListener(EXPIRING_INVALIDATED_EVENT, onInvalidated);
  }, [user?.role, fetchExpiring]);

  useEffect(() => {
    if (user?.role !== "pharmacist") return;
    const onVisibilityChange = () => {
      if (document.visibilityState === "visible") fetchExpiring();
    };
    document.addEventListener("visibilitychange", onVisibilityChange);
    return () => document.removeEventListener("visibilitychange", onVisibilityChange);
  }, [user?.role, fetchExpiring]);

  useEffect(() => {
    if (user?.role !== "pharmacist") return;
    const interval = setInterval(fetchExpiring, 2 * 60 * 1000);
    return () => clearInterval(interval);
  }, [user?.role, fetchExpiring]);

  useEffect(() => {
    if (user?.role !== "pharmacist" || expiringCount === 0 || isLoading) return;

    const lastShown = sessionStorage.getItem(EXPIRING_TOAST_KEY);
    const now = Date.now();
    const shouldShowToast =
      !lastShown || now - parseInt(lastShown, 10) > TOAST_INTERVAL_MS;

    if (shouldShowToast) {
      sessionStorage.setItem(EXPIRING_TOAST_KEY, String(now));
      toast.warning(
        `⚠️ ${expiringCount} item(s) expiring within 30 days — Reorder or discard to avoid waste.`,
        {
          duration: 15000,
          action: {
            label: "View Dashboard",
            onClick: () => window.open("/pharmacist", "_self"),
          },
        }
      );
    }
  }, [expiringCount, user?.role, isLoading]);

  if (user?.role !== "pharmacist" || isLoading || expiringCount === 0) {
    return null;
  }

  return (
    <div
      role="alert"
      className="mb-4 w-full min-w-0 max-w-full rounded-xl border border-orange-200/80 bg-gradient-to-r from-orange-50 to-amber-50/80 px-4 py-3 shadow-sm"
    >
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between sm:gap-4">
        <div className="flex min-w-0 flex-1 items-center gap-3">
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-orange-100">
            <AlertTriangle className="h-4 w-4 text-orange-700" />
          </div>
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-semibold text-orange-900">
              Expiring soon — {expiringCount} item{expiringCount !== 1 ? "s" : ""} within 30 days
            </p>
            <p className="mt-0.5 truncate text-xs text-orange-800/90">
              Reorder to restock or discard to write off.
            </p>
          </div>
        </div>
        <div className="flex shrink-0 flex-wrap items-center gap-2">
          <Button asChild size="sm" className="h-8 rounded-lg bg-orange-600 text-white hover:bg-orange-700">
            <Link href="/pharmacist#expiring-soon" className="inline-flex items-center gap-1">
              View & act
              <ChevronRight className="h-3.5 w-3.5" />
            </Link>
          </Button>
          <Button asChild size="sm" variant="outline" className="h-8 rounded-lg border-orange-300 text-orange-800 hover:bg-orange-100">
            <Link href="/pharmacist/purchase-orders/create">Create order</Link>
          </Button>
        </div>
      </div>
    </div>
  );
}
