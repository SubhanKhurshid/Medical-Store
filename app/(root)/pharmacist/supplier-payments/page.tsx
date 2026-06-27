"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { DataTable } from "@/components/shared/DataTable";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import { motion, AnimatePresence } from "framer-motion";
import { Search, PlusCircle, Building2, Calendar, Receipt, Pencil, Trash2, Loader2, Download } from "lucide-react";
import Loading from "@/components/shared/Loading";
import { Button } from "@/components/ui/button";
import { format } from "date-fns";
import PaymentModal, { type SupplierPaymentEdit } from "./Modal";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogDescription,
    DialogFooter,
} from "@/components/ui/dialog";
import { useAuth } from "@/app/providers/AuthProvider";
import { toast } from "sonner";
import axios from "axios";
import { parseApiList } from "@/lib/api";
import { PaginationControls } from "@/components/shared/PaginationControls";

interface Payment {
    id: string;
    vendorId: string;
    payeeLabel: string;
    amount: number;
    date: string;
    reference: string;
    paymentMethod: string;
}

type DateRangeMode = "all" | "today" | "custom";

function apiRange(
    mode: DateRangeMode,
    customFrom: string,
    customTo: string,
): { start?: string; end?: string } | null {
    switch (mode) {
        case "all":
            return {};
        case "today": {
            const today = format(new Date(), "yyyy-MM-dd");
            return { start: today, end: today };
        }
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
    return `${r.start} → ${r.end}`;
}

const SupplierPayments = () => {
    const [search, setSearch] = useState("");
    const searchDebounceRef = useRef<ReturnType<typeof setTimeout>>();
    const [payments, setPayments] = useState<Payment[]>([]);
    const [loading, setLoading] = useState(true);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [page, setPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);
    const [total, setTotal] = useState(0);
    const LIMIT = 20;
    const [dateRangeMode, setDateRangeMode] = useState<DateRangeMode>("all");
    const [customFrom, setCustomFrom] = useState("");
    const [customTo, setCustomTo] = useState("");
    const [exportingPdf, setExportingPdf] = useState(false);
    const [editPayment, setEditPayment] = useState<SupplierPaymentEdit | null>(null);
    const [selectedPayment, setSelectedPayment] = useState<Payment | null>(null);
    const [paymentToDelete, setPaymentToDelete] = useState<Payment | null>(null);
    const [isDeleting, setIsDeleting] = useState(false);
    const { user } = useAuth();
    const accessToken = user?.access_token;

    const fetchPayments = useCallback(async (targetPage = 1, searchOverride?: string) => {
        const range = apiRange(dateRangeMode, customFrom, customTo);
        if (range === null) {
            setPayments([]);
            setTotal(0);
            setTotalPages(1);
            setLoading(false);
            return;
        }
        setLoading(true);
        try {
            const headers: HeadersInit = {};
            if (accessToken) {
                (headers as Record<string, string>).Authorization = `Bearer ${accessToken}`;
            }
            const activeSearch = searchOverride !== undefined ? searchOverride : search;
            const params = new URLSearchParams();
            params.append("page", String(targetPage));
            params.append("limit", String(LIMIT));
            if (activeSearch.trim()) params.append("search", activeSearch.trim());
            if (range.start) params.append("startDate", range.start);
            if (range.end) params.append("endDate", range.end);
            const response = await fetch(
                `${process.env.NEXT_PUBLIC_API_BASE_URL}/pharmacist/supplier-payments?${params.toString()}`,
                { headers },
            );
            if (!response.ok) {
                throw new Error("Failed to fetch payments");
            }

            const result = await response.json();
            const items = parseApiList<{
                id: string;
                vendorId?: string;
                vendor?: { id: string; name: string };
                manufacturer?: { companyName: string };
                amount: number;
                paymentDate: string;
                reference?: string;
                paymentMethod?: string;
            }>(result);
            const mappedData = items.map((item) => ({
                id: item.id,
                vendorId: item.vendorId || item.vendor?.id || "",
                payeeLabel:
                    item.vendor?.name ||
                    item.manufacturer?.companyName ||
                    "Unknown",
                amount: item.amount,
                date: new Date(item.paymentDate).toLocaleDateString(),
                reference: item.reference || "-",
                paymentMethod: item.paymentMethod || "CASH",
            }));

            setPayments(mappedData);
            if (result.meta) {
                setTotalPages(result.meta.totalPages);
                setTotal(result.meta.total);
            }
        } catch (error) {
            console.error("Error fetching payments:", error);
            toast.error("Failed to load supplier payments");
        } finally {
            setLoading(false);
        }
    }, [accessToken, LIMIT, search, dateRangeMode, customFrom, customTo]);

    useEffect(() => {
        fetchPayments(1);
    }, [fetchPayments]);

    useEffect(() => {
        clearTimeout(searchDebounceRef.current);
        searchDebounceRef.current = setTimeout(() => {
            setPage(1);
            void fetchPayments(1, search);
        }, 300);
        return () => clearTimeout(searchDebounceRef.current);
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [search]);

    const exportPdf = useCallback(async () => {
        const range = apiRange(dateRangeMode, customFrom, customTo);
        if (range === null) {
            toast.error("Select both dates first.");
            return;
        }
        setExportingPdf(true);
        try {
            const headers: HeadersInit = {};
            if (accessToken) {
                (headers as Record<string, string>).Authorization = `Bearer ${accessToken}`;
            }
            // Fetch every page in the selected range so the PDF is complete.
            const EXPORT_LIMIT = 100;
            const rows: Payment[] = [];
            let targetPage = 1;
            let pages = 1;
            do {
                const params = new URLSearchParams();
                params.append("page", String(targetPage));
                params.append("limit", String(EXPORT_LIMIT));
                if (search.trim()) params.append("search", search.trim());
                if (range.start) params.append("startDate", range.start);
                if (range.end) params.append("endDate", range.end);
                const res = await fetch(
                    `${process.env.NEXT_PUBLIC_API_BASE_URL}/pharmacist/supplier-payments?${params.toString()}`,
                    { headers },
                );
                if (!res.ok) throw new Error("Failed to fetch payments");
                const result = await res.json();
                const items = parseApiList<{
                    id: string;
                    vendorId?: string;
                    vendor?: { id: string; name: string };
                    manufacturer?: { companyName: string };
                    amount: number;
                    paymentDate: string;
                    reference?: string;
                    paymentMethod?: string;
                }>(result);
                items.forEach((item) =>
                    rows.push({
                        id: item.id,
                        vendorId: item.vendorId || item.vendor?.id || "",
                        payeeLabel:
                            item.vendor?.name || item.manufacturer?.companyName || "Unknown",
                        amount: item.amount,
                        date: new Date(item.paymentDate).toLocaleDateString("en-GB"),
                        reference: item.reference || "-",
                        paymentMethod: item.paymentMethod || "CASH",
                    }),
                );
                pages = result.meta?.totalPages ?? 1;
                targetPage += 1;
            } while (targetPage <= pages);

            if (!rows.length) {
                toast.error("No payments to print in this range.");
                return;
            }

            const [{ default: jsPDF }, { default: autoTable }] = await Promise.all([
                import("jspdf"),
                import("jspdf-autotable"),
            ]);
            const doc = new jsPDF({ orientation: "portrait", unit: "pt", format: "a4" });
            const margin = 40;
            let y = margin;
            doc.setFontSize(15);
            doc.setTextColor(127, 29, 29);
            doc.text("Supplier payments", margin, y);
            y += 20;
            doc.setFontSize(10);
            doc.setTextColor(60, 60, 60);
            doc.text(`Range: ${rangeDescription(dateRangeMode, customFrom, customTo)}`, margin, y);
            y += 14;
            if (search.trim()) {
                doc.text(`Search: ${search.trim()}`, margin, y);
                y += 14;
            }
            doc.text(`Generated: ${new Date().toLocaleString("en-GB")}`, margin, y);
            y += 20;

            const totalAmount = rows.reduce((sum, p) => sum + (Number(p.amount) || 0), 0);

            autoTable(doc, {
                head: [["Vendor", "Date", "Method", "Reference", "Amount"]],
                body: rows.map((p) => [
                    p.payeeLabel,
                    p.date,
                    String(p.paymentMethod || "CASH").toLowerCase(),
                    p.reference,
                    `Rs ${(Number(p.amount) || 0).toLocaleString()}`,
                ]),
                foot: [
                    [
                        "Total",
                        "—",
                        "—",
                        `${rows.length} payment(s)`,
                        `Rs ${totalAmount.toLocaleString()}`,
                    ],
                ],
                startY: y,
                styles: { fontSize: 9, cellPadding: 5 },
                headStyles: { fillColor: [185, 28, 28], textColor: 255 },
                footStyles: { fillColor: [243, 244, 246], textColor: 17, fontStyle: "bold" },
                margin: { left: margin, right: margin },
            });

            doc.save(`supplier-payments-${format(new Date(), "yyyy-MM-dd")}.pdf`);
        } catch (e) {
            console.error(e);
            toast.error("Could not create PDF.");
        } finally {
            setExportingPdf(false);
        }
    }, [accessToken, dateRangeMode, customFrom, customTo, search]);

    const openCreateModal = () => {
        setEditPayment(null);
        setIsModalOpen(true);
    };

    const openEditModal = (payment: Payment) => {
        if (!payment.vendorId) {
            toast.error("Only vendor-linked payments can be edited here");
            return;
        }
        setEditPayment({
            id: payment.id,
            vendorId: payment.vendorId,
            amount: payment.amount,
            reference: payment.reference,
            paymentMethod: payment.paymentMethod as SupplierPaymentEdit["paymentMethod"],
        });
        setIsModalOpen(true);
    };

    const handleDelete = async () => {
        if (!paymentToDelete || !accessToken) return;
        setIsDeleting(true);
        try {
            await axios.delete(
                `${process.env.NEXT_PUBLIC_API_BASE_URL}/pharmacist/supplier-payment/${paymentToDelete.id}`,
                { headers: { Authorization: `Bearer ${accessToken}` } },
            );
            toast.success("Payment deleted");
            setPaymentToDelete(null);
            setSelectedPayment(null);
            fetchPayments();
        } catch (error) {
            console.error(error);
            toast.error("Failed to delete payment");
        } finally {
            setIsDeleting(false);
        }
    };

    const columns = [
        {
            accessorKey: "payeeLabel",
            header: "Vendor",
            cell: ({ row }: { row: { original: Payment } }) => (
                <div className="flex items-center space-x-2">
                    <Building2 className="h-4 w-4 text-gray-500" />
                    <span className="font-medium">{row.original.payeeLabel}</span>
                </div>
            ),
        },
        {
            accessorKey: "amount",
            header: "Amount Paid",
            cell: ({ row }: { row: { original: Payment } }) => (
                <span className="font-medium">{row.original.amount.toLocaleString()} Rs</span>
            ),
        },
        {
            accessorKey: "paymentMethod",
            header: "Method",
            cell: ({ row }: { row: { original: Payment } }) => (
                <span className="text-sm text-gray-700 capitalize">
                    {String(row.original.paymentMethod || "cash").toLowerCase()}
                </span>
            ),
        },
        {
            accessorKey: "date",
            header: "Date",
            cell: ({ row }: { row: { original: Payment } }) => (
                <div className="flex items-center space-x-2">
                    <Calendar className="h-4 w-4 text-gray-500" />
                    <span>{row.original.date}</span>
                </div>
            ),
        },
        {
            accessorKey: "reference",
            header: "Reference",
            cell: ({ row }: { row: { original: Payment } }) => <span>{row.original.reference}</span>,
        },
        {
            id: "actions",
            header: "Actions",
            enableSorting: false,
            cell: ({ row }: { row: { original: Payment } }) => (
                <div className="flex items-center gap-2">
                    <Button
                        variant="ghost"
                        size="sm"
                        className="text-gray-700 hover:bg-gray-100"
                        title="Edit payment"
                        disabled={!row.original.vendorId}
                        onClick={(e) => {
                            e.stopPropagation();
                            openEditModal(row.original);
                        }}
                    >
                        <Pencil className="h-4 w-4" />
                    </Button>
                    <Button
                        variant="ghost"
                        size="sm"
                        className="text-red-600 hover:bg-red-50"
                        title="Delete payment"
                        onClick={(e) => {
                            e.stopPropagation();
                            setPaymentToDelete(row.original);
                        }}
                    >
                        <Trash2 className="h-4 w-4" />
                    </Button>
                </div>
            ),
        },
    ];

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
                        Supplier Payments
                    </motion.h1>
                    <motion.p
                        className="mt-1 text-sm text-gray-500"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ delay: 0.1 }}
                    >
                        Track payments made to vendors (suppliers).
                    </motion.p>
                    <div className="mt-4 h-px bg-gradient-to-r from-red-200/80 via-red-100/50 to-transparent rounded-full" />
                </header>

                <Card className="overflow-hidden bg-white border border-gray-100 rounded-xl shadow-sm mb-6">
                    <div className="border-l-4 border-l-red-500 bg-red-50/30 px-5 py-3 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                        <div>
                            <h2 className="text-base font-semibold text-red-800">Print payments</h2>
                            <p className="text-xs text-gray-500 mt-0.5">
                                {rangeDescription(dateRangeMode, customFrom, customTo)}
                            </p>
                        </div>
                        <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            className="border-red-200 text-red-800 hover:bg-red-50 shrink-0"
                            disabled={exportingPdf || (dateRangeMode === "custom" && (!customFrom || !customTo))}
                            onClick={() => void exportPdf()}
                        >
                            <Download className="h-4 w-4 mr-2" />
                            {exportingPdf ? "Preparing…" : "Print / Export PDF"}
                        </Button>
                    </div>
                    <CardContent className="p-4 sm:p-5 space-y-4">
                        <div className="flex flex-wrap gap-2">
                            {(
                                [
                                    ["today", "Today"],
                                    ["all", "All time"],
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
                                    onClick={() => {
                                        setDateRangeMode(key);
                                        setPage(1);
                                    }}
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
                                        onChange={(e) => {
                                            setCustomFrom(e.target.value);
                                            setPage(1);
                                        }}
                                        className="mt-1 w-[160px] border border-gray-300 bg-white shadow-sm"
                                    />
                                </div>
                                <div>
                                    <Label className="text-xs text-gray-600">To</Label>
                                    <Input
                                        type="date"
                                        value={customTo}
                                        onChange={(e) => {
                                            setCustomTo(e.target.value);
                                            setPage(1);
                                        }}
                                        className="mt-1 w-[160px] border border-gray-300 bg-white shadow-sm"
                                    />
                                </div>
                            </div>
                        )}
                        {dateRangeMode === "custom" && (!customFrom || !customTo) && (
                            <p className="text-sm text-amber-800 bg-amber-50 border border-amber-100 rounded-lg px-3 py-2">
                                Select both <strong>From</strong> and <strong>To</strong> dates.
                            </p>
                        )}
                    </CardContent>
                </Card>

                <Card className="overflow-hidden bg-white border border-gray-100 rounded-xl shadow-sm hover:shadow-md transition-shadow">
                    <div className="border-l-4 border-l-red-500 bg-red-50/30 px-5 py-3">
                        <h2 className="text-base font-semibold text-red-800">Payment records</h2>
                        <p className="text-xs text-gray-500 mt-0.5">Search by vendor or reference.</p>
                    </div>
                    <CardContent className="p-4 sm:p-5">
                        <div className="flex flex-col sm:flex-row justify-between gap-4 mb-4">
                            <div className="relative flex-1 max-w-sm">
                                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                                <Input
                                    placeholder="Search by supplier or reference..."
                                    value={search}
                                    onChange={(e) => setSearch(e.target.value)}
                                    className="pl-9 h-10 border-gray-200 focus:border-red-500 focus:ring-red-500/20"
                                />
                            </div>
                            <Button
                                onClick={openCreateModal}
                                className="bg-red-800 hover:bg-red-700 text-white shrink-0"
                            >
                                <PlusCircle className="mr-2 h-4 w-4" />
                                Record Payment
                            </Button>
                        </div>

                        <AnimatePresence>
                            {loading ? (
                                <motion.div
                                    initial={{ opacity: 0 }}
                                    animate={{ opacity: 1 }}
                                    exit={{ opacity: 0 }}
                                    className="min-h-[280px] flex items-center justify-center"
                                >
                                    <Loading />
                                </motion.div>
                            ) : (
                                <motion.div
                                    initial={{ opacity: 0 }}
                                    animate={{ opacity: 1 }}
                                    transition={{ duration: 0.2 }}
                                    className="rounded-lg border border-gray-100 overflow-hidden"
                                >
                                    <DataTable
                                        columns={columns}
                                        data={payments}
                                        onRowClick={(p) => setSelectedPayment(p)}
                                        initialSorting={[{ id: "payeeLabel", desc: false }]}
                                    />
                                </motion.div>
                            )}
                        </AnimatePresence>
                        <PaginationControls
                            page={page}
                            totalPages={totalPages}
                            total={total}
                            limit={LIMIT}
                            loading={loading}
                            onPageChange={(p) => {
                                setPage(p);
                                fetchPayments(p);
                            }}
                        />
                    </CardContent>
                </Card>

                <PaymentModal
                    isOpen={isModalOpen}
                    onClose={() => {
                        setIsModalOpen(false);
                        setEditPayment(null);
                    }}
                    onSave={() => fetchPayments()}
                    editPayment={editPayment}
                    accessToken={accessToken}
                />

                <Dialog open={!!selectedPayment} onOpenChange={() => setSelectedPayment(null)}>
                    <DialogContent className="sm:max-w-[500px]">
                        <DialogHeader>
                            <DialogTitle className="text-red-800 flex items-center gap-2">
                                <Receipt className="h-5 w-5" />
                                Payment Details
                            </DialogTitle>
                        </DialogHeader>
                        {selectedPayment && (
                            <div className="space-y-4">
                                <div className="grid grid-cols-2 gap-4 text-sm">
                                    <div>
                                        <span className="text-muted-foreground">Vendor</span>
                                        <p className="font-medium text-foreground flex items-center gap-2 mt-1">
                                            <Building2 className="h-4 w-4 text-gray-500" />
                                            {selectedPayment.payeeLabel}
                                        </p>
                                    </div>
                                    <div>
                                        <span className="text-muted-foreground">Amount</span>
                                        <p className="font-semibold text-foreground mt-1">
                                            {selectedPayment.amount.toLocaleString()} Rs
                                        </p>
                                    </div>
                                    <div>
                                        <span className="text-muted-foreground">Date</span>
                                        <p className="font-medium text-foreground flex items-center gap-2 mt-1">
                                            <Calendar className="h-4 w-4 text-gray-500" />
                                            {selectedPayment.date}
                                        </p>
                                    </div>
                                    <div>
                                        <span className="text-muted-foreground">Reference</span>
                                        <p className="font-medium text-foreground mt-1">
                                            {selectedPayment.reference || "—"}
                                        </p>
                                    </div>
                                    <div>
                                        <span className="text-muted-foreground">Payment method</span>
                                        <p className="font-medium text-foreground mt-1 capitalize">
                                            {String(selectedPayment.paymentMethod || "cash").toLowerCase()}
                                        </p>
                                    </div>
                                </div>
                                <div className="flex gap-2 pt-2">
                                    <Button
                                        variant="outline"
                                        size="sm"
                                        disabled={!selectedPayment.vendorId}
                                        onClick={() => {
                                            openEditModal(selectedPayment);
                                            setSelectedPayment(null);
                                        }}
                                    >
                                        <Pencil className="h-4 w-4 mr-1" />
                                        Edit
                                    </Button>
                                    <Button
                                        variant="outline"
                                        size="sm"
                                        className="text-red-600 border-red-200 hover:bg-red-50"
                                        onClick={() => {
                                            setPaymentToDelete(selectedPayment);
                                            setSelectedPayment(null);
                                        }}
                                    >
                                        <Trash2 className="h-4 w-4 mr-1" />
                                        Delete
                                    </Button>
                                </div>
                            </div>
                        )}
                    </DialogContent>
                </Dialog>

                <Dialog open={!!paymentToDelete} onOpenChange={(o) => !o && setPaymentToDelete(null)}>
                    <DialogContent>
                        <DialogHeader>
                            <DialogTitle className="text-red-800">Delete payment?</DialogTitle>
                            <DialogDescription>
                                Remove payment of{" "}
                                <strong>{paymentToDelete?.amount.toLocaleString()} Rs</strong> to{" "}
                                <strong>{paymentToDelete?.payeeLabel}</strong>? Vendor balance will be
                                adjusted.
                            </DialogDescription>
                        </DialogHeader>
                        <DialogFooter>
                            <Button
                                variant="outline"
                                onClick={() => setPaymentToDelete(null)}
                                disabled={isDeleting}
                            >
                                Cancel
                            </Button>
                            <Button
                                variant="destructive"
                                onClick={() => void handleDelete()}
                                disabled={isDeleting}
                                className="bg-red-700"
                            >
                                {isDeleting ? (
                                    <>
                                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                        Deleting…
                                    </>
                                ) : (
                                    "Delete"
                                )}
                            </Button>
                        </DialogFooter>
                    </DialogContent>
                </Dialog>
            </div>
        </div>
    );
};

export default SupplierPayments;
