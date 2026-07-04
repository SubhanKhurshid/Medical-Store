"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
import { useParams, useRouter } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogFooter,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { motion } from "framer-motion";
import { ArrowLeft, User, Phone, Mail, MapPin, Calendar, Receipt, Wallet, Banknote, Bell, MessageSquare, Printer, Download } from "lucide-react";
import Loading from "@/components/shared/Loading";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { format, startOfDay, endOfDay } from "date-fns";
import { useAuth } from "@/app/providers/AuthProvider";
import axios from "axios";
import { parseApiList } from "@/lib/api";
import { toast } from "sonner";
import { SaleInvoiceDialog } from "@/components/sales/SaleInvoiceDialog";
import type { SaleForReceipt } from "@/lib/sale-receipt";

const PAYMENT_LABELS: Record<string, string> = {
    CASH: "Cash",
    CARD: "Card",
    ONLINE: "Online",
    DONATION: "Donation",
    CREDIT: "Credit",
};

type HistoryDateMode = "all" | "today" | "custom";

type HistoryEntry =
    | { kind: "sale"; id: string; at: Date; sale: any }
    | { kind: "payment"; id: string; at: Date; tx: any };

function inHistoryRange(at: Date, range: { start?: Date; end?: Date } | null): boolean {
    if (range === null) return false;
    if (!range.start && !range.end) return true;
    const t = at.getTime();
    if (range.start && t < range.start.getTime()) return false;
    if (range.end && t > range.end.getTime()) return false;
    return true;
}

function saleRefundLabel(sale: any): string | null {
    const refunded = Number(sale.refundedAmount) || 0;
    if (refunded <= 0) return null;
    const total = Number(sale.totalPrice) || 0;
    if (refunded >= total) return "Fully refunded";
    return `Refunded: Rs ${refunded.toLocaleString()}`;
}

const API = process.env.NEXT_PUBLIC_API_BASE_URL;

export default function CustomerDetailPage() {
    const params = useParams();
    const router = useRouter();
    const { user } = useAuth();
    const accessToken = user?.access_token;
    const [customer, setCustomer] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [transactions, setTransactions] = useState<any[]>([]);
    const [reminders, setReminders] = useState<any[]>([]);
    const [paymentAmount, setPaymentAmount] = useState("");
    const [paymentReference, setPaymentReference] = useState("");
    const [paymentSubmitting, setPaymentSubmitting] = useState(false);
    const [reminderOpen, setReminderOpen] = useState(false);
    const [reminderType, setReminderType] = useState("REFILL");
    const [reminderChannel, setReminderChannel] = useState("SMS");
    const [reminderNote, setReminderNote] = useState("");
    const [reminderSubmitting, setReminderSubmitting] = useState(false);
    const [historyDateMode, setHistoryDateMode] = useState<HistoryDateMode>("all");
    const [historyFrom, setHistoryFrom] = useState("");
    const [historyTo, setHistoryTo] = useState("");
    const [viewSale, setViewSale] = useState<SaleForReceipt | null>(null);
    const [exportingPdf, setExportingPdf] = useState(false);

    const fetchCustomer = useCallback(async () => {
        if (!params.id) return;
        if (!accessToken) {
            setLoading(false);
            return;
        }
        try {
            const { data } = await axios.get(`${API}/pharmacist/customer/${params.id}`, {
                headers: { Authorization: `Bearer ${accessToken}` },
            });
            setCustomer(data);
        } catch (e) {
            console.error(e);
            setCustomer(null);
        } finally {
            setLoading(false);
        }
    }, [params.id, accessToken]);

    const fetchTransactions = useCallback(async () => {
        if (!params.id || !accessToken) return;
        try {
            const { data } = await axios.get(`${API}/pharmacist/customer/${params.id}/transactions`, {
                headers: { Authorization: `Bearer ${accessToken}` },
            });
            setTransactions(parseApiList(data));
        } catch (e) {
            setTransactions([]);
        }
    }, [params.id, accessToken]);

    const fetchReminders = useCallback(async () => {
        if (!params.id || !accessToken) return;
        try {
            const { data } = await axios.get(`${API}/pharmacist/customer/${params.id}/reminders`, {
                headers: { Authorization: `Bearer ${accessToken}` },
            });
            setReminders(parseApiList(data));
        } catch (e) {
            setReminders([]);
        }
    }, [params.id, accessToken]);

    useEffect(() => {
        setLoading(true);
        fetchCustomer();
    }, [fetchCustomer]);

    useEffect(() => {
        if (params.id && accessToken) {
            fetchTransactions();
            fetchReminders();
        }
    }, [params.id, accessToken, fetchTransactions, fetchReminders]);

    const historyRange = useMemo<{ start?: Date; end?: Date } | null>(() => {
        if (historyDateMode === "all") return {};
        if (historyDateMode === "today") {
            const now = new Date();
            return { start: startOfDay(now), end: endOfDay(now) };
        }
        if (!historyFrom || !historyTo) return null;
        return { start: startOfDay(new Date(historyFrom)), end: endOfDay(new Date(historyTo)) };
    }, [historyDateMode, historyFrom, historyTo]);

    const filteredSales = useMemo(() => {
        const sales: any[] = customer?.sales ?? [];
        return sales.filter((sale) => inHistoryRange(new Date(sale.soldAt), historyRange));
    }, [customer, historyRange]);

    /** Cash / credit repayments recorded against the customer account (negative ledger entries). */
    const filteredPayments = useMemo(() => {
        return transactions
            .filter((tx) => Number(tx.amount) < 0)
            .filter((tx) => inHistoryRange(new Date(tx.createdAt), historyRange));
    }, [transactions, historyRange]);

    const historyEntries = useMemo((): HistoryEntry[] => {
        const entries: HistoryEntry[] = [
            ...filteredSales.map((sale) => ({
                kind: "sale" as const,
                id: sale.id,
                at: new Date(sale.soldAt),
                sale,
            })),
            ...filteredPayments.map((tx) => ({
                kind: "payment" as const,
                id: tx.id,
                at: new Date(tx.createdAt),
                tx,
            })),
        ];
        return entries.sort((a, b) => b.at.getTime() - a.at.getTime());
    }, [filteredSales, filteredPayments]);

    const historySummary = useMemo(() => {
        const grossPurchases = filteredSales.reduce(
            (sum, sale) => sum + (Number(sale.totalPrice) || 0),
            0,
        );
        const totalRefunded = filteredSales.reduce(
            (sum, sale) => sum + (Number(sale.refundedAmount) || 0),
            0,
        );
        const paymentsReceived = filteredPayments.reduce(
            (sum, tx) => sum + Math.abs(Number(tx.amount) || 0),
            0,
        );
        const netPurchases = grossPurchases - totalRefunded;
        return { grossPurchases, totalRefunded, paymentsReceived, netPurchases };
    }, [filteredSales, filteredPayments]);

    const historyRangeLabel = useMemo(() => {
        if (historyDateMode === "all") return "All time";
        if (historyDateMode === "today") return format(new Date(), "PPP");
        if (!historyFrom || !historyTo) return "Select both dates";
        return `${historyFrom} → ${historyTo}`;
    }, [historyDateMode, historyFrom, historyTo]);

    const buildReceiptSale = useCallback(
        (sale: any): SaleForReceipt => ({
            id: sale.id,
            invoiceNumber: sale.invoiceNumber,
            soldAt: sale.soldAt,
            customerName: customer?.name ?? null,
            customerPhone: customer?.phone ?? null,
            paymentMethod: sale.paymentMethod,
            totalPrice: sale.totalPrice,
            discount: sale.discount,
            discountPercent: sale.discountPercent,
            refundedAmount: sale.refundedAmount,
            cashReceived: sale.cashReceived,
            saleItems: sale.saleItems,
        }),
        [customer],
    );

    const exportHistoryPdf = useCallback(async () => {
        if (!historyEntries.length) {
            toast.error("No records in the selected range.");
            return;
        }
        setExportingPdf(true);
        try {
            const [{ default: jsPDF }, { default: autoTable }] = await Promise.all([
                import("jspdf"),
                import("jspdf-autotable"),
            ]);
            const doc = new jsPDF({ orientation: "portrait", unit: "pt", format: "a4" });
            const margin = 40;
            let y = margin;
            doc.setFontSize(15);
            doc.setTextColor(127, 29, 29);
            doc.text("Customer account history", margin, y);
            y += 20;
            doc.setFontSize(10);
            doc.setTextColor(60, 60, 60);
            doc.text(`Customer: ${customer?.name ?? "—"}`, margin, y);
            y += 14;
            if (customer?.phone) {
                doc.text(`Phone: ${customer.phone}`, margin, y);
                y += 14;
            }
            doc.text(`Range: ${historyRangeLabel}`, margin, y);
            y += 14;
            doc.text(`Credit balance: Rs ${(Number(customer?.creditBalance) || 0).toLocaleString()}`, margin, y);
            y += 14;
            doc.text(`Generated: ${new Date().toLocaleString("en-GB")}`, margin, y);
            y += 20;

            const body = historyEntries.map((entry) => {
                if (entry.kind === "sale") {
                    const s = entry.sale;
                    const refunded = Number(s.refundedAmount) || 0;
                    const total = Number(s.totalPrice) || 0;
                    const net = total - refunded;
                    const refundNote =
                        refunded <= 0
                            ? "—"
                            : refunded >= total
                              ? "Fully refunded"
                              : `Refunded Rs ${refunded.toLocaleString()}`;
                    return [
                        entry.at.toLocaleString("en-GB"),
                        "Purchase",
                        s.invoiceNumber ?? "—",
                        PAYMENT_LABELS[s.paymentMethod as string] ?? s.paymentMethod ?? "—",
                        `Rs ${total.toLocaleString()}`,
                        refundNote,
                        `Rs ${net.toLocaleString()}`,
                    ];
                }
                const paid = Math.abs(Number(entry.tx.amount) || 0);
                return [
                    entry.at.toLocaleString("en-GB"),
                    "Payment received",
                    entry.tx.reference || "Payment",
                    "Cash / credit settlement",
                    "—",
                    "—",
                    `Rs ${paid.toLocaleString()}`,
                ];
            });

            autoTable(doc, {
                head: [["Date", "Type", "Invoice / Reference", "Payment", "Gross", "Refund", "Net / Received"]],
                body,
                foot: [
                    [
                        "Summary",
                        `${filteredSales.length} purchase(s)`,
                        `${filteredPayments.length} payment(s)`,
                        "—",
                        `Rs ${historySummary.grossPurchases.toLocaleString()}`,
                        historySummary.totalRefunded > 0
                            ? `Rs ${historySummary.totalRefunded.toLocaleString()}`
                            : "—",
                        `Net Rs ${historySummary.netPurchases.toLocaleString()} · Paid Rs ${historySummary.paymentsReceived.toLocaleString()}`,
                    ],
                ],
                startY: y,
                styles: { fontSize: 8, cellPadding: 5 },
                headStyles: { fillColor: [185, 28, 28], textColor: 255 },
                footStyles: { fillColor: [243, 244, 246], textColor: 17, fontStyle: "bold" },
                margin: { left: margin, right: margin },
            });

            doc.save(
                `customer-history-${(customer?.name ?? "customer").replace(/\s+/g, "-")}-${format(new Date(), "yyyy-MM-dd")}.pdf`,
            );
        } catch (e) {
            console.error(e);
            toast.error("Could not create PDF.");
        } finally {
            setExportingPdf(false);
        }
    }, [historyEntries, filteredSales.length, filteredPayments.length, historySummary, customer, historyRangeLabel]);

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gray-50/80">
                <Loading />
            </div>
        );
    }

    if (!customer) {
        return (
            <div className="p-10 text-center">
                <h2 className="text-2xl font-bold text-gray-700">Customer not found</h2>
                <Button onClick={() => router.back()} className="mt-4">
                    Go Back
                </Button>
            </div>
        );
    }

    const totalSpent = customer.sales?.reduce((sum: number, sale: any) => sum + sale.totalPrice, 0) || 0;

    return (
        <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.5 }}
            className="p-6 md:p-10 max-w-7xl mx-auto min-h-screen bg-gradient-to-br from-gray-50 to-gray-100"
        >
            <Button
                variant="ghost"
                onClick={() => router.back()}
                className="mb-6 text-red-700 hover:bg-red-50 hover:text-red-900"
            >
                <ArrowLeft className="mr-2 h-4 w-4" />
                Back to Customers
            </Button>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                {/* Customer Info Card */}
                <Card className="col-span-1 md:col-span-1 shadow-lg border-t-4 border-t-red-700 flex flex-col">
                    <CardHeader className="bg-red-50/50 pb-4">
                        <CardTitle className="text-2xl font-bold text-red-900 flex items-center gap-2">
                            <User className="h-6 w-6" />
                            {customer.name}
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="pt-6 flex-1">
                        <div className="space-y-4">
                            <div className="flex items-center gap-3 text-gray-700 text-lg">
                                <Phone className="h-5 w-5 text-gray-400" />
                                <span>{customer.phone}</span>
                            </div>
                            {customer.email && (
                                <div className="flex items-center gap-3 text-gray-700 text-lg">
                                    <Mail className="h-5 w-5 text-gray-400" />
                                    <span>{customer.email}</span>
                                </div>
                            )}
                            {customer.address && (
                                <div className="flex flex-col gap-1 text-gray-700 text-lg">
                                    <div className="flex items-center gap-3">
                                        <MapPin className="h-5 w-5 text-gray-400" />
                                        <span>Home Address</span>
                                    </div>
                                    <span className="pl-8 text-sm text-gray-500">{customer.address}</span>
                                </div>
                            )}
                            <div className="flex items-center gap-3 text-gray-700 text-lg">
                                <Calendar className="h-5 w-5 text-gray-400" />
                                <span>Joined {format(new Date(customer.createdAt), "MMM d, yyyy")}</span>
                            </div>
                            <div className="flex items-center gap-3 text-lg">
                                <Wallet className="h-5 w-5 text-gray-400" />
                                <span className="text-gray-700">Credit balance:</span>
                                <span className={`font-bold ${(customer.creditBalance || 0) > 0 ? "text-amber-700" : "text-gray-900"}`}>
                                    Rs {(Number(customer.creditBalance) || 0).toLocaleString()}
                                </span>
                            </div>
                        </div>

                        <div className="mt-6 pt-4 border-t border-gray-100">
                            <p className="text-sm text-gray-500 uppercase tracking-wider font-semibold mb-2">Record payment</p>
                            <form
                                className="flex flex-wrap gap-2 items-end"
                                onSubmit={async (e) => {
                                    e.preventDefault();
                                    const amt = parseFloat(paymentAmount);
                                    if (!amt || amt <= 0) return;
                                    setPaymentSubmitting(true);
                                    try {
                                        await axios.post(
                                            `${API}/pharmacist/customer/${params.id}/payment`,
                                            { amount: amt, reference: paymentReference || undefined },
                                            { headers: { Authorization: `Bearer ${accessToken}` } }
                                        );
                                        toast.success("Payment recorded.");
                                        setPaymentAmount("");
                                        setPaymentReference("");
                                        fetchCustomer();
                                        fetchTransactions();
                                    } catch (err: any) {
                                        toast.error(err.response?.data?.message ?? "Failed to record payment.");
                                    } finally {
                                        setPaymentSubmitting(false);
                                    }
                                }}
                            >
                                <div>
                                    <Label className="text-xs">Amount (Rs)</Label>
                                    <Input
                                        type="number"
                                        min="0.01"
                                        step="0.01"
                                        placeholder="0"
                                        value={paymentAmount}
                                        onChange={(e) => setPaymentAmount(e.target.value)}
                                        className="w-28 mt-0.5"
                                    />
                                </div>
                                <div>
                                    <Label className="text-xs">Reference (optional)</Label>
                                    <Input
                                        placeholder="e.g. Cash"
                                        value={paymentReference}
                                        onChange={(e) => setPaymentReference(e.target.value)}
                                        className="w-32 mt-0.5"
                                    />
                                </div>
                                <Button
                                    type="submit"
                                    size="sm"
                                    className="bg-red-800 hover:bg-red-900"
                                    disabled={!paymentAmount || parseFloat(paymentAmount) <= 0 || paymentSubmitting}
                                >
                                    {paymentSubmitting ? "..." : "Record"}
                                </Button>
                            </form>
                        </div>

                        <div className="mt-8 pt-6 border-t border-gray-100 flex justify-between items-center">
                            <div>
                                <p className="text-sm text-gray-500 uppercase tracking-wider font-semibold">Total Purchases</p>
                                <p className="text-3xl font-bold text-gray-900 mt-2">{customer.sales?.length || 0}</p>
                            </div>
                            <div className="text-right">
                                <p className="text-sm text-gray-500 uppercase tracking-wider font-semibold">Total Amount Spent</p>
                                <p className="text-3xl font-bold text-gray-900 mt-2">PKR {totalSpent.toLocaleString()}</p>
                            </div>
                        </div>
                    </CardContent>
                </Card>

                {/* Purchase History */}
                <Card className="col-span-1 md:col-span-2 shadow-lg border-0">
                    <CardHeader className="border-b bg-gray-50/50">
                        <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3">
                            <div>
                                <CardTitle className="text-xl font-bold text-gray-800 flex items-center gap-2">
                                    <Receipt className="h-5 w-5 text-red-700" />
                                    Purchase History
                                </CardTitle>
                                <p className="text-xs text-gray-500 mt-1">
                                    Invoices, refunds, and credit payments in one timeline.
                                </p>
                            </div>
                            <Button
                                type="button"
                                variant="outline"
                                size="sm"
                                className="border-red-200 text-red-800 hover:bg-red-50 shrink-0"
                                disabled={!historyEntries.length || exportingPdf || historyRange === null}
                                onClick={() => void exportHistoryPdf()}
                            >
                                <Download className="h-4 w-4 mr-2" />
                                {exportingPdf ? "PDF…" : "Print / Export PDF"}
                            </Button>
                        </div>
                        <div className="mt-3 flex flex-wrap items-center gap-2">
                            {(
                                [
                                    ["all", "All time"],
                                    ["today", "Today"],
                                    ["custom", "Custom"],
                                ] as const
                            ).map(([key, label]) => (
                                <Button
                                    key={key}
                                    type="button"
                                    size="sm"
                                    variant={historyDateMode === key ? "default" : "outline"}
                                    className={
                                        historyDateMode === key
                                            ? "bg-red-800 hover:bg-red-700 text-white h-8"
                                            : "border-gray-200 h-8"
                                    }
                                    onClick={() => setHistoryDateMode(key)}
                                >
                                    {label}
                                </Button>
                            ))}
                            <span className="text-xs text-gray-500 ml-1">
                                {filteredSales.length} purchase(s)
                                {filteredPayments.length > 0 && ` · ${filteredPayments.length} payment(s)`}
                                {" · "}Net Rs {historySummary.netPurchases.toLocaleString()}
                                {historySummary.paymentsReceived > 0 &&
                                    ` · Paid Rs ${historySummary.paymentsReceived.toLocaleString()}`}
                            </span>
                        </div>
                        {historyDateMode === "custom" && (
                            <div className="mt-3 flex flex-wrap items-end gap-3">
                                <div>
                                    <Label className="text-xs text-gray-600">From</Label>
                                    <Input
                                        type="date"
                                        value={historyFrom}
                                        onChange={(e) => setHistoryFrom(e.target.value)}
                                        className="mt-1 w-[150px] border border-gray-300 bg-white shadow-sm"
                                    />
                                </div>
                                <div>
                                    <Label className="text-xs text-gray-600">To</Label>
                                    <Input
                                        type="date"
                                        value={historyTo}
                                        onChange={(e) => setHistoryTo(e.target.value)}
                                        className="mt-1 w-[150px] border border-gray-300 bg-white shadow-sm"
                                    />
                                </div>
                            </div>
                        )}
                    </CardHeader>
                    <CardContent className="p-0">
                        {!customer.sales?.length && transactions.filter((tx) => Number(tx.amount) < 0).length === 0 ? (
                            <div className="p-10 text-center text-gray-500">
                                <p className="text-lg">No purchases or payments recorded yet.</p>
                            </div>
                        ) : historyDateMode === "custom" && (!historyFrom || !historyTo) ? (
                            <div className="p-10 text-center text-gray-500">
                                <p className="text-lg">Select both dates to view history.</p>
                            </div>
                        ) : historyEntries.length === 0 ? (
                            <div className="p-10 text-center text-gray-500">
                                <p className="text-lg">No records in the selected range.</p>
                            </div>
                        ) : (
                            <div className="divide-y divide-gray-100 max-h-[600px] overflow-y-auto">
                                {historyEntries.map((entry) => {
                                    if (entry.kind === "payment") {
                                        const paid = Math.abs(Number(entry.tx.amount) || 0);
                                        return (
                                            <div
                                                key={`payment-${entry.id}`}
                                                className="p-6 bg-green-50/40 hover:bg-green-50/70 transition-colors"
                                            >
                                                <div className="flex justify-between items-start gap-4">
                                                    <div>
                                                        <div className="flex flex-wrap items-center gap-2 mb-1">
                                                            <Badge className="bg-green-700 hover:bg-green-700 text-white border-0">
                                                                Payment received
                                                            </Badge>
                                                            <Badge variant="secondary">Credit settlement</Badge>
                                                        </div>
                                                        <p className="font-semibold text-gray-900 text-lg">
                                                            {format(entry.at, "PPP 'at' p")}
                                                        </p>
                                                        <p className="text-sm text-gray-600 mt-0.5">
                                                            {entry.tx.reference || "Payment against credit balance"}
                                                        </p>
                                                    </div>
                                                    <p className="font-bold text-green-700 text-xl shrink-0">
                                                        Rs {paid.toLocaleString()}
                                                    </p>
                                                </div>
                                            </div>
                                        );
                                    }

                                    const sale = entry.sale;
                                    const refunded = Number(sale.refundedAmount) || 0;
                                    const total = Number(sale.totalPrice) || 0;
                                    const net = total - refunded;
                                    const refundLabel = saleRefundLabel(sale);

                                    return (
                                        <div key={sale.id} className="p-6 hover:bg-gray-50 transition-colors">
                                            <div className="flex justify-between items-start mb-4 gap-4">
                                                <div>
                                                    <div className="flex flex-wrap items-center gap-2 mb-1">
                                                        <p className="text-xs font-mono font-semibold text-red-700">
                                                            Invoice #{sale.invoiceNumber || "—"}
                                                        </p>
                                                        {sale.paymentMethod === "CREDIT" && (
                                                            <Badge variant="secondary" className="text-amber-800 bg-amber-100 border-amber-200">
                                                                Credit
                                                            </Badge>
                                                        )}
                                                        {refundLabel && (
                                                            <Badge variant="destructive" className="bg-amber-600 hover:bg-amber-600 border-0">
                                                                {refundLabel}
                                                            </Badge>
                                                        )}
                                                    </div>
                                                    <p className="font-semibold text-gray-900 text-lg">
                                                        {format(entry.at, "PPP 'at' p")}
                                                    </p>
                                                    <p className="text-sm text-gray-500">
                                                        {sale.saleItems.length} item(s)
                                                        {" · "}
                                                        {PAYMENT_LABELS[sale.paymentMethod as string] ?? sale.paymentMethod ?? "—"}
                                                    </p>
                                                </div>
                                                <div className="text-right flex flex-col items-end gap-2 shrink-0">
                                                    {refunded > 0 ? (
                                                        <>
                                                            <p className="text-sm text-gray-400 line-through">
                                                                Rs {total.toLocaleString()}
                                                            </p>
                                                            <p className="font-bold text-red-700 text-xl">
                                                                Rs {net.toLocaleString()}
                                                            </p>
                                                        </>
                                                    ) : (
                                                        <p className="font-bold text-red-700 text-xl">
                                                            Rs {total.toLocaleString()}
                                                        </p>
                                                    )}
                                                    <Button
                                                        type="button"
                                                        variant="outline"
                                                        size="sm"
                                                        className="text-red-700 border-red-200 hover:bg-red-50 h-8 text-xs"
                                                        onClick={() => setViewSale(buildReceiptSale(sale))}
                                                    >
                                                        <Printer className="h-3.5 w-3.5 mr-1" />
                                                        Invoice
                                                    </Button>
                                                </div>
                                            </div>

                                            <div className="bg-white rounded-lg border p-4 space-y-3">
                                                {sale.saleItems.map((item: any) => (
                                                    <div key={item.id} className="flex justify-between items-center text-sm md:text-base">
                                                        <div className="flex items-center gap-2">
                                                            <span className="font-medium text-gray-800 bg-gray-100 px-2 py-1 rounded">
                                                                {item.quantity}x
                                                            </span>
                                                            <span className="text-gray-700">{item.inventoryItem?.name || "Unknown Item"}</span>
                                                        </div>
                                                        <span className="text-gray-600">Rs {(item.salePrice * item.quantity).toLocaleString()}</span>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        )}
                    </CardContent>
                </Card>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
                {/* Credit / Transactions */}
                <Card className="shadow-lg border-0">
                    <CardHeader className="border-b bg-gray-50/50">
                        <CardTitle className="text-xl font-bold text-gray-800 flex items-center gap-2">
                            <Banknote className="h-5 w-5 text-red-700" />
                            Credit &amp; Payments
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="p-0">
                        {transactions.length === 0 ? (
                            <div className="p-6 text-center text-gray-500">No transactions yet.</div>
                        ) : (
                            <ul className="divide-y divide-gray-100 max-h-[280px] overflow-y-auto">
                                {transactions.map((tx: any) => (
                                    <li key={tx.id} className="p-4 flex justify-between items-center">
                                        <div>
                                            <p className="text-sm text-gray-600">{tx.reference || "—"}</p>
                                            <p className="text-xs text-gray-400">{format(new Date(tx.createdAt), "PPp")}</p>
                                        </div>
                                        <span className={`font-semibold ${tx.amount >= 0 ? "text-amber-700" : "text-green-700"}`}>
                                            {tx.amount >= 0 ? "+" : ""}Rs {tx.amount.toLocaleString()}
                                        </span>
                                    </li>
                                ))}
                            </ul>
                        )}
                    </CardContent>
                </Card>

                {/* Reminders */}
                <Card className="shadow-lg border-0">
                    <CardHeader className="border-b bg-gray-50/50 flex flex-row items-center justify-between">
                        <CardTitle className="text-xl font-bold text-gray-800 flex items-center gap-2">
                            <Bell className="h-5 w-5 text-red-700" />
                            Reminders
                        </CardTitle>
                        <Button
                            size="sm"
                            className="bg-red-800 hover:bg-red-900"
                            onClick={() => setReminderOpen(true)}
                        >
                            <MessageSquare className="h-4 w-4 mr-1" />
                            Log reminder
                        </Button>
                    </CardHeader>
                    <CardContent className="p-0">
                        {reminders.length === 0 ? (
                            <div className="p-6 text-center text-gray-500">No reminders logged yet.</div>
                        ) : (
                            <ul className="divide-y divide-gray-100 max-h-[280px] overflow-y-auto">
                                {reminders.map((r: any) => (
                                    <li key={r.id} className="p-4">
                                        <div className="flex justify-between items-start">
                                            <span className="font-medium text-gray-800">{r.type}</span>
                                            <span className="text-xs text-gray-400">{format(new Date(r.sentAt), "PPp")}</span>
                                        </div>
                                        <p className="text-sm text-gray-600 mt-0.5">{r.channel}{r.note ? ` · ${r.note}` : ""}</p>
                                    </li>
                                ))}
                            </ul>
                        )}
                    </CardContent>
                </Card>
            </div>

            <SaleInvoiceDialog
                sale={viewSale}
                open={!!viewSale}
                onOpenChange={(open) => {
                    if (!open) setViewSale(null);
                }}
            />

            <Dialog open={reminderOpen} onOpenChange={setReminderOpen}>
                <DialogContent className="max-w-sm">
                    <form
                        onSubmit={async (e) => {
                            e.preventDefault();
                            setReminderSubmitting(true);
                            try {
                                await axios.post(
                                    `${API}/pharmacist/customer/${params.id}/reminder`,
                                    { type: reminderType, channel: reminderChannel, note: reminderNote || undefined },
                                    { headers: { Authorization: `Bearer ${accessToken}` } }
                                );
                                toast.success("Reminder logged.");
                                setReminderOpen(false);
                                setReminderNote("");
                                fetchReminders();
                            } catch (err: any) {
                                toast.error(err.response?.data?.message ?? "Failed to log reminder.");
                            } finally {
                                setReminderSubmitting(false);
                            }
                        }}
                    >
                        <DialogHeader>
                            <DialogTitle>Log reminder</DialogTitle>
                        </DialogHeader>
                        <div className="space-y-4 py-2">
                            <div>
                                <Label>Type</Label>
                                <select
                                    value={reminderType}
                                    onChange={(e) => setReminderType(e.target.value)}
                                    className="mt-1 w-full rounded-md border border-gray-300 px-3 py-2"
                                >
                                    <option value="REFILL">Refill</option>
                                    <option value="FOLLOW_UP">Follow-up</option>
                                    <option value="EXPIRY">Expiry</option>
                                </select>
                            </div>
                            <div>
                                <Label>Channel</Label>
                                <select
                                    value={reminderChannel}
                                    onChange={(e) => setReminderChannel(e.target.value)}
                                    className="mt-1 w-full rounded-md border border-gray-300 px-3 py-2"
                                >
                                    <option value="SMS">SMS</option>
                                    <option value="EMAIL">Email</option>
                                </select>
                            </div>
                            <div>
                                <Label>Note (optional)</Label>
                                <Input
                                    value={reminderNote}
                                    onChange={(e) => setReminderNote(e.target.value)}
                                    placeholder="e.g. Refill due next week"
                                    className="mt-1"
                                />
                            </div>
                        </div>
                        <DialogFooter>
                            <Button type="button" variant="outline" onClick={() => setReminderOpen(false)}>
                                Cancel
                            </Button>
                            <Button type="submit" className="bg-red-800 hover:bg-red-900" disabled={reminderSubmitting}>
                                {reminderSubmitting ? "..." : "Log reminder"}
                            </Button>
                        </DialogFooter>
                    </form>
                </DialogContent>
            </Dialog>
        </motion.div>
    );
}
