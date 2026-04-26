"use client";

import { DialogTitle } from "@/components/ui/dialog";

import { DialogHeader } from "@/components/ui/dialog";

import { DialogContent } from "@/components/ui/dialog";

import { Dialog } from "@/components/ui/dialog";

import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { AlertCircle, CheckCircle, XCircle } from "lucide-react";
import Loading from "@/components/shared/Loading";
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
  getSortedRowModel,
  useReactTable,
} from "@tanstack/react-table";
import type { ColumnDef } from "@tanstack/react-table";
import axios from "axios";
import { dispatchLowStockInvalidated } from "@/lib/low-stock-events";
import { TableEmptyState } from "@/components/shared/TableEmptyState";
import { FileText } from "lucide-react";

interface PurchaseOrder {
  id: string;
  orderNumber: string;
  itemName: string;
  quantityOrdered: number;
  manufacturer: string;
  vendorName: string;
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
  const handleStatusChange = async (
    orderId: string,
    newStatus: "DELIVERED" | "CANCELLED"
  ) => {
    try {
      await axios.patch(
        `${process.env.NEXT_PUBLIC_API_BASE_URL}/pharmacist/${orderId}/purchase-order-status`,
        { status: newStatus }
      );

      setPurchaseOrders((prevOrders) =>
        prevOrders.map((order) =>
          order.id === orderId ? { ...order, status: newStatus } : order
        )
      );

      if (newStatus === "DELIVERED") {
        dispatchLowStockInvalidated();
      }

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
      cell: ({ row }) => (
        <div className="font-medium">{row.getValue("orderNumber")}</div>
      ),
    },
    {
      accessorKey: "itemName",
      header: "Item",
    },
    {
      accessorKey: "quantityOrdered",
      header: "Quantity",
    },
    {
      accessorKey: "vendorName",
      header: "Vendor",
    },
    {
      accessorKey: "manufacturer",
      header: "Mfg. (product)",
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
      enableSorting: false,
      cell: ({ row }) => {
        const order = row.original;
        if (order.status !== "PENDING") return null;

        return (
          <div onClick={(e) => e.stopPropagation()} onKeyDown={(e) => e.stopPropagation()}>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" size="sm" type="button">
                  Actions
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" onClick={(e) => e.stopPropagation()}>
                <DropdownMenuItem
                  onSelect={() => handleStatusChange(order.id, "DELIVERED")}
                  className="text-green-600 focus:bg-green-50"
                >
                  <CheckCircle className="mr-2 h-4 w-4" />
                  Mark as Delivered
                </DropdownMenuItem>
                <DropdownMenuItem
                  onSelect={() => handleStatusChange(order.id, "CANCELLED")}
                  className="text-red-600 focus:bg-red-50"
                >
                  <XCircle className="mr-2 h-4 w-4" />
                  Cancel Order
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        );
      },
    },
  ];

  const table = useReactTable({
    data: purchaseOrders,
    columns,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    initialState: {
      pagination: { pageSize: 5 },
      sorting: [{ id: "itemName", desc: false }],
    },
  });

  useEffect(() => {
    const fetchPurchaseOrders = async () => {
      try {
        setLoading(true);
        const { data } = await axios.get(
          `${process.env.NEXT_PUBLIC_API_BASE_URL}/pharmacist/purchase-orders`
        );

        const transformedData = data.map((order: any) => ({
          ...order,
          itemName: order.inventoryItem?.name || "N/A",
          manufacturer: order.manufacturer?.companyName || "N/A",
          vendorName: order.vendor?.name || "—",
          orderNumber: `PO-${new Date(
            order.createdAt
          ).getFullYear()}-${order.id.slice(-4)}`,
        }));

        setPurchaseOrders(transformedData);
      } catch (error) {
        console.error("Error fetching purchase orders:", error);
        setError(
          axios.isAxiosError(error)
            ? error.response?.data?.message || "Failed to load orders"
            : "Failed to load orders"
        );
      } finally {
        setLoading(false);
      }
    };

    fetchPurchaseOrders();
  }, []);

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
        <header className="mb-6 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <motion.h1
              className="text-2xl sm:text-3xl font-bold text-red-800 tracking-tight"
              initial={{ opacity: 0, y: -8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4 }}
            >
              Purchase Orders
            </motion.h1>
            <motion.p className="mt-1 text-sm text-gray-500" initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.1 }}>
              View and manage purchase orders.
            </motion.p>
            <div className="mt-4 h-px bg-gradient-to-r from-red-200/80 via-red-100/50 to-transparent rounded-full" />
          </div>
          <Button
            type="button"
            className="bg-red-800 hover:bg-red-700 text-white shadow-sm"
            onClick={() => window.location.assign("/pharmacist/purchase-orders/company-print")}
          >
            Print Company-wise Orders
          </Button>
        </header>

        <Card className="overflow-hidden bg-white border border-gray-100 rounded-xl shadow-sm hover:shadow-md transition-shadow">
          <div className="border-l-4 border-l-red-500 bg-red-50/30 px-5 py-3">
            <h2 className="text-base font-semibold text-red-800">Purchase orders</h2>
            <p className="text-xs text-gray-500 mt-0.5">
              Click a row to view details and update status.
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
            ) : purchaseOrders.length === 0 ? (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="flex flex-col items-center justify-center py-12 px-4 rounded-lg bg-gray-50/80"
              >
                <div className="h-14 w-14 rounded-full bg-gray-100 flex items-center justify-center mb-3">
                  <AlertCircle className="h-7 w-7 text-gray-400" />
                </div>
                <p className="text-sm font-medium text-gray-600">No purchase orders</p>
                <p className="text-xs text-gray-500 mt-0.5">
                  There are no purchase orders yet. Create one from the low stock page.
                </p>
              </motion.div>
            ) : (
              <div className="rounded-lg border border-gray-100 overflow-hidden">
                <Table wrapperClassName={purchaseOrders.length > 0 ? "min-h-[260px]" : undefined}>
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
                        <TableRow
                          key={row.id}
                          onClick={() => handleRowClick(row.original)}
                          className="cursor-pointer"
                        >
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
                          icon={FileText}
                          title="No purchase orders"
                          description="There are no purchase orders yet. Create one from the low stock page."
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

      {/* Order Details Dialog - Would be expanded with more details in a real application */}
      <Dialog open={!!selectedRow} onOpenChange={closeModal}>
        <DialogContent className="sm:max-w-[700px] md:max-w-[900px] w-full p-6">
          <DialogHeader className="mb-4">
            <DialogTitle className="text-2xl font-bold">
              Purchase Order Details
            </DialogTitle>
          </DialogHeader>

          {selectedRow && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-6">
                <div>
                  <h4 className="text-base font-medium text-muted-foreground mb-2">
                    Order Number
                  </h4>
                  <p className="text-lg font-semibold">
                    {selectedRow.orderNumber}
                  </p>
                </div>
                <div>
                  <h4 className="text-base font-medium text-muted-foreground mb-2">
                    Status
                  </h4>
                  <StatusBadge status={selectedRow.status} />
                </div>
                <div>
                  <h4 className="text-base font-medium text-muted-foreground mb-2">
                    Item
                  </h4>
                  <p className="text-lg">{selectedRow.itemName}</p>
                </div>
                <div>
                  <h4 className="text-base font-medium text-muted-foreground mb-2">
                    Quantity
                  </h4>
                  <p className="text-lg">{selectedRow.quantityOrdered} units</p>
                </div>
                <div>
                  <h4 className="text-base font-medium text-muted-foreground mb-2">
                    Vendor
                  </h4>
                  <p className="text-lg">{selectedRow.vendorName}</p>
                </div>
                <div>
                  <h4 className="text-base font-medium text-muted-foreground mb-2">
                    Manufacturer (product)
                  </h4>
                  <p className="text-lg">{selectedRow.manufacturer}</p>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-6 mt-4"></div>

              <div>
                <h4 className="text-base font-medium text-muted-foreground mb-2">
                  Date Created
                </h4>
                <p className="text-lg">{formatDate(selectedRow.createdAt)}</p>
              </div>

              {selectedRow.status === "PENDING" && (
                <div className="flex justify-end space-x-4 pt-6">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => {
                      handleStatusChange(selectedRow.id, "CANCELLED");
                      closeModal();
                    }}
                    className="text-red-600 border-red-200 hover:bg-red-50 px-6 py-2 text-base"
                  >
                    <XCircle className="mr-2 h-5 w-5" />
                    Cancel Order
                  </Button>
                  <Button
                    type="button"
                    onClick={() => {
                      handleStatusChange(selectedRow.id, "DELIVERED");
                      closeModal();
                    }}
                    className="bg-green-600 hover:bg-green-700 text-white px-6 py-2 text-base"
                  >
                    <CheckCircle className="mr-2 h-5 w-5" />
                    Mark as Completed
                  </Button>
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>
      </div>
    </div>
  );
}
