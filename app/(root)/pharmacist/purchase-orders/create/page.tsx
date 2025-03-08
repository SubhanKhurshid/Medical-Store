"use client";

import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { AlertCircle, Loader } from "lucide-react";
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

interface LowStockItem {
  id: string;
  name: string;
  currentQuantity: number;
  minimumQuantity: number;
  manufacturer: string;
}

interface CreateOrderPayload {
  inventoryItemId: string;
  quantityOrdered: number;
}

export default function CreatePurchaseOrdersPage() {
  const [lowStockItems, setLowStockItems] = useState<LowStockItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedItem, setSelectedItem] = useState<LowStockItem | null>(null);
  const [quantity, setQuantity] = useState<number>(0);
  const [dialogOpen, setDialogOpen] = useState(false);

  // Handle create order
  const openOrderDialog = (item: LowStockItem) => {
    setSelectedItem(item);
    setQuantity(Math.max(item.minimumQuantity * 2 - item.currentQuantity, 10));
    setDialogOpen(true);
  };

  const handleCreateOrder = async () => {
    if (!selectedItem) return;

    try {
      const payload: CreateOrderPayload = {
        inventoryItemId: selectedItem.id,
        quantityOrdered: quantity,
      };

      const { data } = await axios.post(
        "https://annual-johna-uni2234-7798c123.koyeb.app/pharmacist/purchase-order",
        payload
      );

      toast.success("Purchase Order Created", {
        description: `Order for ${quantity} units of ${selectedItem.name} has been created.`,
      });

      // Refresh low stock items
      const { data: newData } = await axios.get(
        "https://annual-johna-uni2234-7798c123.koyeb.app/pharmacist/low-stock"
      );
      setLowStockItems(newData);
    } catch (error) {
      console.error("Error creating order:", error);
      toast.error("Failed to create purchase order");
      if (axios.isAxiosError(error)) {
        setError(error.response?.data?.message || "An error occurred");
      }
    } finally {
      setDialogOpen(false);
    }
  };

  const columns: ColumnDef<LowStockItem>[] = [
    {
      accessorKey: "name",
      header: "Item Name",
      cell: ({ row }) => (
        <div className="font-medium">{row.getValue("name")}</div>
      ),
    },
    {
      accessorKey: "currentQuantity",
      header: "Current Quantity",
      cell: ({ row }) => (
        <div className="text-red-600 font-semibold">
          {row.getValue("currentQuantity")}
        </div>
      ),
    },
    {
      accessorKey: "minimumQuantity",
      header: "Minimum Quantity",
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
          <Button
            variant="default"
            size="sm"
            onClick={() => openOrderDialog(item)}
          >
            Create Order
          </Button>
        );
      },
    },
  ];

  // Set up the table
  const table = useReactTable({
    data: lowStockItems,
    columns,
    getCoreRowModel: getCoreRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    initialState: {
      pagination: {
        pageSize: 5,
      },
    },
  });

  useEffect(() => {
    const fetchLowStockItems = async () => {
      try {
        setLoading(true);
        const { data } = await axios.get(
          "https://annual-johna-uni2234-7798c123.koyeb.app/pharmacist/low-stock"
        );
        setLowStockItems(data);
      } catch (error) {
        console.error("Error fetching low stock items:", error);
        setError(
          axios.isAxiosError(error)
            ? error.response?.data?.message || "Failed to load low stock items"
            : "Failed to load low stock items"
        );
      } finally {
        setLoading(false);
      }
    };

    fetchLowStockItems();
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <Loader className="animate-spin h-5 w-5 text-red-800 mr-2" />
        <span>Loading low stock items...</span>
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
            Create purchase orders for low stock items
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
            ) : lowStockItems.length === 0 ? (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="flex flex-col items-center justify-center py-12 px-4"
              >
                <div className="h-20 w-20 rounded-full bg-red-50 flex items-center justify-center mb-4">
                  <AlertCircle className="h-10 w-10 text-red-700" />
                </div>
                <h3 className="text-lg font-medium text-gray-900 mb-1">
                  No Low Stock Items
                </h3>
                <p className="text-sm text-gray-500">
                  There are currently no items that need to be reordered.
                </p>
              </motion.div>
            ) : (
              <div className="w-full">
                <div className="rounded-md border-none">
                  <Table className="min-h-[400px]">
                    <TableHeader>
                      {table.getHeaderGroups().map((headerGroup) => (
                        <TableRow key={headerGroup.id}>
                          {headerGroup.headers.map((header) => (
                            <TableHead
                              key={header.id}
                              className="px-3 py-4 text-left text-lg font-semibold"
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
                          <TableRow key={row.id} className="hover:bg-muted/50">
                            {row.getVisibleCells().map((cell) => (
                              <TableCell
                                key={cell.id}
                                className="px-3 py-4 text-base font-medium"
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
                        <TableRow>
                          <TableCell
                            colSpan={columns.length}
                            className="h-24 text-center text-lg font-semibold"
                          >
                            No results.
                          </TableCell>
                        </TableRow>
                      )}
                    </TableBody>
                  </Table>
                </div>
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

      {/* Order Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="sm:max-w-[600px] md:max-w-[800px] w-full">
          <DialogHeader>
            <DialogTitle className="text-xl font-bold">
              Create Purchase Order
            </DialogTitle>
            {selectedItem && (
              <DialogDescription className="text-base mt-2">
                Create a purchase order for {selectedItem.name} from{" "}
                {selectedItem.manufacturer}
              </DialogDescription>
            )}
          </DialogHeader>
          {selectedItem && (
            <>
              <div className="flex flex-col gap-6 py-6">
                <div className="flex flex-col gap-2">
                  <Label
                    htmlFor="current-quantity"
                    className="text-base font-medium"
                  >
                    Current Qty
                  </Label>
                  <Input
                    id="current-quantity"
                    value={selectedItem.currentQuantity}
                    className="h-12 text-base"
                    disabled
                  />
                </div>
                <div className="flex flex-col gap-2">
                  <Label
                    htmlFor="minimum-quantity"
                    className="text-base font-medium"
                  >
                    Minimum Qty
                  </Label>
                  <Input
                    id="minimum-quantity"
                    value={selectedItem.minimumQuantity}
                    className="h-12 text-base"
                    disabled
                  />
                </div>
                <div className="flex flex-col gap-2">
                  <Label
                    htmlFor="order-quantity"
                    className="text-base font-medium"
                  >
                    Order Qty
                  </Label>
                  <Input
                    id="order-quantity"
                    type="number"
                    onChange={(e) => setQuantity(Number(e.target.value))}
                    className="h-12 text-base"
                  />
                </div>
              </div>
              <DialogFooter className="pt-4">
                <Button
                  type="submit"
                  onClick={handleCreateOrder}
                  className="px-8 py-3 text-base"
                >
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
