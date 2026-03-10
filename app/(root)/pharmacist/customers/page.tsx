"use client";

import { useState, useEffect } from "react";
import { DataTable } from "@/components/shared/DataTable";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { motion, AnimatePresence } from "framer-motion";
import { Search, PlusCircle, Loader2, User, Phone, Eye, Pencil, Wallet } from "lucide-react";
import { Button } from "@/components/ui/button";
import CustomerModal from "./Modal";
import Loading from "@/components/shared/Loading";
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
            id: "name",
            header: "Customer Name",
            cell: ({ row }: any) => (
                <div className="flex items-center space-x-2">
                    <User className="h-4 w-4 text-gray-500" />
                    <span className="font-semibold">{row.original.name}</span>
                </div>
            ),
        },
        {
            id: "phone",
            header: "Phone Number",
            cell: ({ row }: any) => (
                <div className="flex items-center space-x-2">
                    <Phone className="h-4 w-4 text-gray-500" />
                    <span>{row.original.phone}</span>
                </div>
            ),
        },
        {
            id: "email",
            header: "Email Address",
            cell: ({ row }: any) => <span>{row.original.email || "-"}</span>,
        },
        {
            id: "creditBalance",
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
        <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.5 }}
            className="p-6 md:p-10 max-w-9xl mx-auto min-h-screen bg-gradient-to-br from-gray-50 to-gray-100"
        >
            <Card className="bg-white shadow-xl border-0 rounded-xl overflow-hidden">
                <CardHeader className="text-red-800 p-6 border-b-2 border-red-700">
                    <CardTitle className="text-3xl md:text-4xl font-bold">
                        Customer Directory
                    </CardTitle>
                    <p className="text-gray-500 mt-2 text-xl">
                        Manage your regular customers and view their purchase history
                    </p>
                </CardHeader>
                <CardContent className="p-6">
                    <div className="flex flex-col sm:flex-row justify-between gap-4 mb-6">
                        <div className="relative w-full sm:w-1/3">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                            <Input
                                placeholder="Search by name or phone..."
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
                            Add Customer
                        </Button>
                    </div>

                    <AnimatePresence>
                        {loading ? (
                            <motion.div
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                exit={{ opacity: 0 }}
                                className="py-20"
                            >
                                <Loading />
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
        </motion.div>
    );
};

export default CustomersPage;
