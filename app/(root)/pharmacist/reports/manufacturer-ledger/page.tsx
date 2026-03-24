"use client";

import { useAuth } from "@/app/providers/AuthProvider";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { motion, AnimatePresence } from "framer-motion";
import { Building2, ArrowLeft, Download } from "lucide-react";
import Link from "next/link";
import { useEffect, useState, useMemo, useCallback } from "react";
import { useSearchParams } from "next/navigation";
import { Button } from "@/components/ui/button";
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
import { Suspense } from "react";

const PAYMENT_METHOD_FILTERS = [
  { value: "ALL", label: "All payment methods" },
  { value: "CASH", label: "Cash" },
  { value: "CARD", label: "Card" },
  { value: "ONLINE", label: "Online" },
  { value: "DONATION", label: "Donation" },
  { value: "CREDIT", label: "Credit" },
] as const;

interface LedgerEntry {
  id: string;
  date: string;
  type: "INVOICE" | "PAYMENT";
  reference: string;
  debit: number;
  credit: number;
  balance: number;
  grandTotal: number;
  itemSummary: string | null;
  paymentMethod: string | null;
}

interface LedgerData {
  manufacturer: {
    id: string;
    companyName: string;
    currentBalance: number;
  };
  openingBalance?: number;
  ledger: LedgerEntry[];
}

interface Manufacturer {
  id: string;
  companyName: string;
}

function formatPaymentMethodLabel(method: string | null) {
  if (!method) return "—";
  return method.charAt(0) + method.slice(1).toLowerCase();
}

function LedgerContent() {
  const { user } = useAuth();
  const searchParams = useSearchParams();
  const initialId = searchParams.get("id") || "";

  const [manufacturers, setManufacturers] = useState<Manufacturer[]>([]);
  const [selectedId, setSelectedId] = useState<string>(initialId);
  const [data, setData] = useState<LedgerData | null>(null);
  const [loadingManufacturers, setLoadingManufacturers] = useState(true);
  const [loadingLedger, setLoadingLedger] = useState(false);
  const [paymentMethodFilter, setPaymentMethodFilter] = useState<string>("ALL");
  const [exportingPdf, setExportingPdf] = useState(false);

  useEffect(() => {
    if (!user?.access_token) return;
    const fetchManufacturers = async () => {
      try {
        const res = await fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL}/pharmacist/manufacturer`, {
          headers: { Authorization: `Bearer ${user.access_token}` },
        });
        const json = await res.json();
        setManufacturers(json);
      } catch (e) {
        console.error(e);
      } finally {
        setLoadingManufacturers(false);
      }
    };
    fetchManufacturers();
  }, [user?.access_token]);

  useEffect(() => {
    if (!selectedId || !user?.access_token) {
      setData(null);
      return;
    }
    const fetchLedger = async () => {
      setLoadingLedger(true);
      try {
        const res = await fetch(
          `${process.env.NEXT_PUBLIC_API_BASE_URL}/pharmacist/manufacturer/${selectedId}/ledger`,
          { headers: { Authorization: `Bearer ${user.access_token}` } }
        );
        const json = await res.json();
        setData(json);
      } catch (e) {
        console.error(e);
      } finally {
        setLoadingLedger(false);
      }
    };
    fetchLedger();
  }, [selectedId, user?.access_token]);

  const formatCurrency = (n: number) =>
    new Intl.NumberFormat("en-PK", {
      style: "currency",
      currency: "PKR",
      maximumFractionDigits: 0,
    }).format(n);

  const formatDate = (d: string) =>
    new Date(d).toLocaleDateString("en-GB", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    });

  const filteredLedger = useMemo(() => {
    if (!data?.ledger) return [];
    if (paymentMethodFilter === "ALL") return data.ledger;
    return data.ledger.filter(
      (e) => e.type === "INVOICE" || e.paymentMethod === paymentMethodFilter
    );
  }, [data?.ledger, paymentMethodFilter]);

  const totals = useMemo(() => {
    if (!data?.ledger.length) {
      return { debits: 0, credits: 0 };
    }
    return data.ledger.reduce(
      (acc, e) => ({
        debits: acc.debits + e.debit,
        credits: acc.credits + e.credit,
      }),
      { debits: 0, credits: 0 }
    );
  }, [data?.ledger]);

  const openingBalance = data?.openingBalance ?? 0;

  const exportPdf = useCallback(async () => {
    if (!data || !filteredLedger.length) return;
    setExportingPdf(true);
    try {
      const [{ default: jsPDF }, { default: autoTable }] = await Promise.all([
        import("jspdf"),
        import("jspdf-autotable"),
      ]);
      const doc = new jsPDF({ orientation: "landscape", unit: "pt", format: "a4" });
      const margin = 40;
      let y = margin;
      doc.setFontSize(16);
      doc.setTextColor(127, 29, 29);
      doc.text("Manufacturer account — balance sheet style statement", margin, y);
      y += 22;
      doc.setFontSize(11);
      doc.setTextColor(60, 60, 60);
      doc.text(`Manufacturer: ${data.manufacturer.companyName}`, margin, y);
      y += 16;
      doc.text(`Generated: ${new Date().toLocaleString("en-GB")}`, margin, y);
      y += 16;
      if (paymentMethodFilter !== "ALL") {
        doc.text(`Filter: payments — ${paymentMethodFilter}`, margin, y);
        y += 16;
      }
      doc.setFontSize(10);
      doc.text(`Opening balance (carried forward): ${formatCurrency(openingBalance)}`, margin, y);
      y += 14;
      doc.text(`Total purchases (invoices): ${formatCurrency(totals.debits)}`, margin, y);
      y += 14;
      doc.text(`Total payments: ${formatCurrency(totals.credits)}`, margin, y);
      y += 14;
      doc.setFont("helvetica", "bold");
      doc.text(`Closing / outstanding balance: ${formatCurrency(data.manufacturer.currentBalance)}`, margin, y);
      doc.setFont("helvetica", "normal");
      y += 24;

      const head = [
        [
          "Date",
          "Type",
          "Ref. (inv. no. / pay. ref.)",
          "Items",
          "Pay method",
          "Grand total",
          "Debit (owed)",
          "Credit (paid)",
          "Running balance",
        ],
      ];
      const body = filteredLedger.map((e) => [
        formatDate(e.date),
        e.type,
        e.reference,
        e.itemSummary?.replace(/\s+/g, " ") || "—",
        e.type === "PAYMENT" ? formatPaymentMethodLabel(e.paymentMethod) : "—",
        formatCurrency(e.grandTotal),
        e.debit > 0 ? formatCurrency(e.debit) : "—",
        e.credit > 0 ? formatCurrency(e.credit) : "—",
        formatCurrency(e.balance),
      ]);

      autoTable(doc, {
        head,
        body,
        startY: y,
        styles: { fontSize: 7, cellPadding: 4 },
        headStyles: { fillColor: [185, 28, 28], textColor: 255 },
        columnStyles: {
          0: { cellWidth: 62 },
          1: { cellWidth: 52 },
          2: { cellWidth: 70 },
          3: { cellWidth: 140 },
          4: { cellWidth: 52 },
          5: { cellWidth: 72, halign: "right" },
          6: { cellWidth: 72, halign: "right" },
          7: { cellWidth: 72, halign: "right" },
          8: { cellWidth: 80, halign: "right" },
        },
        margin: { left: margin, right: margin },
      });

      const safeName = data.manufacturer.companyName.replace(/[^\w\s-]/g, "").slice(0, 40) || "ledger";
      doc.save(`manufacturer-ledger-${safeName}.pdf`);
    } catch (e) {
      console.error(e);
    } finally {
      setExportingPdf(false);
    }
  }, [data, filteredLedger, formatCurrency, openingBalance, paymentMethodFilter, totals]);

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
                Manufacturer Ledger
              </motion.h1>
              <motion.p
                className="mt-1 text-sm text-gray-500"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 0.4, delay: 0.1 }}
              >
                Balance-sheet style statement: opening position, movements, and closing balance. Reference = purchase
                invoice number or payment reference.
              </motion.p>
            </div>
          </div>
          <div className="h-px bg-gradient-to-r from-red-200/80 via-red-100/50 to-transparent rounded-full" />
        </header>

        <Card className="mb-8 border-gray-100 shadow-sm overflow-hidden bg-white">
          <CardContent className="p-6">
            <div className="flex flex-col sm:flex-row items-center gap-6">
              <div className="w-full sm:w-80">
                <label className="block text-sm font-semibold text-gray-700 mb-2">Select Manufacturer</label>
                <Select value={selectedId} onValueChange={setSelectedId}>
                  <SelectTrigger className="h-11 border-gray-200 focus:ring-red-500/20">
                    <SelectValue placeholder={loadingManufacturers ? "Loading..." : "Choose a manufacturer..."} />
                  </SelectTrigger>
                  <SelectContent>
                    {manufacturers.map((m) => (
                      <SelectItem key={m.id} value={m.id}>
                        {m.companyName}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {data && (
                <div className="flex-1 flex justify-end">
                  <div className="px-6 py-4 bg-red-50 rounded-2xl border border-red-100 min-w-[200px]">
                    <p className="text-xs font-bold text-red-600 uppercase tracking-wider mb-1">Closing balance (owed)</p>
                    <p className="text-3xl font-black text-red-900">{formatCurrency(data.manufacturer.currentBalance)}</p>
                  </div>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        <AnimatePresence mode="wait">
          {loadingLedger ? (
            <motion.div
              key="loading"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="py-20 flex justify-center"
            >
              <Loading />
            </motion.div>
          ) : data ? (
            <motion.div
              key="ledger"
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4 }}
              className="space-y-6"
            >
              <Card className="border border-gray-200 shadow-sm bg-white overflow-hidden">
                <CardHeader className="border-b border-gray-100 bg-gradient-to-r from-slate-50 to-white py-4">
                  <CardTitle className="text-lg text-slate-800">Account summary (balance sheet style)</CardTitle>
                  <p className="text-xs text-gray-500 font-normal mt-1">
                    Opening balance includes any amount owed before the first row shown below, so running balance matches
                    closing.
                  </p>
                </CardHeader>
                <CardContent className="p-0">
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 divide-y sm:divide-y-0 sm:divide-x divide-gray-100">
                    <div className="p-5">
                      <p className="text-[11px] font-bold uppercase tracking-wide text-gray-500">Opening balance</p>
                      <p className="text-xl font-semibold text-slate-900 mt-1">{formatCurrency(openingBalance)}</p>
                    </div>
                    <div className="p-5">
                      <p className="text-[11px] font-bold uppercase tracking-wide text-gray-500">Add: purchases (invoices)</p>
                      <p className="text-xl font-semibold text-amber-800 mt-1">{formatCurrency(totals.debits)}</p>
                    </div>
                    <div className="p-5">
                      <p className="text-[11px] font-bold uppercase tracking-wide text-gray-500">Less: payments</p>
                      <p className="text-xl font-semibold text-green-800 mt-1">{formatCurrency(totals.credits)}</p>
                    </div>
                    <div className="p-5 bg-red-50/40">
                      <p className="text-[11px] font-bold uppercase tracking-wide text-red-700">Closing (outstanding)</p>
                      <p className="text-xl font-bold text-red-900 mt-1">
                        {formatCurrency(data.manufacturer.currentBalance)}
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4">
                <div className="w-full sm:max-w-xs">
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Filter by payment method</label>
                  <Select value={paymentMethodFilter} onValueChange={setPaymentMethodFilter}>
                    <SelectTrigger className="h-11 border-gray-200">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {PAYMENT_METHOD_FILTERS.map((opt) => (
                        <SelectItem key={opt.value} value={opt.value}>
                          {opt.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <p className="text-xs text-gray-500 mt-2">
                    Invoices always stay visible; only payment rows are filtered. Running balance on each row is still the
                    true position after that transaction.
                  </p>
                </div>
                <Button
                  type="button"
                  variant="outline"
                  className="border-red-200 text-red-800 hover:bg-red-50 shrink-0"
                  disabled={!filteredLedger.length || exportingPdf}
                  onClick={() => void exportPdf()}
                >
                  <Download className="h-4 w-4 mr-2" />
                  {exportingPdf ? "Preparing PDF…" : "Export to PDF"}
                </Button>
              </div>

              <Card className="overflow-hidden border border-gray-100 rounded-xl shadow-sm bg-white">
                <div className="border-l-4 border-l-red-500 bg-red-50/30 px-5 py-4">
                  <h2 className="text-base font-semibold text-red-800">Statement of account — detail</h2>
                  <p className="text-xs text-gray-500 mt-0.5">
                    {data.manufacturer.companyName}: line items from purchase invoices; payment method on supplier
                    payments only.
                  </p>
                </div>
                <CardContent className="p-0 overflow-x-auto">
                  <Table>
                    <TableHeader className="bg-gray-50/80">
                      <TableRow>
                        <TableHead className="font-semibold text-gray-900 whitespace-nowrap">Date</TableHead>
                        <TableHead className="font-semibold text-gray-900 whitespace-nowrap">Type</TableHead>
                        <TableHead className="font-semibold text-gray-900 whitespace-nowrap">Reference</TableHead>
                        <TableHead className="font-semibold text-gray-900 min-w-[160px]">Items (from invoice)</TableHead>
                        <TableHead className="font-semibold text-gray-900 whitespace-nowrap">Payment method</TableHead>
                        <TableHead className="font-semibold text-gray-900 text-right whitespace-nowrap">Grand total</TableHead>
                        <TableHead className="font-semibold text-gray-900 text-right whitespace-nowrap">Debit (owed)</TableHead>
                        <TableHead className="font-semibold text-gray-900 text-right whitespace-nowrap">Credit (paid)</TableHead>
                        <TableHead className="font-semibold text-gray-900 text-right whitespace-nowrap">Running balance</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredLedger.length === 0 ? (
                        <TableRow>
                          <TableCell colSpan={9} className="h-32 text-center text-gray-500 italic">
                            No rows match this filter.
                          </TableCell>
                        </TableRow>
                      ) : (
                        filteredLedger.map((entry) => (
                          <TableRow key={entry.id} className="hover:bg-gray-50/50 transition-colors">
                            <TableCell className="text-gray-600 font-medium whitespace-nowrap">{formatDate(entry.date)}</TableCell>
                            <TableCell>
                              <span
                                className={`inline-flex px-2 py-0.5 rounded-full text-[10px] font-bold uppercase ${
                                  entry.type === "INVOICE" ? "bg-amber-100 text-amber-700" : "bg-green-100 text-green-700"
                                }`}
                              >
                                {entry.type}
                              </span>
                            </TableCell>
                            <TableCell className="font-mono text-xs text-gray-600 max-w-[120px]">
                              <span title="Invoice number (purchases) or payment reference">{entry.reference}</span>
                            </TableCell>
                            <TableCell className="text-xs text-gray-700 max-w-xs align-top">
                              {entry.itemSummary ? (
                                <span className="line-clamp-3" title={entry.itemSummary}>
                                  {entry.itemSummary}
                                </span>
                              ) : (
                                <span className="text-gray-400">—</span>
                              )}
                            </TableCell>
                            <TableCell className="text-sm text-gray-700 whitespace-nowrap">
                              {entry.type === "PAYMENT" ? formatPaymentMethodLabel(entry.paymentMethod) : "—"}
                            </TableCell>
                            <TableCell className="text-right text-sm font-medium text-gray-900 whitespace-nowrap">
                              {formatCurrency(entry.grandTotal)}
                            </TableCell>
                            <TableCell className="text-right text-amber-700 font-medium whitespace-nowrap">
                              {entry.debit > 0 ? formatCurrency(entry.debit) : "—"}
                            </TableCell>
                            <TableCell className="text-right text-green-700 font-medium whitespace-nowrap">
                              {entry.credit > 0 ? formatCurrency(entry.credit) : "—"}
                            </TableCell>
                            <TableCell className="text-right font-bold text-gray-900 whitespace-nowrap">
                              {formatCurrency(entry.balance)}
                            </TableCell>
                          </TableRow>
                        ))
                      )}
                    </TableBody>
                  </Table>
                </CardContent>
              </Card>
            </motion.div>
          ) : !selectedId && !loadingLedger ? (
            <div className="py-20 text-center bg-white rounded-xl border border-dashed border-gray-200">
              <Building2 className="h-12 w-12 text-gray-300 mx-auto mb-4" />
              <p className="text-gray-500 font-medium">Please select a manufacturer to view their ledger.</p>
            </div>
          ) : null}
        </AnimatePresence>
      </div>
    </div>
  );
}

export default function ManufacturerLedgerPage() {
  return (
    <Suspense fallback={<div className="py-20 flex justify-center"><Loading /></div>}>
      <LedgerContent />
    </Suspense>
  );
}
