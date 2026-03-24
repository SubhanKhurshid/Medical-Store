"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { DataTable } from "@/components/shared/DataTable";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { motion, AnimatePresence } from "framer-motion";
import { Search, Eye, RotateCcw, Download } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/app/providers/AuthProvider";
import { useInventory } from "@/app/context/InventoryContext";
import axios from "axios";
import { toast } from "sonner";
import Loading from "@/components/shared/Loading";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  format,
  startOfDay,
  endOfDay,
  startOfMonth,
  endOfMonth,
  startOfYear,
  endOfYear,
} from "date-fns";

const PAYMENT_LABELS: Record<string, string> = {
  CASH: "Cash",
  CARD: "Card",
  ONLINE: "Online",
  DONATION: "Donation",
  CREDIT: "Credit",
};

type DateRangeMode = "all" | "day" | "month" | "year" | "custom";

interface Sale {
  id: string;
  invoiceNumber?: string | null;
  quantity: number;
  salePrice: number;
  totalPrice: number;
  discount?: number;
  refundedAmount?: number;
  paymentMethod?: string;
  soldAt: string;
  customerName?: string | null;
  customerPhone?: string | null;
  saleItems: {
    id: string;
    quantity: number;
    salePrice: number;
    totalPrice: number;
    inventoryItemId: string;
    inventoryItem: {
      id: string;
      name: string;
      type: string;
      price: number;
    } | null;
  }[];
}

function apiRange(
  mode: DateRangeMode,
  customFrom: string,
  customTo: string,
): { start?: string; end?: string } | null {
  const now = new Date();
  switch (mode) {
    case "all":
      return {};
    case "day":
      return {
        start: format(startOfDay(now), "yyyy-MM-dd"),
        end: format(endOfDay(now), "yyyy-MM-dd"),
      };
    case "month":
      return {
        start: format(startOfMonth(now), "yyyy-MM-dd"),
        end: format(endOfMonth(now), "yyyy-MM-dd"),
      };
    case "year":
      return {
        start: format(startOfYear(now), "yyyy-MM-dd"),
        end: format(endOfYear(now), "yyyy-MM-dd"),
      };
    case "custom":
      if (!customFrom || !customTo) return null;
      return { start: customFrom, end: customTo };
    default:
      return {};
  }
}

function rangeDescription(
  mode: DateRangeMode,
  customFrom: string,
  customTo: string,
): string {
  const r = apiRange(mode, customFrom, customTo);
  if (r === null) return "Select both dates";
  if (!r.start && !r.end) return "All time";
  return `${r.start ?? "…"} → ${r.end ?? "…"}`;
}

const SalesTable = () => {
  const [search, setSearch] = useState("");
  const [paymentFilter, setPaymentFilter] = useState<
    "ALL" | "CASH" | "CARD" | "ONLINE" | "DONATION" | "CREDIT"
  >("ALL");
  const [dateRangeMode, setDateRangeMode] = useState<DateRangeMode>("month");
  const [customFrom, setCustomFrom] = useState("");
  const [customTo, setCustomTo] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [sales, setSales] = useState<Sale[]>([]);
  const [viewSale, setViewSale] = useState<Sale | null>(null);
  const [refundSale, setRefundSale] = useState<Sale | null>(null);
  const [refundQuantities, setRefundQuantities] = useState<Record<string, number>>({});
  const [refundReason, setRefundReason] = useState("");
  const [refundSubmitting, setRefundSubmitting] = useState(false);
  const [exportingPdf, setExportingPdf] = useState(false);
  const { user } = useAuth();
  const accessToken = user?.access_token;
  const { refetchInventory } = useInventory();

  const loadSales = useCallback(async () => {
    if (!accessToken) return;
    const range = apiRange(dateRangeMode, customFrom, customTo);
    if (range === null) {
      setSales([]);
      setLoading(false);
      setError(null);
      return;
    }
    try {
      setLoading(true);
      setError(null);
      const queryParams = new URLSearchParams();
      if (range.start) queryParams.append("startDate", range.start);
      if (range.end) queryParams.append("endDate", range.end);

      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_BASE_URL}/pharmacist/sales?${queryParams}`,
        { headers: { Authorization: `Bearer ${accessToken}` } },
      );
      const result = await response.json().catch(() => null);

      if (!response.ok) {
        const msg =
          typeof result?.message === "string"
            ? result.message
            : Array.isArray(result?.message)
              ? result.message.join(", ")
              : "Failed to load sales.";
        setSales([]);
        setError(msg);
        return;
      }

      if (result?.success && Array.isArray(result.data)) {
        setSales(result.data);
      } else {
        setSales([]);
        setError("Unexpected response from server.");
      }
    } catch (e) {
      console.error(e);
      setSales([]);
      setError("Network error while loading sales.");
    } finally {
      setLoading(false);
    }
  }, [accessToken, dateRangeMode, customFrom, customTo]);

  useEffect(() => {
    void loadSales();
  }, [loadSales]);

  const displaySales = useMemo(() => {
    let rows = sales;
    if (paymentFilter !== "ALL") {
      rows = rows.filter((s) => s.paymentMethod === paymentFilter);
    }
    if (search.trim()) {
      const s = search.toLowerCase();
      rows = rows.filter(
        (sale) =>
          (sale.invoiceNumber ?? "").toLowerCase().includes(s) ||
          (sale.customerName ?? "").toLowerCase().includes(s) ||
          (sale.customerPhone ?? "").toLowerCase().includes(s),
      );
    }
    return rows;
  }, [sales, paymentFilter, search]);

  const formatCurrency = useCallback(
    (n: number) =>
      new Intl.NumberFormat("en-PK", {
        style: "currency",
        currency: "PKR",
        maximumFractionDigits: 0,
      }).format(n),
    [],
  );

  const exportPdf = useCallback(async () => {
    if (!displaySales.length) {
      toast.error("No rows to export.");
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
      doc.setFontSize(15);
      doc.setTextColor(127, 29, 29);
      doc.text("Sales history", margin, y);
      y += 20;
      doc.setFontSize(10);
      doc.setTextColor(60, 60, 60);
      doc.text(`Range: ${rangeDescription(dateRangeMode, customFrom, customTo)}`, margin, y);
      y += 14;
      doc.text(`Payment filter: ${paymentFilter === "ALL" ? "All" : paymentFilter}`, margin, y);
      y += 14;
      doc.text(`Generated: ${new Date().toLocaleString("en-GB")}`, margin, y);
      y += 20;

      const body = displaySales.map((s) => {
        const refunded = Number(s.refundedAmount) || 0;
        return [
          s.invoiceNumber ?? "—",
          new Date(s.soldAt).toLocaleString("en-GB"),
          s.customerName ?? "—",
          s.customerPhone ?? "—",
          PAYMENT_LABELS[s.paymentMethod as string] ?? s.paymentMethod ?? "—",
          formatCurrency(s.totalPrice),
          refunded > 0 ? formatCurrency(refunded) : "—",
        ];
      });

      autoTable(doc, {
        head: [["Invoice #", "Date", "Customer", "Phone", "Payment", "Total", "Refunded"]],
        body,
        startY: y,
        styles: { fontSize: 8, cellPadding: 5 },
        headStyles: { fillColor: [185, 28, 28], textColor: 255 },
        margin: { left: margin, right: margin },
      });

      doc.save(`sales-history-${format(new Date(), "yyyy-MM-dd")}.pdf`);
    } catch (e) {
      console.error(e);
      toast.error("Could not create PDF.");
    } finally {
      setExportingPdf(false);
    }
  }, [customFrom, customTo, dateRangeMode, displaySales, formatCurrency, paymentFilter]);

  const fetchSaleById = async (id: string) => {
    try {
      const { data } = await axios.get(
        `${process.env.NEXT_PUBLIC_API_BASE_URL}/pharmacist/sales/${id}`,
        { headers: { Authorization: `Bearer ${accessToken}` } },
      );
      setViewSale(data);
    } catch (e: unknown) {
      const err = e as { response?: { data?: { message?: string } } };
      toast.error(err.response?.data?.message ?? "Failed to load sale");
    }
  };

  const openRefundModal = (sale: Sale) => {
    setRefundSale(sale);
    const q: Record<string, number> = {};
    sale.saleItems.forEach((si) => {
      q[si.id] = 0;
    });
    setRefundQuantities(q);
    setRefundReason("");
  };

  const handleRefundSubmit = async () => {
    if (!refundSale || !accessToken) return;
    const items = Object.entries(refundQuantities)
      .filter(([, q]) => q > 0)
      .map(([saleItemId, quantity]) => ({ saleItemId, quantity }));
    if (items.length === 0) {
      toast.error("Select at least one item and quantity to refund.");
      return;
    }
    setRefundSubmitting(true);
    try {
      await axios.post(
        `${process.env.NEXT_PUBLIC_API_BASE_URL}/pharmacist/sales/${refundSale.id}/refund`,
        { items, reason: refundReason || undefined },
        { headers: { Authorization: `Bearer ${accessToken}` } },
      );
      toast.success("Refund processed successfully.");
      setRefundSale(null);
      refetchInventory();
      await loadSales();
    } catch (e: unknown) {
      const err = e as { response?: { data?: { message?: string } } };
      toast.error(err.response?.data?.message ?? "Refund failed.");
    } finally {
      setRefundSubmitting(false);
    }
  };

  const columns = [
    {
      id: "invoiceNumber",
      header: "Invoice #",
      cell: ({ row }: { row: { original: Sale } }) => (
        <span className="font-medium font-mono text-foreground">
          {row.original.invoiceNumber || "—"}
        </span>
      ),
    },
    {
      id: "customerName",
      header: "Customer",
      cell: ({ row }: { row: { original: Sale } }) => (
        <span className="text-foreground">{row.original.customerName || "—"}</span>
      ),
    },
    {
      id: "customerPhone",
      header: "Phone",
      cell: ({ row }: { row: { original: Sale } }) => (
        <span className="text-muted-foreground">{row.original.customerPhone || "—"}</span>
      ),
    },
    {
      id: "soldAt",
      header: "Date",
      cell: ({ row }: { row: { original: Sale } }) => (
        <span className="text-muted-foreground">
          {new Date(row.original.soldAt).toLocaleDateString()}
        </span>
      ),
    },
    {
      id: "paymentMethod",
      header: "Payment",
      cell: ({ row }: { row: { original: Sale } }) => (
        <span className="text-foreground">
          {PAYMENT_LABELS[row.original.paymentMethod as string] ??
            row.original.paymentMethod ??
            "—"}
        </span>
      ),
    },
    {
      id: "totalPrice",
      header: "Total",
      cell: ({ row }: { row: { original: Sale } }) => {
        const refunded = Number(row.original.refundedAmount) || 0;
        return (
          <span className="font-medium text-foreground">
            Rs {row.original.totalPrice.toLocaleString()}
            {refunded > 0 && (
              <span className="text-amber-600 text-xs ml-1 font-normal">
                (refunded: Rs {refunded})
              </span>
            )}
          </span>
        );
      },
    },
    {
      id: "actions",
      header: "Actions",
      cell: ({ row }: { row: { original: Sale } }) => (
        <div className="flex gap-1.5">
          <Button
            variant="outline"
            size="sm"
            onClick={(e) => {
              e.stopPropagation();
              void fetchSaleById(row.original.id);
            }}
            className="text-red-700 border-red-200 hover:bg-red-50 h-8 text-xs"
          >
            <Eye className="h-3.5 w-3.5 mr-1" />
            View
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={(e) => {
              e.stopPropagation();
              openRefundModal(row.original);
            }}
            disabled={(Number(row.original.refundedAmount) || 0) >= row.original.totalPrice}
            className="text-amber-700 border-amber-200 hover:bg-amber-50 h-8 text-xs"
          >
            <RotateCcw className="h-3.5 w-3.5 mr-1" />
            Refund
          </Button>
        </div>
      ),
    },
  ];

  const customIncomplete = dateRangeMode === "custom" && (!customFrom || !customTo);

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
            Sales History
          </motion.h1>
          <motion.p
            className="mt-1 text-sm text-gray-500"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.1 }}
          >
            Filter by date range, payment method, and search. Export the current table to PDF.
          </motion.p>
          <div className="mt-4 h-px bg-gradient-to-r from-red-200/80 via-red-100/50 to-transparent rounded-full" />
        </header>

        <Card className="overflow-hidden bg-white border border-gray-100 rounded-xl shadow-sm hover:shadow-md transition-shadow mb-6">
          <div className="border-l-4 border-l-red-500 bg-red-50/30 px-5 py-3">
            <h2 className="text-base font-semibold text-red-800">Date range</h2>
            <p className="text-xs text-gray-500 mt-0.5">
              {rangeDescription(dateRangeMode, customFrom, customTo)}
            </p>
          </div>
          <CardContent className="p-4 sm:p-5 space-y-4">
            <div className="flex flex-wrap gap-2">
              {(
                [
                  ["all", "All time"],
                  ["day", "Today"],
                  ["month", "This month"],
                  ["year", "This year"],
                  ["custom", "Custom"],
                ] as const
              ).map(([key, label]) => (
                <Button
                  key={key}
                  type="button"
                  size="sm"
                  variant={dateRangeMode === key ? "default" : "outline"}
                  className={
                    dateRangeMode === key
                      ? "bg-red-800 hover:bg-red-700 text-white"
                      : "border-gray-200"
                  }
                  onClick={() => setDateRangeMode(key)}
                >
                  {label}
                </Button>
              ))}
            </div>
            {dateRangeMode === "custom" && (
              <div className="flex flex-wrap items-end gap-4">
                <div>
                  <Label className="text-xs text-gray-600">From</Label>
                  <Input
                    type="date"
                    value={customFrom}
                    onChange={(e) => setCustomFrom(e.target.value)}
                    className="mt-1 w-[160px]"
                  />
                </div>
                <div>
                  <Label className="text-xs text-gray-600">To</Label>
                  <Input
                    type="date"
                    value={customTo}
                    onChange={(e) => setCustomTo(e.target.value)}
                    className="mt-1 w-[160px]"
                  />
                </div>
              </div>
            )}
            {customIncomplete && (
              <p className="text-sm text-amber-800 bg-amber-50 border border-amber-100 rounded-lg px-3 py-2">
                Select both <strong>From</strong> and <strong>To</strong> to load sales.
              </p>
            )}
            {error && (
              <p className="text-sm text-red-700 bg-red-50 border border-red-100 rounded-lg px-3 py-2">
                {error}
              </p>
            )}
          </CardContent>
        </Card>

        <Card className="overflow-hidden bg-white border border-gray-100 rounded-xl shadow-sm hover:shadow-md transition-shadow">
          <div className="border-l-4 border-l-red-500 bg-red-50/30 px-5 py-3 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
            <div>
              <h2 className="text-base font-semibold text-red-800">Sales records</h2>
              <p className="text-xs text-gray-500 mt-0.5">
                Search by invoice, customer name, or phone. PDF matches filters below ({displaySales.length}{" "}
                rows).
              </p>
            </div>
            <Button
              type="button"
              variant="outline"
              size="sm"
              className="border-red-200 text-red-800 hover:bg-red-50 shrink-0"
              disabled={!displaySales.length || exportingPdf}
              onClick={() => void exportPdf()}
            >
              <Download className="h-4 w-4 mr-2" />
              {exportingPdf ? "PDF…" : "Export PDF"}
            </Button>
          </div>
          <CardContent className="p-4 sm:p-5">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
              <div>
                <Label className="text-xs font-medium text-gray-600">Search</Label>
                <div className="relative max-w-sm mt-1">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <Input
                    placeholder="Search sales..."
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    className="pl-9 h-10 border-gray-200 focus:border-red-500 focus:ring-red-500/20"
                  />
                </div>
              </div>

              <div>
                <Label className="text-xs font-medium text-gray-600">Payment filter</Label>
                <Select
                  value={paymentFilter}
                  onValueChange={(val) => setPaymentFilter(val as typeof paymentFilter)}
                >
                  <SelectTrigger className="mt-1 h-10 border-gray-200 focus:border-red-500 focus:ring-red-500/20">
                    <SelectValue placeholder="All payments" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="ALL">All</SelectItem>
                    <SelectItem value="CASH">Cash</SelectItem>
                    <SelectItem value="CARD">Card</SelectItem>
                    <SelectItem value="ONLINE">Online</SelectItem>
                    <SelectItem value="DONATION">Donation</SelectItem>
                    <SelectItem value="CREDIT">Credit</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            {loading ? (
              <div className="min-h-[280px] flex items-center justify-center">
                <Loading />
              </div>
            ) : (
              <AnimatePresence>
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ duration: 0.2 }}
                  className="rounded-lg border border-gray-100 overflow-hidden"
                >
                  <DataTable
                    columns={columns}
                    data={displaySales}
                    disableRowClick={true}
                  />
                </motion.div>
              </AnimatePresence>
            )}
          </CardContent>
        </Card>

        <Dialog open={!!viewSale} onOpenChange={() => setViewSale(null)}>
          <DialogContent className="max-w-lg max-h-[85vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle className="text-red-800">
                Sale {viewSale?.invoiceNumber ?? viewSale?.id}
              </DialogTitle>
            </DialogHeader>
            {viewSale && (
              <div className="space-y-3 text-sm">
                <div className="grid grid-cols-2 gap-2">
                  <span className="text-gray-500">Date</span>
                  <span>{new Date(viewSale.soldAt).toLocaleString()}</span>
                  <span className="text-gray-500">Customer</span>
                  <span>{viewSale.customerName || "—"}</span>
                  <span className="text-gray-500">Phone</span>
                  <span>{viewSale.customerPhone || "—"}</span>
                  <span className="text-gray-500">Payment</span>
                  <span>
                    {PAYMENT_LABELS[viewSale.paymentMethod as string] ??
                      viewSale.paymentMethod ??
                      "—"}
                  </span>
                  <span className="text-gray-500">Total</span>
                  <span>Rs {viewSale.totalPrice}</span>
                  {(Number(viewSale.refundedAmount) || 0) > 0 && (
                    <>
                      <span className="text-gray-500">Refunded</span>
                      <span className="text-amber-600">Rs {viewSale.refundedAmount}</span>
                    </>
                  )}
                </div>
                <div>
                  <p className="font-medium text-gray-700 mb-2">Items</p>
                  <ul className="border rounded p-2 space-y-1">
                    {viewSale.saleItems?.map((si) => (
                      <li key={si.id} className="flex justify-between">
                        <span>{si.inventoryItem?.name ?? si.inventoryItemId}</span>
                        <span>
                          {si.quantity} × Rs {si.salePrice} = Rs {si.totalPrice}
                        </span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            )}
          </DialogContent>
        </Dialog>

        <Dialog open={!!refundSale} onOpenChange={() => setRefundSale(null)}>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle className="text-red-800">Refund Sale</DialogTitle>
            </DialogHeader>
            {refundSale && (
              <div className="space-y-4">
                <p className="text-sm text-gray-600">
                  Invoice: {refundSale.invoiceNumber ?? refundSale.id}. Select quantities to refund.
                </p>
                <div className="space-y-2 max-h-48 overflow-y-auto">
                  {refundSale.saleItems.map((si) => (
                    <div key={si.id} className="flex items-center justify-between gap-2 border-b pb-2">
                      <span className="text-sm font-medium truncate flex-1">
                        {si.inventoryItem?.name ?? si.inventoryItemId}
                      </span>
                      <span className="text-xs text-gray-500">max: {si.quantity}</span>
                      <Input
                        type="number"
                        min={0}
                        max={si.quantity}
                        value={refundQuantities[si.id] ?? 0}
                        onChange={(e) =>
                          setRefundQuantities((prev) => ({
                            ...prev,
                            [si.id]: Math.min(
                              si.quantity,
                              Math.max(0, parseInt(e.target.value, 10) || 0),
                            ),
                          }))
                        }
                        className="w-20"
                      />
                    </div>
                  ))}
                </div>
                <div>
                  <Label>Reason (optional)</Label>
                  <Input
                    value={refundReason}
                    onChange={(e) => setRefundReason(e.target.value)}
                    placeholder="e.g. Returned by customer"
                    className="mt-1"
                  />
                </div>
              </div>
            )}
            <DialogFooter>
              <Button variant="outline" onClick={() => setRefundSale(null)}>
                Cancel
              </Button>
              <Button
                className="bg-red-800 hover:bg-red-900"
                onClick={() => void handleRefundSubmit()}
                disabled={refundSubmitting}
              >
                {refundSubmitting ? "Processing..." : "Process Refund"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
};

export default SalesTable;
