"use client";

import { useState, useEffect } from "react";
import { DataTable } from "@/components/shared/DataTable";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { motion, AnimatePresence } from "framer-motion";
import { Search, PlusCircle, Building2, Calendar, Receipt } from "lucide-react";
import Loading from "@/components/shared/Loading";
import { Button } from "@/components/ui/button";
import PaymentModal from "./Modal";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";

interface Payment {
    id: string;
    manufacturer: string;
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
    const [selectedPayment, setSelectedPayment] = useState<Payment | null>(null);

    const fetchPayments = async () => {
        setLoading(true);
        try {
            const response = await fetch(
                `${process.env.NEXT_PUBLIC_API_BASE_URL}/pharmacist/supplier-payments`
            );
            if (!response.ok) {
                throw new Error("Failed to fetch payments");
            }

            const data = await response.json();
            const mappedData = data.map((item: any) => ({
                id: item.id,
                manufacturer: item.manufacturer?.companyName || "Unknown",
                amount: item.amount,
                date: new Date(item.paymentDate).toLocaleDateString(),
                reference: item.reference || "-",
                paymentMethod: item.paymentMethod || "CASH",
            }));

            setPayments(mappedData);
        } catch (error) {
            console.error("Error fetching payments:", error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchPayments();
    }, []);

    const columns = [
        {
            accessorKey: "manufacturer",
            header: "Supplier",
            cell: ({ row }: any) => (
                <div className="flex items-center space-x-2">
                    <Building2 className="h-4 w-4 text-gray-500" />
                    <span className="font-medium">{row.original.manufacturer}</span>
                </div>
            ),
        },
        {
            accessorKey: "amount",
            header: "Amount Paid",
            cell: ({ row }: any) => (
                <div className="flex items-center space-x-2">

                    <span className="font-medium">{row.original.amount.toLocaleString()} Rs</span>
                </div>
            ),
        },
        {
            accessorKey: "paymentMethod",
            header: "Method",
            cell: ({ row }: any) => (
                <span className="text-sm text-gray-700 capitalize">
                    {String(row.original.paymentMethod || "cash").toLowerCase()}
                </span>
            ),
        },
        {
            accessorKey: "date",
            header: "Date",
            cell: ({ row }: any) => (
                <div className="flex items-center space-x-2">
                    <Calendar className="h-4 w-4 text-gray-500" />
                    <span>{row.original.date}</span>
                </div>
            ),
        },
        {
            accessorKey: "reference",
            header: "Reference",
            cell: ({ row }: any) => (
                <span>{row.original.reference}</span>
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
                    <motion.p className="mt-1 text-sm text-gray-500" initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.1 }}>
                        Track payments made to manufacturers.
                    </motion.p>
                    <div className="mt-4 h-px bg-gradient-to-r from-red-200/80 via-red-100/50 to-transparent rounded-full" />
                </header>

                <Card className="overflow-hidden bg-white border border-gray-100 rounded-xl shadow-sm hover:shadow-md transition-shadow">
                    <div className="border-l-4 border-l-red-500 bg-red-50/30 px-5 py-3">
                        <h2 className="text-base font-semibold text-red-800">Payment records</h2>
                        <p className="text-xs text-gray-500 mt-0.5">
                            Search by supplier or reference.
                        </p>
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
                            onClick={() => setIsModalOpen(true)}
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
                                            p.manufacturer?.toLowerCase().includes(search?.toLowerCase()) ||
                                            p.reference?.toLowerCase().includes(search?.toLowerCase())
                                    )}
                                    onRowClick={(p) => setSelectedPayment(p)}
                                    initialSorting={[{ id: "manufacturer", desc: false }]}
                                />
                            </motion.div>
                        )}
                    </AnimatePresence>
                    </CardContent>
                </Card>

            <PaymentModal
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
                onSave={(newPayment: any) => {
                    fetchPayments(); // Refresh the list
                }}
            />

            {/* Payment Details Modal */}
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
                                    <span className="text-muted-foreground">Supplier</span>
                                    <p className="font-medium text-foreground flex items-center gap-2 mt-1">
                                        <Building2 className="h-4 w-4 text-gray-500" />
                                        {selectedPayment.manufacturer}
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
                        </div>
                    )}
                </DialogContent>
            </Dialog>
            </div>
        </div>
    );
};

export default SupplierPayments;
