"use client";

import { useState, useEffect } from "react";
import { DataTable } from "@/components/shared/DataTable";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { motion, AnimatePresence } from "framer-motion";
import { Search, PlusCircle, Loader2, FileText, Calendar, Building2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import Link from "next/link";

interface Invoice {
    id: string;
    invoiceNumber: string;
    manufacturer: string;
    totalAmount: number;
    date: string;
    status: string;
}

export default function PurchaseInvoicesPage() {
    const [search, setSearch] = useState("");
    const [invoices, setInvoices] = useState<Invoice[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchInvoices = async () => {
            setLoading(true);
            try {
                const response = await fetch(
                    `${process.env.NEXT_PUBLIC_API_BASE_URL}/pharmacist/purchase-invoices`
                );
                if (!response.ok) throw new Error("Failed to fetch invoices");

                const data = await response.json();
                const mappedData = data.map((item: any) => ({
                    id: item.id,
                    invoiceNumber: item.invoiceNumber,
                    manufacturer: item.manufacturer?.companyName || "Unknown",
                    totalAmount: item.totalAmount,
                    date: new Date(item.date).toLocaleDateString(),
                    status: item.status,
                }));
                setInvoices(mappedData);
            } catch (error) {
                console.error("Error:", error);
            } finally {
                setLoading(false);
            }
        };
        fetchInvoices();
    }, []);

    const columns = [
        {
            id: "invoiceNumber",
            header: "Invoice #",
            cell: ({ row }: any) => (
                <div className="flex items-center space-x-2">
                    <FileText className="h-4 w-4 text-gray-500" />
                    <span className="font-medium text-red-700">{row.original.invoiceNumber}</span>
                </div>
            ),
        },
        {
            id: "manufacturer",
            header: "Supplier",
            cell: ({ row }: any) => (
                <div className="flex items-center space-x-2">
                    <Building2 className="h-4 w-4 text-gray-500" />
                    <span>{row.original.manufacturer}</span>
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
            id: "totalAmount",
            header: "Total Amount",
            cell: ({ row }: any) => (
                <div className="flex items-center space-x-2">
                   
                    <span className="font-medium">{row.original.totalAmount.toLocaleString()} Rs</span>
                </div>
            ),
        },
        {
            id: "status",
            header: "Status",
            cell: ({ row }: any) => (
                <span className={`px-2 py-1 rounded-full text-xs font-semibold ${row.original.status === 'CONFIRMED' ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'
                    }`}>
                    {row.original.status}
                </span>
            ),
        },
    ];

    return (
        <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.5 }}
            className="p-6 md:p-10 max-w-9xl mx-auto min-h-screen bg-gray-50 bg-gradient-to-br from-gray-50 to-gray-100"
        >
            <Card className="bg-white shadow-xl border-0 rounded-xl overflow-hidden">
                <CardHeader className="text-red-800 p-6 border-b-2 border-red-700">
                    <CardTitle className="text-3xl md:text-4xl font-bold">
                        Purchase Invoices
                    </CardTitle>
                    <p className="text-gray-500 mt-2 text-xl">
                        View existing purchase invoices and register new incoming stock
                    </p>
                </CardHeader>
                <CardContent className="p-6">
                    <div className="flex flex-col sm:flex-row justify-between gap-4 mb-6">
                        <div className="relative w-full sm:w-1/3">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                            <Input
                                placeholder="Search invoices..."
                                value={search}
                                onChange={(e) => setSearch(e.target.value)}
                                className="pl-10 pr-4 py-2 bg-white border border-gray-200 rounded-lg text-xl"
                            />
                        </div>
                        <Link href="/pharmacist/purchase-invoices/create">
                            <Button className="bg-red-800 hover:bg-red-900 text-white transition-colors duration-200 text-xl w-full sm:w-auto">
                                <PlusCircle className="mr-2 h-4 w-4" />
                                Add New Invoice
                            </Button>
                        </Link>
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
                                    data={invoices.filter(
                                        (i) =>
                                            i.invoiceNumber.toLowerCase().includes(search.toLowerCase()) ||
                                            i.manufacturer.toLowerCase().includes(search.toLowerCase())
                                    )}
                                />
                            </motion.div>
                        )}
                    </AnimatePresence>
                </CardContent>
            </Card>
        </motion.div>
    );
}
