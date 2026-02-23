"use client";

import React, { useState } from "react";
import {
  ColumnDef,
  flexRender,
  getCoreRowModel,
  useReactTable,
  getPaginationRowModel,
  getSortedRowModel,
  SortingState,
} from "@tanstack/react-table";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Calendar, Package2, AlertCircle, X, Pill } from "lucide-react";

interface DataTableProps<TData, TValue> {
  columns: ColumnDef<TData, TValue>[];
  data: TData[];
}

export function DataTable<TData extends Record<string, any>, TValue>({
  columns,
  data,
}: DataTableProps<TData, TValue>) {
  const [sorting, setSorting] = useState<SortingState>([]);
  const [selectedRow, setSelectedRow] = useState<TData | null>(null);

  const table = useReactTable({
    data,
    columns,
    getCoreRowModel: getCoreRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    onSortingChange: setSorting,
    state: { sorting },
    // Limit rows per page to 4
    initialState: {
      pagination: {
        pageSize: 4,
      },
    },
  });

  const handleRowClick = (row: TData) => {
    setSelectedRow(row);
  };

  const closeModal = () => {
    setSelectedRow(null);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  };

  return (
    <div className="w-full">
      <div className="rounded-md border-none">
        <Table className="min-h-[400px]">
          {" "}
          {/* Ensuring consistent table height */}
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

      <Dialog open={!!selectedRow} onOpenChange={closeModal}>
        <DialogContent className="sm:max-w-[900px] p-0 overflow-hidden">
          <div className="flex flex-col md:flex-row h-full">
            {/* Image Section */}
            <div className="relative h-[200px] md:h-auto md:w-1/2">
              {selectedRow?.image ? (
                <img
                  src={selectedRow.image}
                  alt={selectedRow?.name || "Product"}
                  className="absolute inset-0 w-full h-full object-cover"
                />
              ) : (
                <div className="absolute inset-0 flex items-center justify-center bg-muted">
                  <Pill className="h-20 w-20 text-muted-foreground/20" />
                </div>
              )}
            </div>

            {/* Content Section */}
            <div className="p-6 md:w-1/2 overflow-y-auto max-h-[calc(100vh-2rem)]">
              <DialogHeader className="mb-6">
                <DialogTitle className="text-2xl font-bold">
                  {selectedRow?.name}
                </DialogTitle>
                <div className="flex flex-wrap items-center gap-2 mt-2">
                  <Badge variant="secondary" className="text-sm">
                    {selectedRow?.type}
                  </Badge>
                  {selectedRow?.quantity &&
                    selectedRow.quantity <=
                    (selectedRow?.minimumStock || 0) && (
                      <Badge variant="destructive" className="text-sm">
                        Low Stock
                      </Badge>
                    )}
                </div>
              </DialogHeader>

              <div className="space-y-6">
                {/* Main Details */}
                <div className="space-y-4">
                  <div>
                    <h4 className="text-sm font-medium text-muted-foreground mb-1">
                      Description
                    </h4>
                    <p className="text-sm">
                      {selectedRow?.description || "No description available"}
                    </p>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <h4 className="text-sm font-medium text-muted-foreground mb-1">
                        Quantity
                      </h4>
                      <p className="text-sm font-semibold">
                        {selectedRow?.quantity ?? selectedRow?.currentQuantity ?? "N/A"}
                      </p>
                    </div>
                    <div>
                      <h4 className="text-sm font-medium text-muted-foreground mb-1">
                        Price
                      </h4>
                      <p className="text-sm font-semibold">
                        PKR {selectedRow?.price}
                      </p>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <h4 className="text-sm font-medium text-muted-foreground mb-1">
                        Batch Number
                      </h4>
                      <p className="text-sm">{selectedRow?.batchNumber}</p>
                    </div>
                    <div>
                      <h4 className="text-sm font-medium text-muted-foreground mb-1">
                        Manufacturer
                      </h4>
                      <p className="text-sm">
                        {typeof selectedRow?.manufacturer === "object"
                          ? selectedRow?.manufacturer?.companyName
                          : selectedRow?.manufacturer || "N/A"}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Expiry Warning */}
                {selectedRow?.expiryDate && (
                  <div className="flex items-start gap-3 p-4 bg-muted rounded-lg">
                    <Calendar className="h-5 w-5 text-muted-foreground mt-0.5 flex-shrink-0" />
                    <div>
                      <h4 className="text-sm font-medium">Expiry Date</h4>
                      <p className="text-sm text-muted-foreground">
                        {formatDate(selectedRow.expiryDate)}
                      </p>
                    </div>
                  </div>
                )}

                {/* Stock Warning */}
                {selectedRow?.quantity &&
                  selectedRow.quantity <= (selectedRow?.minimumStock || 0) && (
                    <div className="flex items-start gap-3 p-4 bg-destructive/10 text-destructive rounded-lg">
                      <AlertCircle className="h-5 w-5 mt-0.5 flex-shrink-0" />
                      <div>
                        <h4 className="text-sm font-medium">
                          Low Stock Warning
                        </h4>
                        <p className="text-sm">
                          Current quantity ({selectedRow.quantity}) is below
                          minimum stock level ({selectedRow.minimumStock})
                        </p>
                      </div>
                    </div>
                  )}
              </div>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
