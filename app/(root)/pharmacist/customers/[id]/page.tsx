"use client";

import { useState, useEffect, useCallback } from "react";
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
import { ArrowLeft, User, Phone, Mail, MapPin, Calendar, Receipt, Wallet, Banknote, Bell, MessageSquare } from "lucide-react";
import Loading from "@/components/shared/Loading";
import { Button } from "@/components/ui/button";
import { format } from "date-fns";
import { useAuth } from "@/app/providers/AuthProvider";
import axios from "axios";
import { toast } from "sonner";

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
            setTransactions(Array.isArray(data) ? data : []);
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
            setReminders(Array.isArray(data) ? data : []);
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
