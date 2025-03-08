"use client";

import { DialogTitle } from "@/components/ui/dialog";

import { DialogHeader } from "@/components/ui/dialog";

import { DialogContent } from "@/components/ui/dialog";

import { Dialog } from "@/components/ui/dialog";

import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { AlertCircle, CheckCircle, Loader, XCircle } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { motion } from "framer-motion";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
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

interface PurchaseOrder {
  id: string;
  orderNumber: string;
  itemName: string;
  quantity: number;
  manufacturer: string;
  status: "PENDING" | "DELIVERED" | "CANCELLED";
  createdAt: string;
}

export default function ViewPurchaseOrdersPage() {
  const [purchaseOrders, setPurchaseOrders] = useState<PurchaseOrder[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedRow, setSelectedRow] = useState<PurchaseOrder | null>(null);

  // Function to format date
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  };

  // Handle row click
  const handleRowClick = (order: PurchaseOrder) => {
    setSelectedRow(order);
  };

  // Close modal
  const closeModal = () => {
    setSelectedRow(null);
  };

  const StatusBadge = ({ status }: { status: string }) => {
    switch (status) {
      case "PENDING":
        return <Badge className="bg-yellow-100 text-yellow-800">Pending</Badge>;
      case "DELIVERED":
        return <Badge className="bg-green-100 text-green-800">Delivered</Badge>;
      case "CANCELLED":
        return <Badge className="bg-red-100 text-red-800">Cancelled</Badge>;
      default:
        return <Badge>{status}</Badge>;
    }
  };


  // Handle status change
  const handleStatusChange = async (orderId: string, newStatus: "DELIVERED" | "CANCELLED") => {
    try {
      await axios.patch(`https://annual-johna-uni2234-7798c123.koyeb.app/pharmacist/${orderId}/purchase-order-status`, { status: newStatus });

      setPurchaseOrders(prevOrders =>
        prevOrders.map(order =>
          order.id === orderId ? { ...order, status: newStatus } : order
        )
      );

      toast.success("Status Updated", {
        description: `Purchase order has been marked as ${newStatus.toLowerCase()}.`,
      });

    } catch (error) {
      console.error("Error updating status:", error);
      toast.error("Failed to update order status");
    }
  };

  const columns: ColumnDef<PurchaseOrder>[] = [
    {
      accessorKey: "orderNumber",
      header: "Order Number",
      cell: ({ row }) => <div className="font-medium">{row.getValue("orderNumber")}</div>,
    },
    {
      accessorKey: "itemName",
      header: "Item",
    },
    {
      accessorKey: "quantity",
      header: "Quantity",
    },
    {
      accessorKey: "manufacturer",
      header: "Manufacturer",
    },
    {
      accessorKey: "createdAt",
      header: "Date Created",
      cell: ({ row }) => formatDate(row.getValue("createdAt")),
    },
    {
      accessorKey: "status",
      header: "Status",
      cell: ({ row }) => <StatusBadge status={row.getValue("status")} />,
    },
    {
      id: "actions",
      header: "Actions",
      cell: ({ row }) => {
        const order = row.original;
        if (order.status !== "PENDING") return null;

        return (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="sm">Actions</Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent>
              <DropdownMenuItem
                onClick={() => handleStatusChange(order.id, "DELIVERED")}
                className="text-green-600"
              >
                <CheckCircle className="mr-2 h-4 w-4" />
                Mark as Delivered
              </DropdownMenuItem>
              <DropdownMenuItem
                onClick={() => handleStatusChange(order.id, "CANCELLED")}
                className="text-red-600"
              >
                <XCircle className="mr-2 h-4 w-4" />
                Cancel Order
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        );
      },
    },
  ];


  const table = useReactTable({
    data: purchaseOrders,
    columns,
    getCoreRowModel: getCoreRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    initialState: { pagination: { pageSize: 5 } },
  });

  useEffect(() => {
    const fetchPurchaseOrders = async () => {
      try {
        setLoading(true);
        const { data } = await axios.get('https://annual-johna-uni2234-7798c123.koyeb.app/pharmacist/purchase-orders');

        const transformedData = data.map((order: any) => ({
          ...order,
          itemName: order.inventoryItem?.name || "N/A",
          manufacturer: order.manufacturer?.companyName || "N/A",
          orderNumber: `PO-${new Date(order.createdAt).getFullYear()}-${order.id.slice(-4)}`
        }));

        setPurchaseOrders(transformedData);
      } catch (error) {
        console.error("Error fetching purchase orders:", error);
        setError(axios.isAxiosError(error)
          ? error.response?.data?.message || "Failed to load orders"
          : "Failed to load orders");
      } finally {
        setLoading(false);
      }
    };

    fetchPurchaseOrders();
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <Loader className="animate-spin h-5 w-5 text-red-800 mr-2" />
        <span>Loading purchase orders...</span>
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
            View Purchase Orders
          </CardTitle>
          <p className="text-xl text-gray-500 mt-2">
            Manage and track your purchase orders
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
            ) : purchaseOrders.length === 0 ? (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="flex flex-col items-center justify-center py-12 px-4"
              >
                <div className="h-20 w-20 rounded-full bg-red-50 flex items-center justify-center mb-4">
                  <AlertCircle className="h-10 w-10 text-red-700" />
                </div>
                <h3 className="text-lg font-medium text-gray-900 mb-1">
                  No Purchase Orders
                </h3>
                <p className="text-sm text-gray-500">
                  There are currently no purchase orders in the system.
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
                          <TableRow
                            key={row.id}
                            onClick={() => handleRowClick(row.original)}
                            className="cursor-pointer hover:bg-muted/50"
                          >
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

      {/* Order Details Dialog - Would be expanded with more details in a real application */}
      <Dialog open={!!selectedRow} onOpenChange={closeModal}>
        <DialogContent className="sm:max-w-[600px]">
          <DialogHeader>
            <DialogTitle className="text-xl font-bold">
              Purchase Order Details
            </DialogTitle>
          </DialogHeader>

          {selectedRow && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <h4 className="text-sm font-medium text-muted-foreground mb-1">
                    Order Number
                  </h4>
                  <p className="text-base font-semibold">
                    {selectedRow.orderNumber}
                  </p>
                </div>
                <div>
                  <h4 className="text-sm font-medium text-muted-foreground mb-1">
                    Status
                  </h4>
                  <StatusBadge status={selectedRow.status} />
                </div>
              </div>

              <div>
                <h4 className="text-sm font-medium text-muted-foreground mb-1">
                  Item
                </h4>
                <p className="text-base">{selectedRow.itemName}</p>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <h4 className="text-sm font-medium text-muted-foreground mb-1">
                    Quantity
                  </h4>
                  <p className="text-base">{selectedRow.quantity} units</p>
                </div>
                <div>
                  <h4 className="text-sm font-medium text-muted-foreground mb-1">
                    Manufacturer
                  </h4>
                  <p className="text-base">{selectedRow.manufacturer}</p>
                </div>
              </div>

              <div>
                <h4 className="text-sm font-medium text-muted-foreground mb-1">
                  Date Created
                </h4>
                <p className="text-base">{formatDate(selectedRow.createdAt)}</p>
              </div>

              {selectedRow.status === "PENDING" && (
                <div className="flex justify-end space-x-2 pt-4">
                  <Button
                    variant="outline"
                    onClick={() => {
                      handleStatusChange(selectedRow.id, "CANCELLED");
                      closeModal();
                    }}
                    className="text-red-600 border-red-200 hover:bg-red-50"
                  >
                    <XCircle className="mr-2 h-4 w-4" />
                    Cancel Order
                  </Button>
                  <Button
                    onClick={() => {
                      handleStatusChange(selectedRow.id, "DELIVERED");
                      closeModal();
                    }}
                    className="bg-green-600 hover:bg-green-700 text-white"
                  >
                    <CheckCircle className="mr-2 h-4 w-4" />
                    Mark as Completed
                  </Button>
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </motion.div>
  );
}
