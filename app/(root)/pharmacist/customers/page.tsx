"use client";

import { useState, useEffect } from "react";
import { DataTable } from "@/components/shared/DataTable";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { motion, AnimatePresence } from "framer-motion";
import { Search, PlusCircle, User, Phone, Eye, Pencil, Wallet } from "lucide-react";
import Loading from "@/components/shared/Loading";
import { Button } from "@/components/ui/button";
import CustomerModal from "./Modal";
import { useRouter } from "next/navigation";
import { useAuth } from "@/app/providers/AuthProvider";

interface Customer {
    id: string;
    name: string;
    phone: string;
    email?: string | null;
    address?: string | null;
    creditBalance?: number;
}

const CustomersPage = () => {
    const router = useRouter();
    const { user } = useAuth();
    const accessToken = user?.access_token;
    const [search, setSearch] = useState("");
    const [customers, setCustomers] = useState<Customer[]>([]);
    const [loading, setLoading] = useState(true);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingCustomer, setEditingCustomer] = useState<Customer | null>(null);

    const fetchCustomers = async () => {
        setLoading(true);
        try {
            const response = await fetch(
                `${process.env.NEXT_PUBLIC_API_BASE_URL}/pharmacist/customer`,
                {
                    headers: accessToken ? { Authorization: `Bearer ${accessToken}` } : {},
                }
            );
            if (!response.ok) {
                throw new Error("Failed to fetch customers");
            }
            const data = await response.json();
            const customersArray = Array.isArray(data) ? data : [data];
            setCustomers(customersArray);
        } catch (error) {
            console.error("Error fetching customers:", error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if (accessToken) fetchCustomers();
    }, [accessToken]);

    const columns = [
        {
            accessorKey: "name",
            header: "Customer Name",
            cell: ({ row }: any) => (
                <div className="flex items-center space-x-2">
                    <User className="h-4 w-4 text-gray-500" />
                    <span className="font-semibold">{row.original.name}</span>
                </div>
            ),
        },
        {
            accessorKey: "phone",
            header: "Phone Number",
            cell: ({ row }: any) => (
                <div className="flex items-center space-x-2">
                    <Phone className="h-4 w-4 text-gray-500" />
                    <span>{row.original.phone}</span>
                </div>
            ),
        },
        {
            accessorKey: "email",
            header: "Email Address",
            cell: ({ row }: any) => <span>{row.original.email || "-"}</span>,
        },
        {
            accessorKey: "creditBalance",
            header: "Credit Balance",
            cell: ({ row }: any) => {
                const bal = Number(row.original.creditBalance) || 0;
                return (
                    <div className="flex items-center space-x-2">
                        <Wallet className="h-4 w-4 text-gray-500" />
                        <span className={bal > 0 ? "font-semibold text-amber-700" : "text-gray-600"}>
                            Rs {bal.toLocaleString()}
                        </span>
                    </div>
                );
            },
        },
        {
            id: "actions",
            header: "Actions",
            enableSorting: false,
            cell: ({ row }: any) => (
                <div className="flex gap-2">
                    <Button
                        variant="ghost"
                        size="sm"
                        className="text-gray-600 hover:bg-gray-100"
                        onClick={() => {
                            setEditingCustomer(row.original);
                            setIsModalOpen(true);
                        }}
                    >
                        <Pencil className="h-4 w-4 mr-1" />
                        Edit
                    </Button>
                    <Button
                        variant="ghost"
                        size="sm"
                        className="text-red-700 hover:text-red-900 hover:bg-red-50"
                        onClick={() => router.push(`/pharmacist/customers/${row.original.id}`)}
                    >
                        <Eye className="h-4 w-4 mr-2" />
                        View
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
                        Customers
                    </motion.h1>
                    <motion.p className="mt-1 text-sm text-gray-500" initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.1 }}>
                        Manage customers and view purchase history.
                    </motion.p>
                    <div className="mt-4 h-px bg-gradient-to-r from-red-200/80 via-red-100/50 to-transparent rounded-full" />
                </header>

                <Card className="overflow-hidden bg-white border border-gray-100 rounded-xl shadow-sm hover:shadow-md transition-shadow">
                    <div className="border-l-4 border-l-red-500 bg-red-50/30 px-5 py-3">
                        <h2 className="text-base font-semibold text-red-800">Customer directory</h2>
                        <p className="text-xs text-gray-500 mt-0.5">
                            Search by name or phone.
                        </p>
                    </div>
                    <CardContent className="p-4 sm:p-5">
                    <div className="flex flex-col sm:flex-row justify-between gap-4 mb-4">
                        <div className="relative flex-1 max-w-sm">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                            <Input
                                placeholder="Search by name or phone..."
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
                            Add Customer
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
                                    data={customers.filter(
                                        (c) =>
                                            c.name?.toLowerCase().includes(search.toLowerCase()) ||
                                            c.phone?.includes(search)
                                    )}
                                    disableRowClick={true}
                                />
                            </motion.div>
                        )}
                    </AnimatePresence>
                    </CardContent>
                </Card>

            <CustomerModal
                isOpen={isModalOpen}
                onClose={() => {
                    setIsModalOpen(false);
                    setEditingCustomer(null);
                }}
                onSave={(saved: Customer) => {
                    if (editingCustomer) {
                        setCustomers(customers.map((c) => (c.id === saved.id ? saved : c)));
                    } else {
                        setCustomers([saved, ...customers]);
                    }
                    setIsModalOpen(false);
                    setEditingCustomer(null);
                }}
                editingCustomer={editingCustomer}
                accessToken={accessToken}
            />
            </div>
        </div>
    );
};

export default CustomersPage;
