"use client";

import { useState, useEffect } from "react";
import { DataTable } from "@/components/shared/DataTable";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { motion, AnimatePresence } from "framer-motion";
import { Search, PlusCircle, Loader2, Building2, Calendar } from "lucide-react";
import { Button } from "@/components/ui/button";
import PaymentModal from "./Modal";

interface Payment {
    id: string;
    manufacturer: string;
    amount: number;
    date: string;
    reference: string;
}

const SupplierPayments = () => {
    const [search, setSearch] = useState("");
    const [payments, setPayments] = useState<Payment[]>([]);
    const [loading, setLoading] = useState(true);
    const [isModalOpen, setIsModalOpen] = useState(false);

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
            id: "manufacturer",
            header: "Supplier",
            cell: ({ row }: any) => (
                <div className="flex items-center space-x-2">
                    <Building2 className="h-4 w-4 text-gray-500" />
                    <span className="font-medium">{row.original.manufacturer}</span>
                </div>
            ),
        },
        {
            id: "amount",
            header: "Amount Paid",
            cell: ({ row }: any) => (
                <div className="flex items-center space-x-2">

                    <span className="font-medium">{row.original.amount.toLocaleString()} Rs</span>
                </div>
            ),
        },
        {
            id: "date",
            header: "Date",
            cell: ({ row }: any) => (
                <div className="flex items-center space-x-2">
                    <Calendar className="h-4 w-4 text-gray-500" />
                    <span>{row.original.date}</span>
                </div>
            ),
        },
        {
            id: "reference",
            header: "Reference",
            cell: ({ row }: any) => (
                <span>{row.original.reference}</span>
            ),
        },
    ];

    return (
        <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.5 }}
            className="p-6 md:p-10 max-w-9xl mx-auto min-h-screen bg-gradient-to-br from-gray-50 to-gray-100"
        >
            <Card className="bg-white shadow-xl border-0 rounded-xl overflow-hidden">
                <CardHeader className="text-red-800 p-6 border-b-2 border-red-700">
                    <CardTitle className="text-3xl md:text-4xl font-bold">
                        Supplier Payments
                    </CardTitle>
                    <p className="text-gray-500 mt-2 text-xl">
                        Track payments made to your manufacturers
                    </p>
                </CardHeader>
                <CardContent className="p-6">
                    <div className="flex flex-col sm:flex-row justify-between gap-4 mb-6">
                        <div className="relative w-full sm:w-1/3">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                            <Input
                                placeholder="Search..."
                                value={search}
                                onChange={(e) => setSearch(e.target.value)}
                                className="pl-10 pr-4 py-2 bg-white border border-gray-200 rounded-lg text-xl"
                            />
                        </div>
                        <Button
                            onClick={() => setIsModalOpen(true)}
                            className="bg-red-800 hover:bg-red-900 text-white transition-colors duration-200 text-xl"
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
                                className="flex justify-center items-center py-20"
                            >
                                <Loader2 className="animate-spin h-8 w-8 text-red-600" />
                            </motion.div>
                        ) : (
                            <motion.div
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ duration: 0.5 }}
                                className="rounded-lg border border-gray-200 bg-white overflow-hidden"
                            >
                                <DataTable
                                    columns={columns}
                                    data={payments.filter(
                                        (p) =>
                                            p.manufacturer?.toLowerCase().includes(search?.toLowerCase()) ||
                                            p.reference?.toLowerCase().includes(search?.toLowerCase())
                                    )}
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
        </motion.div>
    );
};

export default SupplierPayments;
