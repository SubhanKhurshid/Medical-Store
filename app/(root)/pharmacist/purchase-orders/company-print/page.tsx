"use client";

import { useCallback, useEffect, useState } from "react";
import axios from "axios";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { format } from "date-fns";
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
import Loading from "@/components/shared/Loading";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { AlertCircle, Download } from "lucide-react";
import { toast } from "sonner";
import { useAuth } from "@/app/providers/AuthProvider";
import { fetchAllPaginatedListAxios } from "@/lib/api";
import type { Styles } from "jspdf-autotable";

const ALL_VENDORS = "__all__";
const ALL_STATUSES = "__all__";

const STATUS_OPTIONS = [
  { value: ALL_STATUSES, label: "All statuses" },
  { value: "PENDING", label: "Pending" },
  { value: "DELIVERED", label: "Delivered" },
  { value: "CANCELLED", label: "Cancelled" },
] as const;

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

function dateRangeLabel(from: string, to: string): string {
  if (!from && !to) return "All time";
  if (from && to) return `${from} → ${to}`;
  if (from) return `From ${from}`;
  return `Until ${to}`;
}

function formatStatus(status: CompanyPurchaseOrder["status"]) {
  return status.charAt(0) + status.slice(1).toLowerCase();
}

export default function CompanyPurchaseOrderPrintPage() {
  const router = useRouter();
  const { user } = useAuth();
  const [vendors, setVendors] = useState<Vendor[]>([]);
  const [selectedVendorId, setSelectedVendorId] = useState<string>(ALL_VENDORS);
  const [selectedStatus, setSelectedStatus] = useState<string>(ALL_STATUSES);
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const [orders, setOrders] = useState<CompanyPurchaseOrder[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingOrders, setLoadingOrders] = useState(false);
  const [exportingPdf, setExportingPdf] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const headers = user?.access_token
    ? { Authorization: `Bearer ${user.access_token}` }
    : undefined;

  const dateRangeInvalid = Boolean(dateFrom && dateTo && dateFrom > dateTo);

  useEffect(() => {
    const loadVendors = async () => {
      try {
        setLoading(true);
        const list = await fetchAllPaginatedListAxios<{ id: string; name: string }>(
          `${process.env.NEXT_PUBLIC_API_BASE_URL}/pharmacist/vendor`,
          { headers: headers as Record<string, string> },
        );
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
      if (selectedStatus && selectedStatus !== ALL_STATUSES) {
        qs.set("status", selectedStatus);
      }
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
    selectedStatus,
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

  const formatDate = (iso: string) =>
    new Date(iso).toLocaleDateString("en-GB");

  const selectedVendor = vendors.find((v) => v.id === selectedVendorId);
  const vendorLabel =
    selectedVendorId === ALL_VENDORS
      ? "All vendors"
      : selectedVendor?.name ?? "Vendor";

  const statusLabel =
    STATUS_OPTIONS.find((s) => s.value === selectedStatus)?.label ??
    "All statuses";

  const exportPdf = useCallback(async () => {
    if (dateRangeInvalid) {
      toast.error("From date must be on or before To date.");
      return;
    }
    if (!orders.length) {
      toast.error("No purchase orders to export.");
      return;
    }
    setExportingPdf(true);
    try {
      const [{ default: jsPDF }, { default: autoTable }] = await Promise.all([
        import("jspdf"),
        import("jspdf-autotable"),
      ]);
      const doc = new jsPDF({ orientation: "landscape", unit: "pt", format: "a4" });
      const margin = 40;
      let y = margin;
      const includeVendor = selectedVendorId === ALL_VENDORS;

      doc.setFontSize(15);
      doc.setTextColor(127, 29, 29);
      doc.text("Purchase orders", margin, y);
      y += 20;
      doc.setFontSize(10);
      doc.setTextColor(60, 60, 60);
      doc.text(`Vendor: ${vendorLabel}`, margin, y);
      y += 14;
      doc.text(`Status: ${statusLabel}`, margin, y);
      y += 14;
      doc.text(`Range: ${dateRangeLabel(dateFrom, dateTo)}`, margin, y);
      y += 14;
      doc.text(`Generated: ${new Date().toLocaleString("en-GB")}`, margin, y);
      y += 20;

      const totalQty = orders.reduce((sum, o) => sum + (o.quantityOrdered || 0), 0);
      const qtyColIndex = includeVendor ? 4 : 3;
      const head = includeVendor
        ? [["Vendor", "Item", "Manufacturer", "Status", "Qty", "Order date"]]
        : [["Item", "Manufacturer", "Status", "Qty", "Order date"]];
      const body = orders.map((order) => {
        const row = [
          order.inventoryItem?.name ?? "N/A",
          order.manufacturer?.companyName ?? "—",
          formatStatus(order.status),
          String(order.quantityOrdered),
          formatDate(order.orderDate),
        ];
        return includeVendor
          ? [order.vendor?.name ?? "—", ...row]
          : row;
      });

      const columnStyles: Record<string, Partial<Styles>> = includeVendor
        ? {
            0: { cellWidth: 90 },
            1: { cellWidth: 130 },
            2: { cellWidth: 120 },
            3: { cellWidth: 72 },
            4: { cellWidth: 56, halign: "right" },
            5: { cellWidth: 80 },
          }
        : {
            0: { cellWidth: 150 },
            1: { cellWidth: 130 },
            2: { cellWidth: 72 },
            3: { cellWidth: 56, halign: "right" },
            4: { cellWidth: 80 },
          };

      autoTable(doc, {
        head,
        body,
        foot: [
          includeVendor
            ? ["Total", "—", "—", "—", String(totalQty), `${orders.length} order(s)`]
            : ["Total", "—", "—", String(totalQty), `${orders.length} order(s)`],
        ],
        startY: y,
        styles: { fontSize: 9, cellPadding: 6, overflow: "linebreak" },
        headStyles: { fillColor: [185, 28, 28], textColor: 255, fontStyle: "bold" },
        footStyles: { fillColor: [243, 244, 246], textColor: 17, fontStyle: "bold" },
        margin: { left: margin, right: margin },
        columnStyles,
        didParseCell: (hookData) => {
          if (hookData.column.index === qtyColIndex) {
            hookData.cell.styles.halign = "right";
          }
        },
      });

      doc.save(`purchase-orders-${format(new Date(), "yyyy-MM-dd")}.pdf`);
    } catch (e) {
      console.error(e);
      toast.error("Could not create PDF.");
    } finally {
      setExportingPdf(false);
    }
  }, [
    orders,
    dateRangeInvalid,
    selectedVendorId,
    vendorLabel,
    statusLabel,
    dateFrom,
    dateTo,
  ]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50/80">
        <Loading />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50/80">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
        <header className="mb-6 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
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
              Filter by vendor, status, and date. Export matches other report PDFs.
            </motion.p>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" onClick={() => router.back()}>
              Back
            </Button>
            <Button
              variant="outline"
              className="border-red-200 text-red-800 hover:bg-red-50"
              onClick={() => void exportPdf()}
              disabled={!orders.length || dateRangeInvalid || exportingPdf}
            >
              <Download className="mr-2 h-4 w-4" />
              {exportingPdf ? "Preparing…" : "Export PDF"}
            </Button>
          </div>
        </header>

        <Card className="mb-6 border border-gray-100">
          <CardContent className="p-4 sm:p-5">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
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
                <Label className="text-xs text-gray-600">Status</Label>
                <Select value={selectedStatus} onValueChange={setSelectedStatus}>
                  <SelectTrigger className="mt-1 h-10 border-gray-300">
                    <SelectValue placeholder="All statuses" />
                  </SelectTrigger>
                  <SelectContent>
                    {STATUS_OPTIONS.map((s) => (
                      <SelectItem key={s.value} value={s.value}>
                        {s.label}
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

        <Card className="overflow-hidden bg-white border border-gray-100 rounded-xl shadow-sm">
          <div className="border-l-4 border-l-red-500 bg-red-50/30 px-5 py-3">
            <h2 className="text-base font-semibold text-red-800">Purchase orders</h2>
            <p className="text-xs text-gray-500 mt-0.5">
              {vendorLabel} · {statusLabel} · {dateRangeLabel(dateFrom, dateTo)} ·{" "}
              {orders.length} order{orders.length !== 1 ? "s" : ""}
            </p>
          </div>
          <CardContent className="p-4 sm:p-5">
            {error && (
              <Alert variant="destructive" className="mb-4">
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
                  <TableHeader className="bg-gray-50">
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
                        <TableCell className="text-xs capitalize">
                          {formatStatus(order.status)}
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
    </div>
  );
}
