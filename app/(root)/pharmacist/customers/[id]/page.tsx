"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { motion, AnimatePresence } from "framer-motion";
import { Loader2, ArrowLeft, User, Phone, Mail, MapPin, Calendar, Receipt } from "lucide-react";
import { Button } from "@/components/ui/button";
import { format } from "date-fns";

export default function CustomerDetailPage() {
    const params = useParams();
    const router = useRouter();
    const [customer, setCustomer] = useState<any>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchCustomer = async () => {
            if (!params.id) return;
            setLoading(true);
            try {
                const response = await fetch(
                    `${process.env.NEXT_PUBLIC_API_BASE_URL}/pharmacist/customer/${params.id}`
                );
                if (!response.ok) {
                    throw new Error("Failed to fetch customer details");
                }
                const data = await response.json();
                setCustomer(data);
            } catch (error) {
                console.error("Error fetching customer:", error);
            } finally {
                setLoading(false);
            }
        };

        fetchCustomer();
    }, [params.id]);

    if (loading) {
        return (
            <div className="flex justify-center items-center min-h-screen">
                <Loader2 className="animate-spin h-10 w-10 text-red-700" />
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
                        <CardTitle className="text-xl font-bold text-gray-800 flex items-center gap-2">
                            <Receipt className="h-5 w-5 text-red-700" />
                            Purchase History
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="p-0">
                        {customer.sales?.length === 0 ? (
                            <div className="p-10 text-center text-gray-500">
                                <p className="text-lg">No purchases recorded yet.</p>
                            </div>
                        ) : (
                            <div className="divide-y divide-gray-100 max-h-[600px] overflow-y-auto">
                                {customer.sales?.map((sale: any) => (
                                    <div key={sale.id} className="p-6 hover:bg-gray-50 transition-colors">
                                        <div className="flex justify-between items-start mb-4">
                                            <div>
                                                <p className="font-semibold text-gray-900 text-lg">
                                                    {format(new Date(sale.soldAt), "PPP 'at' p")}
                                                </p>
                                                <p className="text-sm text-gray-500">
                                                    {sale.saleItems.length} item(s)
                                                </p>
                                            </div>
                                            <div className="text-right">
                                                <p className="font-bold text-red-700 text-xl">
                                                    Rs {sale.totalPrice.toLocaleString()}
                                                </p>
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
                                ))}
                            </div>
                        )}
                    </CardContent>
                </Card>
            </div>
        </motion.div>
    );
}
