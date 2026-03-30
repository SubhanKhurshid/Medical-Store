"use client";
import { useAuth } from "@/app/providers/AuthProvider";
import React, { useCallback, useEffect, useMemo, useState } from "react";
import { motion } from "framer-motion";
import Unauthorized from "@/app/(root)/unauthorized/page";
import { Card, CardContent } from "@/components/ui/card";
import { DataTable } from "@/components/shared/DataTable";
import { expiringTableColumns } from "@/components/shared/columns";
import { useInventory } from "@/app/context/InventoryContext";
import { InventoryItem } from "@/app/context/InventoryContext";
import PharmacyStats from "./pharmacy-stats";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { MoreHorizontal, ShoppingCart, Trash2, EyeOff } from "lucide-react";
import Link from "next/link";
import axios from "axios";
import { toast } from "sonner";
import { dispatchExpiringInvalidated } from "@/lib/expiring-events";
import { EXPIRING_INVALIDATED_EVENT } from "@/lib/expiring-events";
import type { ColumnDef } from "@tanstack/react-table";

function getMonthRange(monthOffset: number) {
  const d = new Date();
  d.setMonth(d.getMonth() + monthOffset);
  const start = new Date(d.getFullYear(), d.getMonth(), 1);
  const end = new Date(d.getFullYear(), d.getMonth() + 1, 0, 23, 59, 59, 999);
  return { start, end };
}

const PharmacistPage = () => {
  const {
    state: { items },
    getLowStockItems,
    getExpiringItems,
  } = useInventory();

  const [lowStockItems, setLowStockItems] = useState<InventoryItem[]>([]);
  const [expiringItems, setExpiringItems] = useState<InventoryItem[]>([]);
  const [lowStockCount, setLowStockCount] = useState(0);
  const [expiringCount, setExpiringCount] = useState(0);
  const [earnedThisMonth, setEarnedThisMonth] = useState(0);
  const [earnedLastMonth, setEarnedLastMonth] = useState(0);
  const [itemToDiscard, setItemToDiscard] = useState<InventoryItem | null>(null);
  const [itemToRemoveFromList, setItemToRemoveFromList] = useState<InventoryItem | null>(null);
  const [discarding, setDiscarding] = useState(false);
  const [removingFromList, setRemovingFromList] = useState(false);

  const { user } = useAuth();
  const { refetchInventory } = useInventory();

  const fadeInUp = {
    initial: { opacity: 0, y: 20 },
    animate: { opacity: 1, y: 0 },
    transition: { duration: 0.6 },
  };

  const fetchData = useCallback(async () => {
    const lowStock = await getLowStockItems();
    const expiring = await getExpiringItems();
    setLowStockItems(lowStock);
    setExpiringItems(expiring);
    setLowStockCount(lowStock.length);
    setExpiringCount(expiring.length);
  }, [getLowStockItems, getExpiringItems]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // Inventory stats card uses `items.length`, so load inventory only for the dashboard route.
  useEffect(() => {
    void refetchInventory();
  }, [refetchInventory]);

  useEffect(() => {
    const onInvalidated = () => fetchData();
    window.addEventListener(EXPIRING_INVALIDATED_EVENT, onInvalidated);
    return () => window.removeEventListener(EXPIRING_INVALIDATED_EVENT, onInvalidated);
  }, [fetchData]);

  const handleDiscard = useCallback(async () => {
    if (!itemToDiscard || !user?.access_token) return;
    try {
      setDiscarding(true);
      await axios.patch(
        `${process.env.NEXT_PUBLIC_API_BASE_URL}/pharmacist/${itemToDiscard.id}/discard`,
        { quantity: 0 },
        { headers: { Authorization: `Bearer ${user.access_token}` } }
      );
      toast.success("Item discarded", {
        description: `${itemToDiscard.name} quantity has been written off to 0.`,
      });
      setItemToDiscard(null);
      await refetchInventory();
      await fetchData();
      dispatchExpiringInvalidated();
    } catch (e) {
      toast.error("Failed to discard item");
      if (axios.isAxiosError(e)) {
        console.error(e.response?.data?.message ?? e.message);
      }
    } finally {
      setDiscarding(false);
    }
  }, [itemToDiscard, user?.access_token, refetchInventory, fetchData]);

  const handleRemoveFromList = useCallback(async () => {
    if (!itemToRemoveFromList || !user?.access_token) return;
    try {
      setRemovingFromList(true);
      await axios.patch(
        `${process.env.NEXT_PUBLIC_API_BASE_URL}/pharmacist/expiry-exclude/${itemToRemoveFromList.id}`,
        { exclude: true },
        { headers: { Authorization: `Bearer ${user.access_token}` } }
      );
      toast.success("Removed from list", {
        description: `${itemToRemoveFromList.name} will no longer appear in Expiring Soon.`,
      });
      setItemToRemoveFromList(null);
      await fetchData();
      dispatchExpiringInvalidated();
    } catch (e) {
      toast.error("Failed to remove from list");
      if (axios.isAxiosError(e)) {
        console.error(e.response?.data?.message ?? e.message);
      }
    } finally {
      setRemovingFromList(false);
    }
  }, [itemToRemoveFromList, user?.access_token, fetchData]);

  const dashboardExpiringColumns: ColumnDef<InventoryItem>[] = useMemo(() => {
    const base = expiringTableColumns.filter((col) => !("id" in col && col.id === "actions"));
    return [
      ...base,
      {
        id: "actions",
        header: "Actions",
        enableSorting: false,
        cell: ({ row }) => {
          const item = row.original;
          return (
            <div onClick={(e) => e.stopPropagation()}>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" className="h-8 w-8 p-0">
                    <MoreHorizontal className="h-4 w-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuLabel>Expiring soon</DropdownMenuLabel>
                  <DropdownMenuItem asChild>
                    <Link href={`/pharmacist/purchase-orders/create?expiringItemId=${item.id}`}>
                      <ShoppingCart className="mr-2 h-4 w-4" />
                      Reorder
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    onClick={() => setItemToDiscard(item)}
                    className="text-destructive focus:text-destructive"
                  >
                    <Trash2 className="mr-2 h-4 w-4" />
                    Discard (write off)
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => setItemToRemoveFromList(item)}>
                    <EyeOff className="mr-2 h-4 w-4" />
                    Remove from list
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          );
        },
      },
    ];
  }, []);

  useEffect(() => {
    const fetchEarned = async () => {
      if (!user?.access_token) return;
      const base = process.env.NEXT_PUBLIC_API_BASE_URL;
      const headers = { Authorization: `Bearer ${user.access_token}` };
      try {
        const thisMonth = getMonthRange(0);
        const lastMonth = getMonthRange(-1);
        const [resThis, resLast] = await Promise.all([
          fetch(
            `${base}/pharmacist/sales?startDate=${thisMonth.start.toISOString()}&endDate=${thisMonth.end.toISOString()}`,
            { headers }
          ),
          fetch(
            `${base}/pharmacist/sales?startDate=${lastMonth.start.toISOString()}&endDate=${lastMonth.end.toISOString()}`,
            { headers }
          ),
        ]);
        const dataThis = await resThis.json();
        const dataLast = await resLast.json();
        const salesThis = dataThis?.success && Array.isArray(dataThis?.data) ? dataThis.data : [];
        const salesLast = dataLast?.success && Array.isArray(dataLast?.data) ? dataLast.data : [];
        setEarnedThisMonth(salesThis.reduce((sum: number, s: { totalPrice?: number; refundedAmount?: number }) => sum + (s.totalPrice ?? 0) - (s.refundedAmount ?? 0), 0));
        setEarnedLastMonth(salesLast.reduce((sum: number, s: { totalPrice?: number; refundedAmount?: number }) => sum + (s.totalPrice ?? 0) - (s.refundedAmount ?? 0), 0));
      } catch (e) {
        console.error("Error fetching sales for stats:", e);
      }
    };
    fetchEarned();
  }, [user?.access_token]);

  if (user?.role !== "pharmacist") {
    return <Unauthorized />;
  }

  return (
    <div className="min-h-screen bg-gray-50/80">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
        <header className="mb-8">
          <motion.h1
            className="text-2xl sm:text-3xl font-bold text-red-800 tracking-tight"
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4 }}
          >
            Pharmacy Dashboard
          </motion.h1>
          <motion.p
            className="mt-1 text-sm sm:text-base text-gray-500"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.4, delay: 0.1 }}
          >
            Welcome back. Here’s your inventory and sales overview.
          </motion.p>
          <div className="mt-4 h-px bg-gradient-to-r from-red-200/80 via-red-100/50 to-transparent rounded-full" />
        </header>

        <PharmacyStats
          items={items}
          lowStockCount={lowStockCount}
          expiringCount={expiringCount}
          earnedThisMonth={earnedThisMonth}
          earnedLastMonth={earnedLastMonth}
        />

        <section className="space-y-6">
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: 0.15 }}
          >
            <Card className="overflow-hidden bg-white border border-gray-100 rounded-xl shadow-sm hover:shadow-md transition-shadow">
              <div className="border-l-4 border-l-red-500 bg-red-50/30 px-5 py-3">
                <h2 className="text-base font-semibold text-red-800">
                  Low Stock Items
                </h2>
                <p className="text-xs text-gray-500 mt-0.5">
                  Items below minimum stock — restock from Create Purchase Orders.
                </p>
              </div>
              <div className="p-4 sm:p-5">
                <DataTable columns={expiringTableColumns} data={lowStockItems} />
              </div>
            </Card>
          </motion.div>
          <motion.div
            id="expiring-soon"
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: 0.2 }}
          >
            <Card className="overflow-hidden bg-white border border-gray-100 rounded-xl shadow-sm hover:shadow-md transition-shadow">
              <div className="border-l-4 border-l-amber-500 bg-amber-50/30 px-5 py-3">
                <h2 className="text-base font-semibold text-red-800">
                  Expiring Soon
                </h2>
                <p className="text-xs text-gray-500 mt-0.5">
                  Items expiring within 30 days — reorder or discard as needed.
                </p>
              </div>
              <div className="p-4 sm:p-5">
                <DataTable columns={dashboardExpiringColumns} data={expiringItems} disableRowClick />
              </div>
            </Card>
          </motion.div>
        </section>
      </div>

      <Dialog open={!!itemToDiscard} onOpenChange={(open) => !open && setItemToDiscard(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Discard (write off) item?</DialogTitle>
            <DialogDescription>
              This will set quantity to 0 for <strong>{itemToDiscard?.name}</strong>. Use this when
              you have disposed of expiring stock. This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setItemToDiscard(null)}>
              Cancel
            </Button>
            <Button type="button" variant="destructive" onClick={handleDiscard} disabled={discarding}>
              {discarding ? "Discarding…" : "Discard"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={!!itemToRemoveFromList} onOpenChange={(open) => !open && setItemToRemoveFromList(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Remove from Expiring Soon list?</DialogTitle>
            <DialogDescription>
              <strong>{itemToRemoveFromList?.name}</strong> will no longer appear in the Expiring Soon
              table. Use this if you have handled the item (e.g. reordered or decided to keep selling).
              You can still see it in View Inventory.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setItemToRemoveFromList(null)}>
              Cancel
            </Button>
            <Button type="button" onClick={handleRemoveFromList} disabled={removingFromList}>
              {removingFromList ? "Removing…" : "Remove from list"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default PharmacistPage;
