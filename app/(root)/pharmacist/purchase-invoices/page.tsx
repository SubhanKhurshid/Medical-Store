"use client";

import { useState, useEffect } from "react";
import { sortByLocaleKey } from "@/lib/sort-alphabetical";
import { DataTable } from "@/components/shared/DataTable";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { motion, AnimatePresence } from "framer-motion";
import { Search, PlusCircle, FileText, Calendar, Building2 } from "lucide-react";
import Loading from "@/components/shared/Loading";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";

interface InvoiceItem {
    id: string;
    quantity: number;
    unitCost: number;
    discount: number;
    totalCost: number;
    inventoryItem?: { name: string };
}

interface Invoice {
    id: string;
    invoiceNumber: string;
    manufacturer: string;
    totalAmount: number;
    date: string;
    status: string;
    items?: InvoiceItem[];
}

export default function PurchaseInvoicesPage() {
    const [search, setSearch] = useState("");
    const [invoices, setInvoices] = useState<Invoice[]>([]);
    const [loading, setLoading] = useState(true);
    const [selectedInvoice, setSelectedInvoice] = useState<Invoice | null>(null);

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
                    items: item.items || [],
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
            accessorKey: "invoiceNumber",
            header: "Invoice #",
            cell: ({ row }: any) => (
                <div className="flex items-center space-x-2">
                    <FileText className="h-4 w-4 text-gray-500" />
                    <span className="font-medium text-red-700">{row.original.invoiceNumber}</span>
                </div>
            ),
        },
        {
            accessorKey: "manufacturer",
            header: "Supplier",
            cell: ({ row }: any) => (
                <div className="flex items-center space-x-2">
                    <Building2 className="h-4 w-4 text-gray-500" />
                    <span>{row.original.manufacturer}</span>
                </div>
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
            accessorKey: "totalAmount",
            header: "Total Amount",
            cell: ({ row }: any) => (
                <div className="flex items-center space-x-2">
                   
                    <span className="font-medium">{row.original.totalAmount.toLocaleString()} Rs</span>
                </div>
            ),
        },
        {
            accessorKey: "status",
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
        <div className="min-h-screen bg-gray-50/80">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
                <header className="mb-6">
                    <motion.h1
                        className="text-2xl sm:text-3xl font-bold text-red-800 tracking-tight"
                        initial={{ opacity: 0, y: -8 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.4 }}
                    >
                        Purchase Invoices
                    </motion.h1>
                    <motion.p className="mt-1 text-sm text-gray-500" initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.1 }}>
                        View invoices and register new incoming stock.
                    </motion.p>
                    <div className="mt-4 h-px bg-gradient-to-r from-red-200/80 via-red-100/50 to-transparent rounded-full" />
                </header>

                <Card className="overflow-hidden bg-white border border-gray-100 rounded-xl shadow-sm hover:shadow-md transition-shadow">
                    <div className="border-l-4 border-l-red-500 bg-red-50/30 px-5 py-3">
                        <h2 className="text-base font-semibold text-red-800">Invoices</h2>
                        <p className="text-xs text-gray-500 mt-0.5">
                            Search by invoice number or supplier.
                        </p>
                    </div>
                    <CardContent className="p-4 sm:p-5">
                    <div className="flex flex-col sm:flex-row justify-between gap-4 mb-4">
                        <div className="relative flex-1 max-w-sm">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                            <Input
                                placeholder="Search invoices..."
                                value={search}
                                onChange={(e) => setSearch(e.target.value)}
                                className="pl-9 h-10 border-gray-200 focus:border-red-500 focus:ring-red-500/20"
                            />
                        </div>
                        <Link href="/pharmacist/purchase-invoices/create">
                            <Button className="bg-red-800 hover:bg-red-700 text-white shrink-0 w-full sm:w-auto">
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
                                    data={invoices.filter(
                                        (i) =>
                                            i.invoiceNumber.toLowerCase().includes(search.toLowerCase()) ||
                                            i.manufacturer.toLowerCase().includes(search.toLowerCase())
                                    )}
                                    onRowClick={(inv) => setSelectedInvoice(inv)}
                                    initialSorting={[{ id: "manufacturer", desc: false }]}
                                />
                            </motion.div>
                        )}
                    </AnimatePresence>
                    </CardContent>
                </Card>

            {/* Invoice Details Modal with Line Items */}
            <Dialog open={!!selectedInvoice} onOpenChange={() => setSelectedInvoice(null)}>
                <DialogContent className="sm:max-w-[700px] max-h-[90vh] overflow-y-auto">
                    <DialogHeader>
                        <DialogTitle className="text-red-800">
                            Invoice #{selectedInvoice?.invoiceNumber} – {selectedInvoice?.manufacturer}
                        </DialogTitle>
                    </DialogHeader>
                    {selectedInvoice && (
                        <div className="space-y-4">
                            <div className="grid grid-cols-2 gap-2 text-sm text-muted-foreground">
                                <span>Date:</span>
                                <span className="font-medium text-foreground">{selectedInvoice.date}</span>
                                <span>Total:</span>
                                <span className="font-medium text-foreground">{selectedInvoice.totalAmount.toLocaleString()} Rs</span>
                                <span>Status:</span>
                                <span className="font-medium text-foreground">{selectedInvoice.status}</span>
                            </div>
                            <div className="border border-gray-100 rounded-lg overflow-hidden">
                                <table className="w-full text-base">
                                    <thead className="bg-muted/60">
                                        <tr>
                                            <th className="p-3 text-left font-semibold">Product</th>
                                            <th className="p-3 text-right font-semibold">Qty</th>
                                            <th className="p-3 text-right font-semibold">Unit Cost</th>
                                            <th className="p-3 text-right font-semibold">Discount (%)</th>
                                            <th className="p-3 text-right font-semibold">Line Total</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y">
                                        {sortByLocaleKey(selectedInvoice.items || [], (line) => line.inventoryItem?.name).map((item) => {
                                            const lineSubtotal = item.quantity * item.unitCost;
                                            const discountPct = lineSubtotal > 0 ? ((item.discount / lineSubtotal) * 100).toFixed(1) : "0";
                                            return (
                                                <tr key={item.id}>
                                                    <td className="p-3">{item.inventoryItem?.name || "—"}</td>
                                                    <td className="p-3 text-right">{item.quantity}</td>
                                                    <td className="p-3 text-right">{item.unitCost.toLocaleString()} Rs</td>
                                                    <td className="p-3 text-right">{discountPct}%</td>
                                                    <td className="p-3 text-right font-medium">{item.totalCost.toLocaleString()} Rs</td>
                                                </tr>
                                            );
                                        })}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    )}
                </DialogContent>
            </Dialog>
            </div>
        </div>
    );
}
