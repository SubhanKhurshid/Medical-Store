"use client";

import { useCallback, useEffect, useState } from "react";
import axios from "axios";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import Loading from "@/components/shared/Loading";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { AlertCircle, Printer } from "lucide-react";
import { useAuth } from "@/app/providers/AuthProvider";

const ALL_VENDORS = "__all__";

interface Vendor {
  id: string;
  name: string;
}

interface CompanyPurchaseOrder {
  id: string;
  quantityOrdered: number;
  status: "PENDING" | "DELIVERED" | "CANCELLED";
  orderDate: string;
  inventoryItem: {
    id: string;
    name: string;
    barcode?: string | null;
  };
  manufacturer: {
    id: string;
    companyName: string;
  };
  vendor?: {
    id: string;
    name: string;
  } | null;
}

function statusBadge(status: CompanyPurchaseOrder["status"]) {
  switch (status) {
    case "PENDING":
      return (
        <Badge className="bg-yellow-100 text-yellow-800 hover:bg-yellow-100 text-[10px]">
          Pending
        </Badge>
      );
    case "DELIVERED":
      return (
        <Badge className="bg-green-100 text-green-800 hover:bg-green-100 text-[10px]">
          Delivered
        </Badge>
      );
    case "CANCELLED":
      return (
        <Badge className="bg-red-100 text-red-800 hover:bg-red-100 text-[10px]">
          Cancelled
        </Badge>
      );
    default:
      return <Badge variant="secondary">{status}</Badge>;
  }
}

function dateRangeLabel(from: string, to: string): string {
  if (!from && !to) return "All dates (full history)";
  if (from && to) return `${from} → ${to}`;
  if (from) return `From ${from}`;
  return `Until ${to}`;
}

export default function CompanyPurchaseOrderPrintPage() {
  const router = useRouter();
  const { user } = useAuth();
  const [vendors, setVendors] = useState<Vendor[]>([]);
  const [selectedVendorId, setSelectedVendorId] = useState<string>(ALL_VENDORS);
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const [orders, setOrders] = useState<CompanyPurchaseOrder[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingOrders, setLoadingOrders] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const headers = user?.access_token
    ? { Authorization: `Bearer ${user.access_token}` }
    : undefined;

  const dateRangeInvalid = Boolean(dateFrom && dateTo && dateFrom > dateTo);

  useEffect(() => {
    const loadVendors = async () => {
      try {
        setLoading(true);
        const { data } = await axios.get(
          `${process.env.NEXT_PUBLIC_API_BASE_URL}/pharmacist/vendor`,
          { headers },
        );
        const list = Array.isArray(data) ? data : [];
        setVendors(
          list.map((v: { id: string; name: string }) => ({
            id: v.id,
            name: v.name,
          })),
        );
        setError(null);
      } catch (err) {
        console.error(err);
        setError("Failed to load vendors");
        setVendors([]);
      } finally {
        setLoading(false);
      }
    };
    loadVendors();
  }, [user?.access_token]);

  const fetchOrders = useCallback(async () => {
    if (dateRangeInvalid) {
      setOrders([]);
      setError(null);
      return;
    }
    try {
      setLoadingOrders(true);
      const qs = new URLSearchParams();
      if (selectedVendorId && selectedVendorId !== ALL_VENDORS) {
        qs.set("vendorId", selectedVendorId);
      }
      if (dateFrom) qs.set("startDate", dateFrom);
      if (dateTo) qs.set("endDate", dateTo);
      const query = qs.toString() ? `?${qs.toString()}` : "";
      const { data } = await axios.get(
        `${process.env.NEXT_PUBLIC_API_BASE_URL}/pharmacist/purchase-orders/pending-for-print${query}`,
        { headers },
      );
      setOrders(data ?? []);
      setError(null);
    } catch (err) {
      console.error(err);
      if (axios.isAxiosError(err)) {
        setError(
          (err.response?.data as { message?: string })?.message ??
            "Failed to load purchase orders",
        );
      } else {
        setError("Failed to load purchase orders");
      }
      setOrders([]);
    } finally {
      setLoadingOrders(false);
    }
  }, [
    selectedVendorId,
    dateFrom,
    dateTo,
    dateRangeInvalid,
    user?.access_token,
  ]);

  useEffect(() => {
    if (!loading) {
      void fetchOrders();
    }
  }, [loading, fetchOrders]);

  const handlePrint = () => {
    window.print();
  };

  const formatDate = (iso: string) =>
    new Date(iso).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });

  const selectedVendor = vendors.find((v) => v.id === selectedVendorId);
  const vendorLabel =
    selectedVendorId === ALL_VENDORS
      ? "All vendors"
      : selectedVendor?.name ?? "Vendor";

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50/80">
        <Loading />
      </div>
    );
  }

  return (
    <div id="company-po-print-root" className="min-h-screen bg-gray-50/80 print:bg-white">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8 print:px-0 print:py-0">
        <header className="mb-6 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 print:hidden">
          <div>
            <motion.h1
              className="text-2xl sm:text-3xl font-bold text-red-800 tracking-tight"
              initial={{ opacity: 0, y: -8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4 }}
            >
              Print purchase orders
            </motion.h1>
            <motion.p
              className="mt-1 text-sm text-gray-500"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.1 }}
            >
              All statuses (pending, delivered, cancelled). Filter by vendor and order date.
            </motion.p>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" onClick={() => router.back()}>
              Back
            </Button>
            <Button
              className="bg-red-800 hover:bg-red-700 text-white"
              onClick={handlePrint}
              disabled={!orders.length || dateRangeInvalid}
            >
              <Printer className="mr-2 h-4 w-4" />
              Print
            </Button>
          </div>
        </header>

        <Card className="mb-6 print:hidden border border-gray-100">
          <CardContent className="p-4 sm:p-5">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              <div>
                <Label className="text-xs text-gray-600">Vendor</Label>
                <Select value={selectedVendorId} onValueChange={setSelectedVendorId}>
                  <SelectTrigger className="mt-1 h-10 border-gray-300">
                    <SelectValue placeholder="Select vendor" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value={ALL_VENDORS}>All vendors</SelectItem>
                    {vendors.map((v) => (
                      <SelectItem key={v.id} value={v.id}>
                        {v.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="po-from" className="text-xs text-gray-600">
                  From date
                </Label>
                <Input
                  id="po-from"
                  type="date"
                  value={dateFrom}
                  onChange={(e) => setDateFrom(e.target.value)}
                  className="mt-1 h-10 border-gray-300"
                />
              </div>
              <div>
                <Label htmlFor="po-to" className="text-xs text-gray-600">
                  To date
                </Label>
                <Input
                  id="po-to"
                  type="date"
                  value={dateTo}
                  onChange={(e) => setDateTo(e.target.value)}
                  className="mt-1 h-10 border-gray-300"
                />
              </div>
            </div>
            {dateRangeInvalid && (
              <p className="text-sm text-amber-800 bg-amber-50 border border-amber-100 rounded-lg px-3 py-2 mt-3">
                From date must be on or before To date.
              </p>
            )}
            <p className="text-xs text-gray-500 mt-3">
              Leave dates empty for full history. {dateRangeLabel(dateFrom, dateTo)}.
            </p>
          </CardContent>
        </Card>

        <Card className="bg-white border border-gray-100 rounded-xl shadow-sm print:shadow-none print:border print:border-black/40">
          <CardContent className="p-4 sm:p-5 print:p-4">
            <div className="mb-4 border-b border-gray-200 pb-3 text-center">
              <h1 className="text-xl font-bold tracking-wide text-gray-900 print:text-lg">
                NS Ibrahim Medical Store
              </h1>
              <p className="text-xs text-gray-600">Purchase Orders Report</p>
              <p className="mt-1 text-[11px] text-gray-500">
                Printed on{" "}
                {new Date().toLocaleDateString("en-US", {
                  year: "numeric",
                  month: "short",
                  day: "numeric",
                })}
              </p>
            </div>

            <div className="mb-4 text-sm">
              <p>
                <span className="font-semibold text-gray-700">Vendor: </span>
                {vendorLabel}
              </p>
              <p>
                <span className="font-semibold text-gray-700">Period: </span>
                {dateRangeLabel(dateFrom, dateTo)}
              </p>
              <p className="text-xs text-gray-500 mt-1">
                {orders.length} order{orders.length !== 1 ? "s" : ""} in this report
              </p>
            </div>

            {error && (
              <Alert variant="destructive" className="mb-4 print:hidden">
                <AlertCircle className="h-4 w-4" />
                <AlertTitle>Error</AlertTitle>
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}

            {loadingOrders ? (
              <div className="py-10 flex items-center justify-center">
                <Loading />
              </div>
            ) : !orders.length ? (
              <div className="py-12 text-center text-sm text-gray-500">
                No purchase orders match these filters.
              </div>
            ) : (
              <div className="border border-gray-200 rounded-md overflow-hidden">
                <Table>
                  <TableHeader className="bg-gray-50 print:bg-gray-100">
                    <TableRow>
                      {selectedVendorId === ALL_VENDORS && (
                        <TableHead className="text-xs font-semibold text-gray-700">
                          Vendor
                        </TableHead>
                      )}
                      <TableHead className="text-xs font-semibold text-gray-700">
                        Item
                      </TableHead>
                      <TableHead className="text-xs font-semibold text-gray-700">
                        Mfg.
                      </TableHead>
                      <TableHead className="text-xs font-semibold text-gray-700">
                        Status
                      </TableHead>
                      <TableHead className="text-xs font-semibold text-gray-700">
                        Qty
                      </TableHead>
                      <TableHead className="text-xs font-semibold text-gray-700">
                        Order Date
                      </TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {orders.map((order) => (
                      <TableRow key={order.id}>
                        {selectedVendorId === ALL_VENDORS && (
                          <TableCell className="text-xs">
                            {order.vendor?.name ?? "—"}
                          </TableCell>
                        )}
                        <TableCell className="text-xs">
                          {order.inventoryItem?.name ?? "N/A"}
                        </TableCell>
                        <TableCell className="text-xs">
                          {order.manufacturer?.companyName ?? "—"}
                        </TableCell>
                        <TableCell className="text-xs print:[&_*]:border-0">
                          <span className="print:hidden">{statusBadge(order.status)}</span>
                          <span className="hidden print:inline capitalize text-[10px]">
                            {order.status.toLowerCase()}
                          </span>
                        </TableCell>
                        <TableCell className="text-xs">
                          {order.quantityOrdered}
                        </TableCell>
                        <TableCell className="text-xs">
                          {formatDate(order.orderDate)}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      <style jsx global>{`
        @media print {
          @page {
            size: A4 portrait;
            margin: 12mm;
          }

          body {
            background: white !important;
          }

          body * {
            visibility: hidden;
          }

          #company-po-print-root,
          #company-po-print-root * {
            visibility: visible;
          }

          #company-po-print-root {
            margin: 0 !important;
            padding: 0 !important;
          }
        }
      `}</style>
    </div>
  );
}
