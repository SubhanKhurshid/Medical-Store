"use client";

import { useAuth } from "@/app/providers/AuthProvider";
import { useInventory } from "@/app/context/InventoryContext";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Package, ArrowRight } from "lucide-react";
import Link from "next/link";
import { useEffect, useState } from "react";
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

  const fetchLowStock = async () => {
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
  };

  useEffect(() => {
    if (user?.role !== "pharmacist") return;
    fetchLowStock();
  }, [user?.role]);

  useEffect(() => {
    if (user?.role !== "pharmacist") return;
    const onVisibilityChange = () => {
      if (document.visibilityState === "visible") fetchLowStock();
    };
    document.addEventListener("visibilitychange", onVisibilityChange);
    return () => document.removeEventListener("visibilitychange", onVisibilityChange);
  }, [user?.role]);

  useEffect(() => {
    if (user?.role !== "pharmacist") return;
    const interval = setInterval(fetchLowStock, 2 * 60 * 1000);
    return () => clearInterval(interval);
  }, [user?.role]);

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
    <Alert
      variant="destructive"
      className="sticky top-0 z-40 mb-4 border-2 border-red-500 bg-red-100 text-red-900 shadow-[0_0_0_3px_rgba(239,68,68,0.3)]"
    >
      <div className="relative shrink-0">
        <Package className="h-4 w-4 text-red-600" />
        <span className="absolute -top-0.5 -right-0.5 h-2 w-2 rounded-full bg-red-600 animate-ping" />
      </div>
      <AlertTitle className="text-red-800 font-semibold flex items-center gap-2">
        Low Stock Alert — {lowStockCount} item{lowStockCount !== 1 ? "s" : ""} need
        restocking
        <span className="inline-flex h-2 w-2 rounded-full bg-red-600 animate-pulse" aria-hidden />
      </AlertTitle>
      <AlertDescription className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mt-2">
        <span>
          These items are below the minimum stock level. Restock to avoid
          running out.
        </span>
        <div className="flex gap-2 shrink-0">
          <Button asChild size="sm" variant="destructive">
            <Link href="/pharmacist/purchase-orders/create">
              Create Purchase Order
              <ArrowRight className="ml-1 h-3 w-3" />
            </Link>
          </Button>
          <Button asChild size="sm" variant="outline" className="border-red-300 text-red-800 hover:bg-red-100">
            <Link href="/pharmacist/inventory-view">View Inventory</Link>
          </Button>
        </div>
      </AlertDescription>
    </Alert>
  );
}
