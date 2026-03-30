"use client";

import { useAuth } from "@/app/providers/AuthProvider";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { motion } from "framer-motion";
import { Package, ArrowLeft, Search, Download } from "lucide-react";
import Link from "next/link";
import { useCallback, useEffect, useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
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
import { format } from "date-fns";
import { toast } from "sonner";
import { sortByLocaleKey } from "@/lib/sort-alphabetical";
import { PDF_URDU_FONT_FAMILY, registerUrduFont } from "@/lib/jspdf-register-urdu-font";

interface StockReportData {
  summary: {
    totalItems: number;
    totalValueAtCost: number;
    totalValueAtSelling: number;
    totalNetProfit: number;
  };
  items: Array<{
    id: string;
    name: string;
    type: string;
    quantity: number;
    minimumStock: number;
    /** List purchase cost per unit (before manufacturer discount). */
    purchaseCostPerUnit: number;
    manufacturerDiscountPercent: number;
    /** Extra company discount % on cost after manufacturer discount. */
    specialCompanyDiscountPercent: number;
    /** Net purchase cost per unit after manufacturer and special company discounts. */
    netPurchaseCostPerUnit: number;
    /** List selling price per unit (before customer discount). */
    salePricePerUnit: number;
    customerDiscountPercent: number;
    /** Net sale price per unit after customer discount. */
    netSalePricePerUnit: number;
    /** quantity × net purchase cost per unit */
    valueAtCost: number;
    /** quantity × net sale price per unit */
    valueAtSelling: number;
    netProfit: number;
    manufacturer?: string;
    genericName?: string;
  }>;
  dateFilter?: {
    from: string | null;
    to: string | null;
    mode: "lastUpdatedInRange";
  } | null;
}

type StockRangeMode = "all" | "custom";

export default function StockReportPage() {
  const { user } = useAuth();
  const [data, setData] = useState<StockReportData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [fetchedAt, setFetchedAt] = useState<string>("");
  const [stockRangeMode, setStockRangeMode] = useState<StockRangeMode>("all");
  const [customFrom, setCustomFrom] = useState("");
  const [customTo, setCustomTo] = useState("");
  const [exportingPdf, setExportingPdf] = useState(false);

  const [searchTerm, setSearchTerm] = useState("");
  const [typeFilter, setTypeFilter] = useState("all");
  const [manufacturerFilter, setManufacturerFilter] = useState("all");

  const stockQuery = useMemo(() => {
    const params = new URLSearchParams();
    if (stockRangeMode === "custom" && customFrom && customTo) {
      params.set("from", customFrom);
      params.set("to", customTo);
    }
    return params.toString();
  }, [stockRangeMode, customFrom, customTo]);

  useEffect(() => {
    if (!user?.access_token) return;
    if (stockRangeMode === "custom" && (!customFrom || !customTo)) {
      setData(null);
      setLoading(false);
      setError(null);
      return;
    }

    const fetchData = async () => {
      setLoading(true);
      setError(null);
      try {
        const q = stockQuery ? `?${stockQuery}` : "";
        const res = await fetch(
          `${process.env.NEXT_PUBLIC_API_BASE_URL}/pharmacist/reports/stock${q}`,
          { headers: { Authorization: `Bearer ${user.access_token}` } },
        );
        const json = await res.json().catch(() => null);
        if (!res.ok) {
          setData(null);
          setError(
            typeof json?.message === "string"
              ? json.message
              : Array.isArray(json?.message)
                ? json.message.join(", ")
                : "Failed to load stock report.",
          );
          return;
        }
        setData(json);
        setFetchedAt(new Date().toLocaleString("en-GB"));
      } catch (e) {
        console.error(e);
        setData(null);
        setError("Network error.");
      } finally {
        setLoading(false);
      }
    };

    void fetchData();
  }, [user?.access_token, stockQuery, stockRangeMode, customFrom, customTo]);

  const manufacturers = useMemo<string[]>(() => {
    if (!data) return [];
    const set = new Set(data.items.map((i) => i.manufacturer).filter((m): m is string => !!m));
    return Array.from(set).sort();
  }, [data]);

  const types = useMemo<string[]>(() => {
    if (!data) return [];
    const set = new Set(data.items.map((i) => i.type).filter((t): t is string => !!t));
    return Array.from(set).sort();
  }, [data]);

  const filteredItems = useMemo(() => {
    if (!data) return [];
    const rows = data.items.filter((item) => {
      const matchesSearch =
        item.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.genericName?.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesType = typeFilter === "all" || item.type === typeFilter;
      const matchesManufacturer =
        manufacturerFilter === "all" || item.manufacturer === manufacturerFilter;
      return matchesSearch && matchesType && matchesManufacturer;
    });
    return sortByLocaleKey(rows, (item) => item.name);
  }, [data, searchTerm, typeFilter, manufacturerFilter]);

  const dynamicSummary = useMemo(() => {
    return {
      totalItems: filteredItems.length,
      totalQuantity: filteredItems.reduce((sum, item) => sum + item.quantity, 0),
      totalMinimumStock: filteredItems.reduce((sum, item) => sum + item.minimumStock, 0),
      totalValueAtCost: filteredItems.reduce((sum, item) => sum + item.valueAtCost, 0),
      totalValueAtSelling: filteredItems.reduce((sum, item) => sum + item.valueAtSelling, 0),
      totalNetProfit: filteredItems.reduce((sum, item) => {
        const line =
          item.netProfit ??
          (item.valueAtSelling ?? 0) - (item.valueAtCost ?? 0);
        return sum + line;
      }, 0),
    };
  }, [filteredItems]);

  const formatCurrency = useCallback(
    (n: number) =>
      new Intl.NumberFormat("en-PK", {
        style: "currency",
        currency: "PKR",
        maximumFractionDigits: 0,
      }).format(n),
    [],
  );

  /** Unit amounts may need extra decimals (e.g. net cost after %). */
  const formatUnitMoney = useCallback(
    (n: number) =>
      new Intl.NumberFormat("en-PK", {
        minimumFractionDigits: 0,
        maximumFractionDigits: 4,
      }).format(n),
    [],
  );

  const formatPct = useCallback(
    (n: number) =>
      new Intl.NumberFormat("en-PK", {
        minimumFractionDigits: 0,
        maximumFractionDigits: 2,
      }).format(n),
    [],
  );

  const exportPdf = useCallback(async () => {
    if (!filteredItems.length) {
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
      await registerUrduFont(doc);
      const margin = 40;
      let y = margin;
      doc.setFontSize(15);
      doc.setTextColor(127, 29, 29);
      doc.text("Stock report", margin, y);
      y += 18;
      doc.setFontSize(9);
      doc.setTextColor(60, 60, 60);
      doc.text(`Data loaded: ${fetchedAt || "—"}`, margin, y);
      y += 12;
      if (data?.dateFilter?.from || data?.dateFilter?.to) {
        doc.text(
          `Server filter (items last updated in range): ${data.dateFilter.from ?? "…"} → ${data.dateFilter.to ?? "…"}`,
          margin,
          y,
        );
        y += 12;
      } else {
        doc.text("Server filter: all active inventory items", margin, y);
        y += 12;
      }
      doc.text(
        `PDF table: ${filteredItems.length} rows (after search / type / manufacturer filters)`,
        margin,
        y,
      );
      y += 14;
      doc.text(`Summary — items: ${dynamicSummary.totalItems}`, margin, y);
      y += 12;
      doc.text(`Value at cost (net): ${formatCurrency(dynamicSummary.totalValueAtCost)}`, margin, y);
      y += 12;
      doc.text(`Value at selling (net): ${formatCurrency(dynamicSummary.totalValueAtSelling)}`, margin, y);
      y += 12;
      doc.text(`Net profit (stock): ${formatCurrency(dynamicSummary.totalNetProfit)}`, margin, y);
      y += 16;

      const body = filteredItems.map((row) => [
        row.name,
        row.type,
        String(row.quantity),
        String(row.minimumStock),
        formatUnitMoney(row.purchaseCostPerUnit ?? 0),
        formatPct(row.manufacturerDiscountPercent ?? 0),
        formatPct(row.specialCompanyDiscountPercent ?? 0),
        formatUnitMoney(row.netPurchaseCostPerUnit ?? 0),
        formatUnitMoney(row.salePricePerUnit ?? 0),
        formatPct(row.customerDiscountPercent ?? 0),
        formatUnitMoney(row.netSalePricePerUnit ?? 0),
        formatCurrency(row.valueAtCost),
        formatCurrency(row.valueAtSelling),
        formatCurrency(row.netProfit ?? 0),
        row.manufacturer ?? "—",
      ]);

      autoTable(doc, {
        head: [
          [
            "Name",
            "Type",
            "Qty",
            "Min",
            "Pur. (list)",
            "Mfg %",
            "Spec. co. %",
            "Net pur/u",
            "Sale (list)",
            "Cust %",
            "Net sale/u",
            "Val @ cost",
            "Val @ sell",
            "Net profit",
            "Mfg",
          ],
        ],
        body,
        foot: [
          [
            "Total",
            "—",
            String(dynamicSummary.totalQuantity),
            String(dynamicSummary.totalMinimumStock),
            "—",
            "—",
            "—",
            "—",
            "—",
            "—",
            "—",
            formatCurrency(dynamicSummary.totalValueAtCost),
            formatCurrency(dynamicSummary.totalValueAtSelling),
            formatCurrency(dynamicSummary.totalNetProfit),
            "—",
          ],
        ],
        startY: y,
        styles: { fontSize: 7, cellPadding: 4, font: PDF_URDU_FONT_FAMILY, fontStyle: "normal" },
        headStyles: {
          fillColor: [185, 28, 28],
          textColor: 255,
          font: PDF_URDU_FONT_FAMILY,
          fontStyle: "bold",
        },
        footStyles: {
          fillColor: [243, 244, 246],
          textColor: 17,
          font: PDF_URDU_FONT_FAMILY,
          fontStyle: "bold",
        },
        margin: { left: margin, right: margin },
      });

      doc.save(`stock-report-${format(new Date(), "yyyy-MM-dd")}.pdf`);
    } catch (e) {
      console.error(e);
      toast.error("Could not create PDF.");
    } finally {
      setExportingPdf(false);
    }
  }, [
    data?.dateFilter,
    dynamicSummary,
    fetchedAt,
    filteredItems,
    formatCurrency,
    formatPct,
    formatUnitMoney,
  ]);

  const customIncomplete = stockRangeMode === "custom" && (!customFrom || !customTo);

  return (
    <div className="min-h-screen bg-gray-50/80">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
        <header className="mb-8">
          <div className="flex items-center gap-4 mb-4">
            <Button variant="ghost" size="icon" asChild className="rounded-full hover:bg-red-50 hover:text-red-800">
              <Link href="/pharmacist/reports">
                <ArrowLeft className="h-5 w-5" />
              </Link>
            </Button>
            <div>
              <motion.h1
                className="text-2xl sm:text-3xl font-bold text-red-800 tracking-tight"
                initial={{ opacity: 0, y: -8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4 }}
              >
                Stock Report
              </motion.h1>
              <motion.p
                className="mt-1 text-sm text-gray-500"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 0.4, delay: 0.1 }}
              >
                Purchase value uses net cost: list purchase × (1 − manufacturer discount ÷ 100) × (1 − special company discount ÷ 100) per unit when both apply. Selling value uses net price: selling price × (1 − customer discount ÷ 100) per unit. Set discounts on each item when editing inventory.
              </motion.p>
            </div>
          </div>
          <div className="h-px bg-gradient-to-r from-red-200/80 via-red-100/50 to-transparent rounded-full" />
        </header>

        <Card className="mb-6 border border-gray-100 shadow-sm overflow-hidden">
          <div className="border-l-4 border-l-red-500 bg-red-50/30 px-5 py-3 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
            <div>
              <h2 className="text-base font-semibold text-red-800">Server date range</h2>
              <p className="text-xs text-gray-500 mt-0.5">
                “All items” loads full stock. “Custom” loads only rows where the item was last updated between the dates.
              </p>
            </div>
            <Button
              type="button"
              variant="outline"
              size="sm"
              className="border-red-200 text-red-800 hover:bg-red-50 shrink-0"
              disabled={!data || customIncomplete || !filteredItems.length || exportingPdf}
              onClick={() => void exportPdf()}
            >
              <Download className="h-4 w-4 mr-2" />
              {exportingPdf ? "PDF…" : "Export PDF"}
            </Button>
          </div>
          <CardContent className="p-4 space-y-4">
            <div className="flex flex-wrap gap-2">
              <Button
                type="button"
                size="sm"
                variant={stockRangeMode === "all" ? "default" : "outline"}
                className={stockRangeMode === "all" ? "bg-red-800 hover:bg-red-700 text-white" : ""}
                onClick={() => setStockRangeMode("all")}
              >
                All items
              </Button>
              <Button
                type="button"
                size="sm"
                variant={stockRangeMode === "custom" ? "default" : "outline"}
                className={stockRangeMode === "custom" ? "bg-red-800 hover:bg-red-700 text-white" : ""}
                onClick={() => setStockRangeMode("custom")}
              >
                Custom range
              </Button>
            </div>
            {stockRangeMode === "custom" && (
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
                Choose both <strong>From</strong> and <strong>To</strong> to load the report.
              </p>
            )}
            {error && (
              <p className="text-sm text-red-700 bg-red-50 border border-red-100 rounded-lg px-3 py-2">{error}</p>
            )}
            {fetchedAt && data && !error && (
              <p className="text-xs text-gray-500">Last loaded: {fetchedAt}</p>
            )}
          </CardContent>
        </Card>

        {loading ? (
          <div className="py-20 flex items-center justify-center">
            <Loading />
          </div>
        ) : data ? (
          <>
            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4 mb-8">
              <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
                <Card className="border-gray-100 shadow-sm overflow-hidden bg-white">
                  <CardHeader className="pb-2 bg-gray-50/50 border-b border-gray-100">
                    <CardTitle className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Total Items</CardTitle>
                  </CardHeader>
                  <CardContent className="pt-4 pb-6">
                    <p className="text-3xl font-bold text-gray-900">{dynamicSummary.totalItems}</p>
                    <p className="text-xs text-gray-400 mt-1">Products in filtered list</p>
                  </CardContent>
                </Card>
              </motion.div>
              <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
                <Card className="border-gray-100 shadow-sm overflow-hidden bg-white">
                  <CardHeader className="pb-2 bg-amber-50/30 border-b border-amber-100">
                    <CardTitle className="text-xs font-semibold text-amber-700 uppercase tracking-wider">Value at cost (net)</CardTitle>
                  </CardHeader>
                  <CardContent className="pt-4 pb-6">
                    <p className="text-3xl font-bold text-amber-600">{formatCurrency(dynamicSummary.totalValueAtCost)}</p>
                    <p className="text-xs text-amber-500 mt-1">Qty × net purchase cost per unit</p>
                  </CardContent>
                </Card>
              </motion.div>
              <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}>
                <Card className="border-gray-100 shadow-sm overflow-hidden bg-white">
                  <CardHeader className="pb-2 bg-green-50/30 border-b border-green-100">
                    <CardTitle className="text-xs font-semibold text-green-700 uppercase tracking-wider">Value at selling (net)</CardTitle>
                  </CardHeader>
                  <CardContent className="pt-4 pb-6">
                    <p className="text-3xl font-bold text-green-600">{formatCurrency(dynamicSummary.totalValueAtSelling)}</p>
                    <p className="text-xs text-green-500 mt-1">Qty × net sale price per unit</p>
                  </CardContent>
                </Card>
              </motion.div>
              <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.35 }}>
                <Card className="border-gray-100 shadow-sm overflow-hidden bg-white">
                  <CardHeader className="pb-2 bg-sky-50/40 border-b border-sky-100">
                    <CardTitle className="text-xs font-semibold text-sky-800 uppercase tracking-wider">Net profit (stock)</CardTitle>
                  </CardHeader>
                  <CardContent className="pt-4 pb-6">
                    <p className="text-3xl font-bold text-sky-700">{formatCurrency(dynamicSummary.totalNetProfit)}</p>
                    <p className="text-xs text-sky-600 mt-1">Selling (net) − cost (net)</p>
                  </CardContent>
                </Card>
              </motion.div>
            </div>

            <Card className="mb-6 border-gray-100 shadow-sm">
              <CardContent className="p-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                    <Input
                      placeholder="Search medicine..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="pl-9 h-10 border-gray-200 focus:border-red-500 focus:ring-red-500/20"
                    />
                  </div>

                  <Select value={typeFilter} onValueChange={setTypeFilter}>
                    <SelectTrigger className="h-10 border-gray-200 focus:ring-red-500/20">
                      <SelectValue placeholder="All Types" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Types</SelectItem>
                      {types.map((t) => (
                        <SelectItem key={t} value={t}>
                          <span className="capitalize">{t.toLowerCase()}</span>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>

                  <Select value={manufacturerFilter} onValueChange={setManufacturerFilter}>
                    <SelectTrigger className="h-10 border-gray-200 focus:ring-red-500/20">
                      <SelectValue placeholder="All Manufacturers" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Manufacturers</SelectItem>
                      {manufacturers.map((m) => (
                        <SelectItem key={m} value={m}>
                          {m}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>

                  <div className="flex items-center justify-end text-sm text-gray-500 font-medium px-2">
                    Showing {filteredItems.length} of {data.items.length} items
                  </div>
                </div>
              </CardContent>
            </Card>

            <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }}>
              <Card className="overflow-hidden border border-gray-100 rounded-xl shadow-sm bg-white">
                <div className="border-l-4 border-l-red-500 bg-red-50/30 px-5 py-4">
                  <h2 className="text-base font-semibold text-red-800">Item-wise Stock Analysis</h2>
                  <p className="text-xs text-gray-500 mt-0.5">
                    Per unit: net purchase = list purchase × (1 − mfg % ÷ 100) × (1 − special co. % ÷ 100); net sale = list sale × (1 − customer % ÷ 100). Line totals multiply by quantity.
                  </p>
                </div>
                <CardContent className="p-0">
                  <div className="overflow-x-auto">
                    <Table>
                      <TableHeader>
                        <TableRow className="bg-amber-50/60 hover:bg-amber-50/60">
                          <TableHead colSpan={4} className="text-center text-xs font-semibold text-amber-900 border-r border-amber-100">
                            Item
                          </TableHead>
                          <TableHead colSpan={4} className="text-center text-xs font-semibold text-amber-900 border-r border-amber-100">
                            Purchase (per unit)
                          </TableHead>
                          <TableHead colSpan={3} className="text-center text-xs font-semibold text-green-900 border-r border-green-100">
                            Sale (per unit)
                          </TableHead>
                          <TableHead colSpan={4} className="text-center text-xs font-semibold text-gray-800">
                            Stock (line totals) · supplier
                          </TableHead>
                        </TableRow>
                        <TableRow className="bg-gray-50/80">
                          <TableHead className="font-semibold text-gray-900 min-w-[120px]">Name</TableHead>
                          <TableHead className="font-semibold text-gray-900 text-center">Type</TableHead>
                          <TableHead className="font-semibold text-gray-900 text-center">Qty</TableHead>
                          <TableHead className="font-semibold text-gray-900 text-center border-r border-gray-100">Min</TableHead>
                          <TableHead className="font-semibold text-gray-900 text-right text-xs whitespace-nowrap">
                            List cost
                          </TableHead>
                          <TableHead className="font-semibold text-gray-900 text-center text-xs">Mfg %</TableHead>
                          <TableHead className="font-semibold text-gray-900 text-center text-xs whitespace-nowrap">
                            Spec. co. %
                          </TableHead>
                          <TableHead className="font-semibold text-gray-900 text-right text-xs border-r border-gray-100 whitespace-nowrap">
                            Net pur.
                          </TableHead>
                          <TableHead className="font-semibold text-gray-900 text-right text-xs whitespace-nowrap">
                            List sale
                          </TableHead>
                          <TableHead className="font-semibold text-gray-900 text-center text-xs">Cust %</TableHead>
                          <TableHead className="font-semibold text-gray-900 text-right text-xs border-r border-gray-100 whitespace-nowrap">
                            Net sale
                          </TableHead>
                          <TableHead className="font-semibold text-gray-900 text-right text-xs">@ cost</TableHead>
                          <TableHead className="font-semibold text-gray-900 text-right text-xs">@ sell</TableHead>
                          <TableHead className="font-semibold text-gray-900 text-right text-xs border-r border-gray-100">
                            Net profit
                          </TableHead>
                          <TableHead className="font-semibold text-gray-900 min-w-[100px]">Manufacturer</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {filteredItems.length === 0 ? (
                          <TableRow>
                            <TableCell colSpan={15} className="h-32 text-center text-gray-500 italic">
                              {searchTerm || typeFilter !== "all" || manufacturerFilter !== "all"
                                ? "No items match your filters."
                                : "No stock data recorded yet."}
                            </TableCell>
                          </TableRow>
                        ) : (
                          <>
                            {filteredItems.map((row) => (
                              <TableRow key={row.id} className="hover:bg-gray-50/50 transition-colors">
                                <TableCell className="font-medium text-gray-900">{row.name}</TableCell>
                                <TableCell className="text-center">
                                  <span className="inline-flex px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-gray-100 text-gray-600 uppercase">
                                    {row.type}
                                  </span>
                                </TableCell>
                                <TableCell className="text-center font-bold text-red-900">{row.quantity}</TableCell>
                                <TableCell className="text-center text-gray-500 border-r border-gray-100">
                                  {row.minimumStock}
                                </TableCell>
                                <TableCell className="text-right text-amber-800/90 tabular-nums text-sm">
                                  {formatUnitMoney(row.purchaseCostPerUnit ?? 0)}
                                </TableCell>
                                <TableCell className="text-center tabular-nums text-sm">
                                  {formatPct(row.manufacturerDiscountPercent ?? 0)}%
                                </TableCell>
                                <TableCell className="text-center tabular-nums text-sm">
                                  {formatPct(row.specialCompanyDiscountPercent ?? 0)}%
                                </TableCell>
                                <TableCell className="text-right text-amber-900 font-medium tabular-nums text-sm border-r border-gray-100">
                                  {formatUnitMoney(row.netPurchaseCostPerUnit ?? 0)}
                                </TableCell>
                                <TableCell className="text-right text-green-800/90 tabular-nums text-sm">
                                  {formatUnitMoney(row.salePricePerUnit ?? 0)}
                                </TableCell>
                                <TableCell className="text-center tabular-nums text-sm">
                                  {formatPct(row.customerDiscountPercent ?? 0)}%
                                </TableCell>
                                <TableCell className="text-right text-green-900 font-medium tabular-nums text-sm border-r border-gray-100">
                                  {formatUnitMoney(row.netSalePricePerUnit ?? 0)}
                                </TableCell>
                                <TableCell className="text-right text-amber-700 font-medium tabular-nums">
                                  {formatCurrency(row.valueAtCost)}
                                </TableCell>
                                <TableCell className="text-right text-green-700 font-medium tabular-nums">
                                  {formatCurrency(row.valueAtSelling)}
                                </TableCell>
                                <TableCell className="text-right font-semibold text-sky-800 tabular-nums border-r border-gray-100">
                                  {formatCurrency(row.netProfit ?? 0)}
                                </TableCell>
                                <TableCell className="text-muted-foreground text-sm">{row.manufacturer ?? "—"}</TableCell>
                              </TableRow>
                            ))}
                            <TableRow className="bg-gray-100/90 border-t-2 border-gray-200 hover:bg-gray-100/90">
                              <TableCell className="font-semibold text-gray-900">Total</TableCell>
                              <TableCell className="text-center text-muted-foreground text-sm">—</TableCell>
                              <TableCell className="text-center font-bold text-red-900 tabular-nums">
                                {dynamicSummary.totalQuantity}
                              </TableCell>
                              <TableCell className="text-center font-semibold text-gray-700 tabular-nums border-r border-gray-100">
                                {dynamicSummary.totalMinimumStock}
                              </TableCell>
                              <TableCell className="text-right text-muted-foreground text-sm">—</TableCell>
                              <TableCell className="text-center text-muted-foreground text-sm">—</TableCell>
                              <TableCell className="text-center text-muted-foreground text-sm">—</TableCell>
                              <TableCell className="text-right text-muted-foreground text-sm border-r border-gray-100">—</TableCell>
                              <TableCell className="text-right text-muted-foreground text-sm">—</TableCell>
                              <TableCell className="text-center text-muted-foreground text-sm">—</TableCell>
                              <TableCell className="text-right text-muted-foreground text-sm border-r border-gray-100">—</TableCell>
                              <TableCell className="text-right font-semibold text-amber-800 tabular-nums">
                                {formatCurrency(dynamicSummary.totalValueAtCost)}
                              </TableCell>
                              <TableCell className="text-right font-semibold text-green-800 tabular-nums">
                                {formatCurrency(dynamicSummary.totalValueAtSelling)}
                              </TableCell>
                              <TableCell className="text-right font-semibold text-sky-800 tabular-nums border-r border-gray-100">
                                {formatCurrency(dynamicSummary.totalNetProfit)}
                              </TableCell>
                              <TableCell className="text-muted-foreground text-sm">—</TableCell>
                            </TableRow>
                          </>
                        )}
                      </TableBody>
                    </Table>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          </>
        ) : (
          <div className="py-20 text-center bg-white rounded-xl border border-dashed border-gray-200">
            <Package className="h-12 w-12 text-gray-300 mx-auto mb-4" />
            <p className="text-gray-500 font-medium">
              {customIncomplete ? "Select a date range to load stock data." : "No stock data available at this moment."}
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
