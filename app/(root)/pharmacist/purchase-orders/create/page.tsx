"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { AlertCircle, Loader2, MoreHorizontal, ShoppingCart, XCircle, CalendarClock, Search } from "lucide-react";
import Loading from "@/components/shared/Loading";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { motion } from "framer-motion";
import { toast } from "sonner";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  flexRender,
  getCoreRowModel,
  getPaginationRowModel,
  useReactTable,
} from "@tanstack/react-table";
import type { ColumnDef } from "@tanstack/react-table";
import axios from "axios";
import { useAuth } from "@/app/providers/AuthProvider";
import { dispatchLowStockInvalidated } from "@/lib/low-stock-events";
import { dispatchExpiringInvalidated } from "@/lib/expiring-events";
import { TableEmptyState } from "@/components/shared/TableEmptyState";
import { Package } from "lucide-react";
import { Badge } from "@/components/ui/badge";

/** Item shown for reorder: low stock and/or expiring soon. API returns quantity & minimumStock. */
export interface ReorderItem {
  id: string;
  name: string;
  quantity: number;
  minimumStock: number;
  manufacturer: string;
  /** Display: "Low Stock", "Expiring Soon", or "Low Stock, Expiring Soon" */
  issueLabel: string;
  isLowStock: boolean;
  isExpiringSoon: boolean;
}

const getAuthHeaders = (token: string | undefined) =>
  token ? { Authorization: `Bearer ${token}` } : {};

function toReorderItemFromInventory(row: {
  id: string;
  name: string;
  quantity: number;
  minimumStock: number;
  manufacturer?: string;
}): ReorderItem {
  return {
    id: row.id,
    name: row.name,
    quantity: row.quantity,
    minimumStock: row.minimumStock ?? 0,
    manufacturer: row.manufacturer ?? "",
    issueLabel: "Reorder",
    isLowStock: false,
    isExpiringSoon: false,
  };
}

function mergeLowStockAndExpiring(
  lowStock: Array<{ id: string; name: string; quantity: number; minimumStock: number; manufacturer?: string }>,
  expiring: Array<{ id: string; name: string; quantity: number; minimumStock: number; manufacturer?: string }>
): ReorderItem[] {
  const map = new Map<string, ReorderItem>();
  for (const item of lowStock) {
    map.set(item.id, {
      id: item.id,
      name: item.name,
      quantity: item.quantity,
      minimumStock: item.minimumStock ?? (item as any).minimumQuantity ?? 0,
      manufacturer: item.manufacturer ?? "",
      issueLabel: "Low Stock",
      isLowStock: true,
      isExpiringSoon: false,
    });
  }
  for (const item of expiring) {
    const existing = map.get(item.id);
    const qty = item.quantity;
    const min = item.minimumStock ?? (item as any).minimumQuantity ?? 0;
    if (existing) {
      existing.issueLabel = "Low Stock, Expiring Soon";
      existing.isExpiringSoon = true;
    } else {
      map.set(item.id, {
        id: item.id,
        name: item.name,
        quantity: qty,
        minimumStock: min,
        manufacturer: item.manufacturer ?? "",
        issueLabel: "Expiring Soon",
        isLowStock: false,
        isExpiringSoon: true,
      });
    }
  }
  return Array.from(map.values());
}

export default function CreatePurchaseOrdersPage() {
  const { user } = useAuth();
  const [items, setItems] = useState<ReorderItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedItem, setSelectedItem] = useState<ReorderItem | null>(null);
  /** String so the field can be cleared while typing (no stuck "0") */
  const [orderQuantityInput, setOrderQuantityInput] = useState("");
  const [creatingOrder, setCreatingOrder] = useState(false);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [removeLowStockDialogOpen, setRemoveLowStockDialogOpen] = useState(false);
  const [removeExpiringDialogOpen, setRemoveExpiringDialogOpen] = useState(false);
  const [itemToRemoveLowStock, setItemToRemoveLowStock] = useState<ReorderItem | null>(null);
  const [itemToRemoveExpiring, setItemToRemoveExpiring] = useState<ReorderItem | null>(null);
  const [removing, setRemoving] = useState(false);
  const [allInventory, setAllInventory] = useState<ReorderItem[]>([]);
  const [inventorySearch, setInventorySearch] = useState("");
  const [loadingInventory, setLoadingInventory] = useState(false);

  const fetchItems = useCallback(async () => {
    const headers = getAuthHeaders(user?.access_token);
    try {
      setLoading(true);
      const [lowRes, expiringRes] = await Promise.all([
        axios.get(`${process.env.NEXT_PUBLIC_API_BASE_URL}/pharmacist/low-stock`, { headers }),
        axios.get(`${process.env.NEXT_PUBLIC_API_BASE_URL}/pharmacist/expiring`, { headers }),
      ]);
      const lowStock = lowRes.data ?? [];
      const expiring = expiringRes.data ?? [];
      const merged = mergeLowStockAndExpiring(lowStock, expiring);
      setItems(merged);
      setError(null);
    } catch (err) {
      console.error("Error fetching items:", err);
      setError(
        axios.isAxiosError(err) && err.response?.data?.message
          ? String(err.response.data.message)
          : "Failed to load items"
      );
      setItems([]);
    } finally {
      setLoading(false);
    }
  }, [user?.access_token]);

  const fetchAllInventory = useCallback(async () => {
    const headers = getAuthHeaders(user?.access_token);
    try {
      setLoadingInventory(true);
      const res = await axios.get(
        `${process.env.NEXT_PUBLIC_API_BASE_URL}/pharmacist`,
        { headers }
      );
      const rows = Array.isArray(res.data) ? res.data : [];
      setAllInventory(
        rows.map((r: { id: string; name: string; quantity: number; minimumStock?: number; manufacturer?: string }) =>
          toReorderItemFromInventory({
            id: r.id,
            name: r.name,
            quantity: r.quantity,
            minimumStock: r.minimumStock ?? 0,
            manufacturer: r.manufacturer,
          })
        )
      );
    } catch (err) {
      console.error("Error loading inventory for search:", err);
      setAllInventory([]);
    } finally {
      setLoadingInventory(false);
    }
  }, [user?.access_token]);

  useEffect(() => {
    fetchItems();
    fetchAllInventory();
  }, [fetchItems, fetchAllInventory]);

  const searchMatches = useMemo(() => {
    const q = inventorySearch.trim().toLowerCase();
    if (q.length < 1) return [];
    return allInventory
      .filter(
        (i) =>
          i.name.toLowerCase().includes(q) ||
          (i.manufacturer && i.manufacturer.toLowerCase().includes(q))
      )
      .slice(0, 20);
  }, [allInventory, inventorySearch]);

  const openOrderDialog = (item: ReorderItem) => {
    setSelectedItem(item);
    const suggested = Math.max(item.minimumStock * 2 - item.quantity, 10);
    setOrderQuantityInput(String(suggested));
    setDialogOpen(true);
  };

  const onOrderQuantityChange = (raw: string) => {
    if (raw === "") {
      setOrderQuantityInput("");
      return;
    }
    if (!/^\d+$/.test(raw)) return;
    setOrderQuantityInput(raw.replace(/^0+(?=\d)/, ""));
  };

  const handleCreateOrder = async () => {
    if (!selectedItem) return;
    const qty = parseInt(orderQuantityInput.trim(), 10);
    if (!Number.isFinite(qty) || qty < 1) {
      toast.error("Enter a valid quantity", {
        description: "Use a whole number of at least 1.",
      });
      return;
    }
    const headers = getAuthHeaders(user?.access_token);
    setCreatingOrder(true);
    try {
      await axios.post(
        `${process.env.NEXT_PUBLIC_API_BASE_URL}/pharmacist/purchase-order`,
        { inventoryItemId: selectedItem.id, quantityOrdered: qty },
        { headers }
      );
      toast.success("Purchase order created", {
        description: `${qty} units of ${selectedItem.name}.`,
      });
      setDialogOpen(false);
      setSelectedItem(null);
      setOrderQuantityInput("");
      await fetchItems();
      await fetchAllInventory();
      dispatchLowStockInvalidated();
      dispatchExpiringInvalidated();
    } catch (err) {
      console.error("Error creating order:", err);
      toast.error("Failed to create purchase order");
      if (axios.isAxiosError(err)) setError(err.response?.data?.message || "An error occurred");
    } finally {
      setCreatingOrder(false);
    }
  };

  const handleRemoveFromLowStockList = async () => {
    if (!itemToRemoveLowStock) return;
    const headers = getAuthHeaders(user?.access_token);
    try {
      setRemoving(true);
      await axios.patch(
        `${process.env.NEXT_PUBLIC_API_BASE_URL}/pharmacist/low-stock-exclude/${itemToRemoveLowStock.id}`,
        { exclude: true },
        { headers }
      );
      toast.success("Removed from low-stock list", {
        description: `${itemToRemoveLowStock.name} will no longer appear in low-stock alerts.`,
      });
      setRemoveLowStockDialogOpen(false);
      setItemToRemoveLowStock(null);
      await fetchItems();
      dispatchLowStockInvalidated();
    } catch (err) {
      console.error("Error excluding from low stock:", err);
      toast.error(axios.isAxiosError(err) && err.response?.data?.message ? String(err.response.data.message) : "Failed to remove from list");
    } finally {
      setRemoving(false);
    }
  };

  const handleRemoveFromExpiringList = async () => {
    if (!itemToRemoveExpiring) return;
    const headers = getAuthHeaders(user?.access_token);
    try {
      setRemoving(true);
      await axios.patch(
        `${process.env.NEXT_PUBLIC_API_BASE_URL}/pharmacist/expiry-exclude/${itemToRemoveExpiring.id}`,
        { exclude: true },
        { headers }
      );
      toast.success("Removed from expiring list", {
        description: `${itemToRemoveExpiring.name} will no longer appear in Expiring Soon.`,
      });
      setRemoveExpiringDialogOpen(false);
      setItemToRemoveExpiring(null);
      await fetchItems();
      dispatchExpiringInvalidated();
    } catch (err) {
      console.error("Error excluding from expiring:", err);
      toast.error(axios.isAxiosError(err) && err.response?.data?.message ? String(err.response.data.message) : "Failed to remove from list");
    } finally {
      setRemoving(false);
    }
  };

  const columns: ColumnDef<ReorderItem>[] = [
    {
      accessorKey: "name",
      header: "Item Name",
      cell: ({ row }) => <div className="font-medium">{row.getValue("name")}</div>,
    },
    {
      accessorKey: "quantity",
      header: "Current Quantity",
      cell: ({ row }) => (
        <div className="text-red-600 font-semibold">{row.getValue("quantity")}</div>
      ),
    },
    {
      accessorKey: "minimumStock",
      header: "Minimum Quantity",
      cell: ({ row }) => row.getValue("minimumStock"),
    },
    {
      accessorKey: "issueLabel",
      header: "Issue",
      cell: ({ row }) => {
        const item = row.original;
        const isBoth = item.isLowStock && item.isExpiringSoon;
        return (
          <Badge variant={isBoth ? "secondary" : item.isExpiringSoon ? "outline" : "destructive"} className="whitespace-nowrap">
            {item.issueLabel}
          </Badge>
        );
      },
    },
    {
      accessorKey: "manufacturer",
      header: "Manufacturer",
    },
    {
      id: "actions",
      header: "Action",
      cell: ({ row }) => {
        const item = row.original;
        return (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="sm" className="gap-1">
                Actions
                <MoreHorizontal className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={() => openOrderDialog(item)}>
                <ShoppingCart className="mr-2 h-4 w-4" />
                Create Order
              </DropdownMenuItem>
              {item.isLowStock && (
                <DropdownMenuItem
                  onClick={() => {
                    setItemToRemoveLowStock(item);
                    setRemoveLowStockDialogOpen(true);
                  }}
                  className="text-amber-700 focus:text-amber-700"
                >
                  <XCircle className="mr-2 h-4 w-4" />
                  Remove from low-stock list
                </DropdownMenuItem>
              )}
              {item.isExpiringSoon && (
                <DropdownMenuItem
                  onClick={() => {
                    setItemToRemoveExpiring(item);
                    setRemoveExpiringDialogOpen(true);
                  }}
                  className="text-orange-700 focus:text-orange-700"
                >
                  <CalendarClock className="mr-2 h-4 w-4" />
                  Remove from expiring list
                </DropdownMenuItem>
              )}
            </DropdownMenuContent>
          </DropdownMenu>
        );
      },
    },
  ];

  const table = useReactTable({
    data: items,
    columns,
    getCoreRowModel: getCoreRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    initialState: { pagination: { pageSize: 5 } },
  });

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50/80">
        <Loading />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50/80">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
        <header className="mb-6">
          <motion.h1
            className="text-2xl sm:text-3xl font-bold text-red-800 tracking-tight"
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4 }}
          >
            Create Purchase Order
          </motion.h1>
          <motion.p className="mt-1 text-sm text-gray-500" initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.1 }}>
            Restock any product by searching inventory, or create orders from low-stock and expiring-soon alerts.
          </motion.p>
          <div className="mt-4 h-px bg-gradient-to-r from-red-200/80 via-red-100/50 to-transparent rounded-full" />
        </header>

        <Card className="overflow-hidden bg-white border border-gray-100 rounded-xl shadow-sm hover:shadow-md transition-shadow mb-6">
          <div className="border-l-4 border-l-emerald-600 bg-emerald-50/30 px-5 py-3">
            <h2 className="text-base font-semibold text-red-800">Order stock for any item</h2>
            <p className="text-xs text-gray-500 mt-0.5">
              Search by name or manufacturer. When the order is marked delivered, quantity is added to this same inventory row.
            </p>
          </div>
          <CardContent className="p-4 sm:p-5 space-y-3">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search inventory (e.g. Panadol)…"
                value={inventorySearch}
                onChange={(e) => setInventorySearch(e.target.value)}
                className="pl-9 h-10"
                aria-label="Search inventory for purchase order"
              />
            </div>
            {loadingInventory && (
              <p className="text-xs text-muted-foreground flex items-center gap-2">
                <Loader2 className="h-3.5 w-3.5 animate-spin" />
                Loading inventory…
              </p>
            )}
            {!loadingInventory && inventorySearch.trim().length > 0 && searchMatches.length === 0 && (
              <p className="text-sm text-muted-foreground">No matching items.</p>
            )}
            {searchMatches.length > 0 && (
              <ul className="max-h-56 overflow-y-auto rounded-md border border-gray-100 divide-y divide-gray-100">
                {searchMatches.map((item) => (
                  <li
                    key={item.id}
                    className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 px-3 py-2.5 hover:bg-gray-50/80"
                  >
                    <div className="min-w-0">
                      <p className="font-medium text-sm truncate">{item.name}</p>
                      <p className="text-xs text-muted-foreground">
                        Qty {item.quantity}
                        {item.manufacturer ? ` · ${item.manufacturer}` : ""}
                      </p>
                    </div>
                    <Button
                      type="button"
                      size="sm"
                      className="shrink-0"
                      onClick={() => openOrderDialog(item)}
                    >
                      <ShoppingCart className="mr-1.5 h-4 w-4" />
                      Create order
                    </Button>
                  </li>
                ))}
              </ul>
            )}
          </CardContent>
        </Card>

        <Card className="overflow-hidden bg-white border border-gray-100 rounded-xl shadow-sm hover:shadow-md transition-shadow">
          <div className="border-l-4 border-l-red-500 bg-red-50/30 px-5 py-3">
            <h2 className="text-base font-semibold text-red-800">Items to reorder</h2>
            <p className="text-xs text-gray-500 mt-0.5">
              Low stock and expiring soon. Add to list and create orders.
            </p>
          </div>
          <CardContent className="p-4 sm:p-5">
          <div className="space-y-4">
            {error ? (
              <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertTitle>Error</AlertTitle>
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            ) : items.length === 0 ? (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="flex flex-col items-center justify-center py-12 px-4 rounded-lg bg-gray-50/80"
              >
                <div className="h-14 w-14 rounded-full bg-gray-100 flex items-center justify-center mb-3">
                  <AlertCircle className="h-7 w-7 text-gray-400" />
                </div>
                <p className="text-sm font-medium text-gray-600">No items to reorder</p>
                <p className="text-xs text-gray-500 mt-0.5">
                  No low stock or expiring soon items.
                </p>
              </motion.div>
            ) : (
              <div className="rounded-lg border border-gray-100 overflow-hidden">
                <Table wrapperClassName={items.length > 0 ? "min-h-[260px]" : undefined}>
                  <TableHeader>
                    {table.getHeaderGroups().map((headerGroup) => (
                      <TableRow key={headerGroup.id}>
                        {headerGroup.headers.map((header) => (
                          <TableHead
                            key={header.id}
                            className="text-left"
                          >
                              {header.isPlaceholder
                                ? null
                                : flexRender(
                                    header.column.columnDef.header,
                                    header.getContext()
                                  )}
                            </TableHead>
                            ))}
                          </TableRow>
                        ))}
                      </TableHeader>
                  <TableBody>
                    {table.getRowModel().rows?.length ? (
                      table.getRowModel().rows.map((row) => (
                        <TableRow key={row.id}>
                          {row.getVisibleCells().map((cell) => (
                            <TableCell
                              key={cell.id}
                            >
                                {flexRender(
                                  cell.column.columnDef.cell,
                                  cell.getContext()
                                )}
                              </TableCell>
                            ))}
                          </TableRow>
                        ))
                      ) : (
                        <TableEmptyState
                          icon={Package}
                          title="No items"
                          description="No low stock or expiring soon items to reorder."
                          colSpan={columns.length}
                        />
                      )}
                    </TableBody>
                  </Table>
                <div className="flex flex-col sm:flex-row items-center justify-between space-y-2 sm:space-y-0 py-4">
                  <div className="text-sm text-muted-foreground">
                    Page {table.getState().pagination.pageIndex + 1} of{" "}
                    {table.getPageCount()}
                  </div>
                  <div className="space-x-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => table.previousPage()}
                      disabled={!table.getCanPreviousPage()}
                    >
                      Previous
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => table.nextPage()}
                      disabled={!table.getCanNextPage()}
                    >
                      Next
                    </Button>
                  </div>
                </div>
              </div>
            )}
          </div>
          </CardContent>
        </Card>

      {/* Remove from low-stock list */}
      <Dialog open={removeLowStockDialogOpen} onOpenChange={setRemoveLowStockDialogOpen}>
        <DialogContent className="sm:max-w-[480px]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <XCircle className="h-5 w-5 text-amber-600" />
              Remove from low-stock list?
            </DialogTitle>
            {itemToRemoveLowStock && (
              <DialogDescription className="text-left pt-1 space-y-2">
                <span className="block font-medium text-foreground">{itemToRemoveLowStock.name}</span>
                <span className="block">
                  This item will no longer appear in low-stock alerts. Use when it can&apos;t be reordered (e.g. manufacturer unavailable). It stays in inventory.
                </span>
              </DialogDescription>
            )}
          </DialogHeader>
          <DialogFooter className="gap-2 sm:gap-0 pt-4">
            <Button variant="outline" onClick={() => { setRemoveLowStockDialogOpen(false); setItemToRemoveLowStock(null); }} disabled={removing}>Cancel</Button>
            <Button variant="secondary" className="bg-amber-100 text-amber-800 hover:bg-amber-200" onClick={handleRemoveFromLowStockList} disabled={removing}>
              {removing ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Removing…</> : "Remove from list"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Remove from expiring list */}
      <Dialog open={removeExpiringDialogOpen} onOpenChange={setRemoveExpiringDialogOpen}>
        <DialogContent className="sm:max-w-[480px]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <CalendarClock className="h-5 w-5 text-orange-600" />
              Remove from expiring list?
            </DialogTitle>
            {itemToRemoveExpiring && (
              <DialogDescription className="text-left pt-1 space-y-2">
                <span className="block font-medium text-foreground">{itemToRemoveExpiring.name}</span>
                <span className="block">
                  This item will no longer appear in Expiring Soon. Use when you&apos;ve handled it (e.g. reordered or decided to keep selling). It stays in inventory.
                </span>
              </DialogDescription>
            )}
          </DialogHeader>
          <DialogFooter className="gap-2 sm:gap-0 pt-4">
            <Button variant="outline" onClick={() => { setRemoveExpiringDialogOpen(false); setItemToRemoveExpiring(null); }} disabled={removing}>Cancel</Button>
            <Button variant="secondary" className="bg-orange-100 text-orange-800 hover:bg-orange-200" onClick={handleRemoveFromExpiringList} disabled={removing}>
              {removing ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Removing…</> : "Remove from list"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Order Dialog */}
      <Dialog
        open={dialogOpen}
        onOpenChange={(open) => {
          setDialogOpen(open);
          if (!open) {
            setSelectedItem(null);
            setOrderQuantityInput("");
            setCreatingOrder(false);
          }
        }}
      >
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-red-800">
              <ShoppingCart className="h-5 w-5 shrink-0" aria-hidden />
              Create purchase order
            </DialogTitle>
            <DialogDescription className="text-left text-gray-600">
              {selectedItem ? (
                <>
                  Order stock for <span className="font-medium text-foreground">{selectedItem.name}</span>.
                  Quantity is added to inventory when this order is marked delivered.
                </>
              ) : (
                "Choose an item from the list to create an order."
              )}
            </DialogDescription>
          </DialogHeader>

          {selectedItem && (
            <div className="space-y-4">
              <div className="rounded-lg border border-gray-100 overflow-hidden">
                <Table>
                  <TableBody>
                    <TableRow className="hover:bg-transparent">
                      <TableCell className="w-[38%] py-2.5 text-sm text-gray-500 font-medium">
                        Manufacturer
                      </TableCell>
                      <TableCell className="py-2.5 text-sm">
                        {selectedItem.manufacturer?.trim() || "—"}
                      </TableCell>
                    </TableRow>
                    <TableRow className="hover:bg-transparent">
                      <TableCell className="py-2.5 text-sm text-gray-500 font-medium">
                        Current stock
                      </TableCell>
                      <TableCell
                        className={`py-2.5 text-sm tabular-nums ${
                          selectedItem.quantity < selectedItem.minimumStock
                            ? "text-red-600 font-semibold"
                            : ""
                        }`}
                      >
                        {selectedItem.quantity}
                      </TableCell>
                    </TableRow>
                    <TableRow className="hover:bg-transparent">
                      <TableCell className="py-2.5 text-sm text-gray-500 font-medium">
                        Minimum stock
                      </TableCell>
                      <TableCell className="py-2.5 text-sm tabular-nums">
                        {selectedItem.minimumStock}
                      </TableCell>
                    </TableRow>
                    {(selectedItem.isLowStock || selectedItem.isExpiringSoon) && (
                      <TableRow className="hover:bg-transparent bg-amber-50/50">
                        <TableCell className="py-2.5 text-sm text-gray-500 font-medium">
                          Alert
                        </TableCell>
                        <TableCell className="py-2.5 text-sm text-amber-900">
                          {selectedItem.isLowStock && selectedItem.isExpiringSoon
                            ? "Low stock and expiring soon"
                            : selectedItem.isLowStock
                              ? "Low stock"
                              : "Expiring soon"}
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </div>

              <div className="space-y-2">
                <Label htmlFor="order-quantity" className="text-sm font-medium text-gray-700">
                  Units to order
                </Label>
                <Input
                  id="order-quantity"
                  inputMode="numeric"
                  autoComplete="off"
                  placeholder="e.g. 50"
                  value={orderQuantityInput}
                  onChange={(e) => onOrderQuantityChange(e.target.value)}
                  className="h-10 text-sm tabular-nums"
                  aria-describedby="order-qty-hint"
                />
                <p id="order-qty-hint" className="text-xs text-gray-500">
                  Suggested:{" "}
                  {Math.max(selectedItem.minimumStock * 2 - selectedItem.quantity, 10)} units.
                </p>
              </div>
            </div>
          )}

          <DialogFooter className="gap-2 sm:gap-0">
            <Button
              type="button"
              variant="outline"
              disabled={creatingOrder}
              onClick={() => setDialogOpen(false)}
            >
              Cancel
            </Button>
            <Button
              type="button"
              className="bg-red-800 hover:bg-red-900"
              disabled={creatingOrder || !selectedItem}
              onClick={handleCreateOrder}
            >
              {creatingOrder ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Creating…
                </>
              ) : (
                "Create order"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      </div>
    </div>
  );
}
