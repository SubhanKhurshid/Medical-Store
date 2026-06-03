"use client";

import { useState, useEffect, useCallback } from "react";
import { DataTable } from "@/components/shared/DataTable";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { motion, AnimatePresence } from "framer-motion";
import { Search, PlusCircle, Building2, Calendar, Receipt, Pencil, Trash2, Loader2 } from "lucide-react";
import Loading from "@/components/shared/Loading";
import { Button } from "@/components/ui/button";
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

const SupplierPayments = () => {
    const [search, setSearch] = useState("");
    const [payments, setPayments] = useState<Payment[]>([]);
    const [loading, setLoading] = useState(true);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [page, setPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);
    const [total, setTotal] = useState(0);
    const LIMIT = 20;
    const [editPayment, setEditPayment] = useState<SupplierPaymentEdit | null>(null);
    const [selectedPayment, setSelectedPayment] = useState<Payment | null>(null);
    const [paymentToDelete, setPaymentToDelete] = useState<Payment | null>(null);
    const [isDeleting, setIsDeleting] = useState(false);
    const { user } = useAuth();
    const accessToken = user?.access_token;

    const fetchPayments = useCallback(async (targetPage = 1) => {
        setLoading(true);
        try {
            const headers: HeadersInit = {};
            if (accessToken) {
                (headers as Record<string, string>).Authorization = `Bearer ${accessToken}`;
            }

            const response = await fetch(
                `${process.env.NEXT_PUBLIC_API_BASE_URL}/pharmacist/supplier-payments?page=${targetPage}&limit=${LIMIT}`,
                { headers },
            );
            if (!response.ok) {
                throw new Error("Failed to fetch payments");
            }

            const result = await response.json();
            const items = result.data ?? result;
            const mappedData = items.map((item: {
                id: string;
                vendorId?: string;
                vendor?: { id: string; name: string };
                manufacturer?: { companyName: string };
                amount: number;
                paymentDate: string;
                reference?: string;
                paymentMethod?: string;
            }) => ({
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
    }, [accessToken, LIMIT]);

    useEffect(() => {
        fetchPayments(1);
    }, [fetchPayments]);

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
                                        data={payments.filter(
                                            (p) =>
                                                p.payeeLabel?.toLowerCase().includes(search?.toLowerCase()) ||
                                                p.reference?.toLowerCase().includes(search?.toLowerCase()),
                                        )}
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
