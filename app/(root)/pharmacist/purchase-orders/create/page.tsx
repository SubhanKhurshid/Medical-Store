"use client";

import { useCallback, useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { AlertCircle, Loader, MoreHorizontal, ShoppingCart, XCircle, CalendarClock } from "lucide-react";
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

interface CreateOrderPayload {
  inventoryItemId: string;
  quantityOrdered: number;
}

const getAuthHeaders = (token: string | undefined) =>
  token ? { Authorization: `Bearer ${token}` } : {};

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
  const [orderQuantity, setOrderQuantity] = useState<number>(0);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [removeLowStockDialogOpen, setRemoveLowStockDialogOpen] = useState(false);
  const [removeExpiringDialogOpen, setRemoveExpiringDialogOpen] = useState(false);
  const [itemToRemoveLowStock, setItemToRemoveLowStock] = useState<ReorderItem | null>(null);
  const [itemToRemoveExpiring, setItemToRemoveExpiring] = useState<ReorderItem | null>(null);
  const [removing, setRemoving] = useState(false);

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

  useEffect(() => {
    fetchItems();
  }, [fetchItems]);

  const openOrderDialog = (item: ReorderItem) => {
    setSelectedItem(item);
    setOrderQuantity(Math.max(item.minimumStock * 2 - item.quantity, 10));
    setDialogOpen(true);
  };

  const handleCreateOrder = async () => {
    if (!selectedItem) return;
    const headers = getAuthHeaders(user?.access_token);
    try {
      await axios.post(
        `${process.env.NEXT_PUBLIC_API_BASE_URL}/pharmacist/purchase-order`,
        { inventoryItemId: selectedItem.id, quantityOrdered: orderQuantity },
        { headers }
      );
      toast.success("Purchase Order Created", {
        description: `Order for ${orderQuantity} units of ${selectedItem.name} has been created.`,
      });
      setDialogOpen(false);
      await fetchItems();
      dispatchLowStockInvalidated();
      dispatchExpiringInvalidated();
    } catch (err) {
      console.error("Error creating order:", err);
      toast.error("Failed to create purchase order");
      if (axios.isAxiosError(err)) setError(err.response?.data?.message || "An error occurred");
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
      <div className="flex items-center justify-center h-screen">
        <Loader className="animate-spin h-5 w-5 text-red-800 mr-2" />
        <span>Loading items...</span>
      </div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="p-6 md:p-8 max-w-9xl mx-auto min-h-screen bg-gray-50"
    >
      <Card className="bg-white/90 backdrop-blur-md shadow-lg border-0 rounded-lg">
        <CardHeader className="border-b-2 border-red-700 p-6">
          <CardTitle className="text-3xl md:text-4xl font-bold text-red-800">
            Create Purchase Orders
          </CardTitle>
          <p className="text-xl text-gray-500 mt-2">
            Create purchase orders for low stock and expiring soon items
          </p>
        </CardHeader>
        <CardContent className="mt-5">
          <div className="space-y-6">
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
                className="flex flex-col items-center justify-center py-12 px-4"
              >
                <div className="h-20 w-20 rounded-full bg-red-50 flex items-center justify-center mb-4">
                  <AlertCircle className="h-10 w-10 text-red-700" />
                </div>
                <h3 className="text-lg font-medium text-gray-900 mb-1">
                  No items to reorder
                </h3>
                <p className="text-sm text-gray-500">
                  There are currently no low stock or expiring soon items.
                </p>
              </motion.div>
            ) : (
              <div className="w-full">
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
              {removing ? <><Loader className="mr-2 h-4 w-4 animate-spin" /> Removing…</> : "Remove from list"}
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
              {removing ? <><Loader className="mr-2 h-4 w-4 animate-spin" /> Removing…</> : "Remove from list"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Order Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="sm:max-w-[600px] md:max-w-[800px] w-full">
          <DialogHeader>
            <DialogTitle className="text-xl font-bold">Create Purchase Order</DialogTitle>
            {selectedItem && (
              <DialogDescription className="text-base mt-2">
                Create a purchase order for {selectedItem.name} from {selectedItem.manufacturer}
              </DialogDescription>
            )}
          </DialogHeader>
          {selectedItem && (
            <>
              <div className="flex flex-col gap-6 py-6">
                <div className="flex flex-col gap-2">
                  <Label htmlFor="current-quantity" className="text-base font-medium">Current Qty</Label>
                  <Input id="current-quantity" value={selectedItem.quantity} className="h-12 text-base" disabled />
                </div>
                <div className="flex flex-col gap-2">
                  <Label htmlFor="minimum-quantity" className="text-base font-medium">Minimum Qty</Label>
                  <Input id="minimum-quantity" value={selectedItem.minimumStock} className="h-12 text-base" disabled />
                </div>
                <div className="flex flex-col gap-2">
                  <Label htmlFor="order-quantity" className="text-base font-medium">Order Qty</Label>
                  <Input
                    id="order-quantity"
                    type="number"
                    min={1}
                    value={orderQuantity}
                    onChange={(e) => setOrderQuantity(Number(e.target.value) || 0)}
                    className="h-12 text-base"
                  />
                </div>
              </div>
              <DialogFooter className="pt-4">
                <Button type="button" onClick={handleCreateOrder} className="px-8 py-3 text-base">
                  Create Order
                </Button>
              </DialogFooter>
            </>
          )}
        </DialogContent>
      </Dialog>
    </motion.div>
  );
}
