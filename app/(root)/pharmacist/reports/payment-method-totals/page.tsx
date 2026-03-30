"use client";

import React, { useCallback, useEffect, useMemo, useState } from "react";
import { useAuth } from "@/app/providers/AuthProvider";
import { Card, CardContent } from "@/components/ui/card";
import { motion } from "framer-motion";
import { ArrowLeft, Download } from "lucide-react";
import Link from "next/link";
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
import Loading from "@/components/shared/Loading";

type Period = "day" | "month" | "year";

type MethodFilterValue = "ALL" | "CASH" | "CARD" | "ONLINE" | "DONATION" | "CREDIT";

type PaymentTotalsResponse = {
  period: Period;
  dateMode?: "preset" | "custom";
  from: string;
  to: string;
  methodsFilter?: string[] | null;
  CASH: number;
  CARD: number;
  ONLINE: number;
  DONATION: number;
  CREDIT: number;
  grandTotal: number;
};

const METHOD_ROWS: { key: keyof Pick<PaymentTotalsResponse, "CASH" | "CARD" | "ONLINE" | "DONATION" | "CREDIT">; label: string; border: string; bg: string; title: string; value: string }[] = [
  { key: "CASH", label: "Cash", border: "border-red-100", bg: "bg-red-50/20", title: "text-red-700", value: "text-red-600" },
  { key: "CARD", label: "Card", border: "border-blue-100", bg: "bg-blue-50/20", title: "text-blue-700", value: "text-blue-600" },
  { key: "ONLINE", label: "Online", border: "border-indigo-100", bg: "bg-indigo-50/20", title: "text-indigo-700", value: "text-indigo-600" },
  { key: "DONATION", label: "Donation", border: "border-amber-100", bg: "bg-amber-50/20", title: "text-amber-700", value: "text-amber-600" },
  { key: "CREDIT", label: "Credit", border: "border-green-100", bg: "bg-green-50/20", title: "text-green-700", value: "text-green-600" },
];

export default function PaymentMethodTotalsPage() {
  const { user } = useAuth();
  const [data, setData] = useState<PaymentTotalsResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [period, setPeriod] = useState<Period>("month");
  const [useCustomRange, setUseCustomRange] = useState(false);
  const [fromDate, setFromDate] = useState("");
  const [toDate, setToDate] = useState("");
  const [methodFilter, setMethodFilter] = useState<MethodFilterValue>("ALL");
  const [exportingPdf, setExportingPdf] = useState(false);

  const formatCurrency = (n: number) =>
    new Intl.NumberFormat("en-PK", {
      style: "currency",
      currency: "PKR",
      maximumFractionDigits: 0,
    }).format(n);

  const formatRangeLabel = (fromIso: string, toIso: string) => {
    const a = new Date(fromIso);
    const b = new Date(toIso);
    return `${a.toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" })} — ${b.toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" })}`;
  };

  const buildQuery = useMemo(() => {
    const params = new URLSearchParams();
    params.set("period", period);
    if (useCustomRange && fromDate && toDate) {
      params.set("from", fromDate);
      params.set("to", toDate);
    }
    if (methodFilter !== "ALL") {
      params.set("methods", methodFilter);
    }
    return params.toString();
  }, [period, useCustomRange, fromDate, toDate, methodFilter]);

  useEffect(() => {
    if (!user?.access_token) return;

    if (useCustomRange && (!fromDate || !toDate)) {
      setLoading(false);
      setData(null);
      setError(null);
      return;
    }

    const fetchData = async () => {
      setLoading(true);
      setError(null);
      try {
        const res = await fetch(
          `${process.env.NEXT_PUBLIC_API_BASE_URL}/pharmacist/reports/payment-method-totals?${buildQuery}`,
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
                : "Could not load payment totals.",
          );
          return;
        }
        setData(json);
      } catch (e) {
        console.error(e);
        setData(null);
        setError("Network error while loading totals.");
      } finally {
        setLoading(false);
      }
    };

    void fetchData();
  }, [user?.access_token, buildQuery, useCustomRange, fromDate, toDate]);

  const visibleRows = useMemo(() => {
    if (methodFilter === "ALL") return METHOD_ROWS;
    return METHOD_ROWS.filter((r) => r.key === methodFilter);
  }, [methodFilter]);

  const exportPdf = useCallback(async () => {
    if (!data) return;
    setExportingPdf(true);
    try {
      const [{ default: jsPDF }, { default: autoTable }] = await Promise.all([
        import("jspdf"),
        import("jspdf-autotable"),
      ]);
      const doc = new jsPDF({ orientation: "portrait", unit: "pt", format: "a4" });
      const margin = 48;
      let y = margin;
      doc.setFontSize(16);
      doc.setTextColor(127, 29, 29);
      doc.text("Payment method totals (sales)", margin, y);
      y += 24;
      doc.setFontSize(10);
      doc.setTextColor(60, 60, 60);
      doc.text(`Period: ${data.period}`, margin, y);
      y += 14;
      doc.text(`Range: ${formatRangeLabel(data.from, data.to)}`, margin, y);
      y += 14;
      doc.text(`Generated: ${new Date().toLocaleString("en-GB")}`, margin, y);
      y += 14;
      if (data.methodsFilter?.length) {
        doc.text(`Methods included: ${data.methodsFilter.join(", ")}`, margin, y);
        y += 14;
      } else if (methodFilter !== "ALL") {
        doc.text(`Methods included: ${methodFilter}`, margin, y);
        y += 14;
      }
      y += 8;

      const body = METHOD_ROWS.map((row) => [
        row.label,
        formatCurrency(data[row.key] || 0),
      ]);
      body.push(["Grand total", formatCurrency(data.grandTotal || 0)]);

      autoTable(doc, {
        head: [["Payment method", "Net amount (PKR)"]],
        body,
        startY: y,
        styles: { fontSize: 10, cellPadding: 8 },
        headStyles: { fillColor: [185, 28, 28], textColor: 255 },
        columnStyles: {
          0: { cellWidth: 200 },
          1: { cellWidth: 200, halign: "right" },
        },
        margin: { left: margin, right: margin },
        didParseCell: (hookData) => {
          if (hookData.section === "body" && hookData.row.index === body.length - 1) {
            hookData.cell.styles.fontStyle = "bold";
          }
        },
      });

      doc.save(`payment-method-totals-${new Date().toISOString().slice(0, 10)}.pdf`);
    } catch (e) {
      console.error(e);
    } finally {
      setExportingPdf(false);
    }
  }, [data, formatCurrency, methodFilter]);

  return (
    <div className="min-h-screen bg-gray-50/80">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
        <header className="mb-8">
          <div className="flex items-center gap-4 mb-4">
            <Button
              variant="ghost"
              size="icon"
              asChild
              className="rounded-full hover:bg-red-50 hover:text-red-800"
            >
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
                Accounts: Payment Totals
              </motion.h1>
              <motion.p
                className="mt-1 text-sm text-gray-500"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 0.4, delay: 0.1 }}
              >
                Net sales by payment method (after refunds). Filter by date range and method, then export to PDF.
              </motion.p>
            </div>
          </div>
          <div className="h-px bg-gradient-to-r from-red-200/80 via-red-100/50 to-transparent rounded-full" />
        </header>

        <Card className="overflow-hidden bg-white border border-gray-100 rounded-xl shadow-sm hover:shadow-md transition-shadow mb-6">
          <div className="border-l-4 border-l-red-500 bg-red-50/30 px-5 py-4">
            <h2 className="text-base font-semibold text-red-800">Filters</h2>
            <p className="text-xs text-gray-500 mt-0.5">
              Preset period is ignored when both custom dates are set. Method filter limits which sales are counted;
              grand total matches the filtered methods only.
            </p>
          </div>
          <CardContent className="p-5 space-y-6">
            <div className="flex flex-col lg:flex-row lg:items-end gap-6 flex-wrap">
              <div className="space-y-2">
                <Label className="text-sm font-semibold text-gray-700">Quick period</Label>
                <div className="flex bg-gray-50 p-1 rounded-lg border border-gray-100">
                  {(["day", "month", "year"] as const).map((p) => (
                    <Button
                      key={p}
                      type="button"
                      variant={period === p && !useCustomRange ? "default" : "ghost"}
                      size="sm"
                      onClick={() => {
                        setUseCustomRange(false);
                        setPeriod(p);
                      }}
                      className={`capitalize px-4 ${
                        period === p && !useCustomRange
                          ? "bg-red-800 text-white hover:bg-red-700"
                          : "text-gray-600 hover:text-red-800 hover:bg-red-50"
                      }`}
                    >
                      {p}
                    </Button>
                  ))}
                </div>
              </div>

              <div className="flex flex-col sm:flex-row gap-4 items-end flex-1">
                <div className="flex items-center gap-2 pb-2">
                  <input
                    type="checkbox"
                    id="custom-range"
                    checked={useCustomRange}
                    onChange={(e) => setUseCustomRange(e.target.checked)}
                    className="rounded border-gray-300 text-red-800 focus:ring-red-500"
                  />
                  <Label htmlFor="custom-range" className="text-sm font-medium text-gray-700 cursor-pointer">
                    Custom date range
                  </Label>
                </div>
                {useCustomRange && (
                  <>
                    <div className="space-y-1">
                      <Label className="text-xs text-gray-500">From</Label>
                      <Input
                        type="date"
                        value={fromDate}
                        onChange={(e) => setFromDate(e.target.value)}
                        className="w-[160px]"
                      />
                    </div>
                    <div className="space-y-1">
                      <Label className="text-xs text-gray-500">To</Label>
                      <Input
                        type="date"
                        value={toDate}
                        onChange={(e) => setToDate(e.target.value)}
                        className="w-[160px]"
                      />
                    </div>
                  </>
                )}
              </div>

              <div className="space-y-2 min-w-[200px]">
                <Label className="text-sm font-semibold text-gray-700">Payment methods</Label>
                <Select value={methodFilter} onValueChange={(v) => setMethodFilter(v as MethodFilterValue)}>
                  <SelectTrigger className="border-gray-200">
                    <SelectValue placeholder="All methods" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="ALL">All methods</SelectItem>
                    <SelectItem value="CASH">Cash only</SelectItem>
                    <SelectItem value="CARD">Card only</SelectItem>
                    <SelectItem value="ONLINE">Online only</SelectItem>
                    <SelectItem value="DONATION">Donation only</SelectItem>
                    <SelectItem value="CREDIT">Credit only</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <Button
                type="button"
                variant="outline"
                className="border-red-200 text-red-800 hover:bg-red-50 shrink-0"
                disabled={!data || exportingPdf}
                onClick={() => void exportPdf()}
              >
                <Download className="h-4 w-4 mr-2" />
                {exportingPdf ? "Preparing PDF…" : "Export PDF"}
              </Button>
            </div>

            {useCustomRange && (!fromDate || !toDate) && (
              <p className="text-sm text-amber-700 bg-amber-50 border border-amber-100 rounded-lg px-3 py-2">
                Choose both <strong>From</strong> and <strong>To</strong> dates to load totals.
              </p>
            )}
            {error && (
              <p className="text-sm text-red-700 bg-red-50 border border-red-100 rounded-lg px-3 py-2">{error}</p>
            )}
          </CardContent>
        </Card>

        <Card className="overflow-hidden bg-white border border-gray-100 rounded-xl shadow-sm hover:shadow-md transition-shadow">
          <div className="border-l-4 border-l-red-500 bg-red-50/30 px-5 py-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h2 className="text-base font-semibold text-red-800">Payment method summary</h2>
              {data && (
                <p className="text-xs text-gray-500 mt-1">{formatRangeLabel(data.from, data.to)}</p>
              )}
            </div>
          </div>

          <CardContent className="p-6">
            {loading ? (
              <div className="py-20 flex items-center justify-center">
                <Loading />
              </div>
            ) : data && !error ? (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3"
              >
                {visibleRows.map((row) => (
                  <div
                    key={row.key}
                    className={`rounded-xl border ${row.border} ${row.bg} p-6`}
                  >
                    <p className={`text-sm font-medium mb-1 ${row.title}`}>{row.label}</p>
                    <p className={`text-3xl font-bold tracking-tight ${row.value}`}>
                      {formatCurrency(data[row.key] || 0)}
                    </p>
                  </div>
                ))}

                <div className="rounded-xl border border-gray-200 bg-gray-50/60 p-6 sm:col-span-2 lg:col-span-1">
                  <p className="text-sm font-medium text-gray-700 mb-1">Grand total (filtered net)</p>
                  <p className="text-3xl font-bold text-gray-900 tracking-tight">
                    {formatCurrency(data.grandTotal || 0)}
                  </p>
                  <p className="text-xs text-gray-500 mt-2">
                    Net after refunds for the selected range and method filter.
                  </p>
                </div>
              </motion.div>
            ) : (
              <div className="py-20 text-center">
                <p className="text-gray-500 font-medium">
                  {useCustomRange && (!fromDate || !toDate)
                    ? "Select a date range to view totals."
                    : "No sales data available for this selection."}
                </p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
