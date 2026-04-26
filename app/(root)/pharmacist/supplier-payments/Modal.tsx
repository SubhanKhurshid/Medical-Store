"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, FileText, CreditCard } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { sortByLocaleKey } from "@/lib/sort-alphabetical";

interface PaymentModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSave: (data: unknown) => void;
}

interface VendorRow {
    id: string;
    name: string;
}

const PaymentModal = ({ isOpen, onClose, onSave }: PaymentModalProps) => {
    const [vendors, setVendors] = useState<VendorRow[]>([]);
    const [formData, setFormData] = useState({
        vendorId: "",
        amount: "",
        reference: "",
        paymentMethod: "CASH" as "CASH" | "CARD" | "ONLINE" | "DONATION" | "CREDIT",
    });
    const [isLoading, setIsLoading] = useState(false);

    useEffect(() => {
        if (isOpen) {
            fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL}/pharmacist/vendor`)
                .then((res) => res.json())
                .then((data) => {
                    const list = Array.isArray(data) ? data : [data];
                    setVendors(
                        sortByLocaleKey(
                            list.map((v: { id: string; name: string }) => ({ id: v.id, name: v.name })),
                            (v) => v.name,
                        ),
                    );
                })
                .catch((err) => console.error("Error fetching vendors:", err));
        }
    }, [isOpen]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!formData.vendorId) {
            alert("Please select a vendor");
            return;
        }

        setIsLoading(true);
        const paymentData = {
            vendorId: formData.vendorId,
            amount: parseFloat(formData.amount),
            reference: formData.reference,
            paymentMethod: formData.paymentMethod,
        };

        try {
            const response = await fetch(
                `${process.env.NEXT_PUBLIC_API_BASE_URL}/pharmacist/supplier-payment`,
                {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify(paymentData),
                }
            );

            if (!response.ok) {
                throw new Error("Failed to record payment");
            }

            const savedPayment = await response.json();
            onSave(savedPayment);
            onClose();
            setFormData({ vendorId: "", amount: "", reference: "", paymentMethod: "CASH" });
        } catch (error) {
            console.error("Error recording payment:", error);
            alert("Failed to record payment. Please try again.");
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <AnimatePresence>
            {isOpen && (
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-10"
                >
                    <motion.div
                        initial={{ y: 50, opacity: 0 }}
                        animate={{ y: 0, opacity: 1 }}
                        exit={{ y: 50, opacity: 0 }}
                        className="bg-white rounded-xl w-full max-w-2xl shadow-2xl overflow-hidden"
                    >
                        <div className="flex justify-between items-center p-6 border-b-2 border-red-700">
                            <h3 className="text-3xl text-red-800 font-bold">Record payment</h3>
                            <button
                                type="button"
                                onClick={onClose}
                                className="text-gray-500 hover:text-red-600 transition-colors"
                            >
                                <X className="h-5 w-5" />
                            </button>
                        </div>

                        <form onSubmit={handleSubmit} className="p-6 space-y-4">
                            <div className="space-y-4">
                                <div className="relative">
                                    <select
                                        required
                                        value={formData.vendorId}
                                        onChange={(e) =>
                                            setFormData({ ...formData, vendorId: e.target.value })
                                        }
                                        className="w-full pl-3 pr-10 py-2 text-xl border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-red-500"
                                    >
                                        <option value="" disabled>Select vendor</option>
                                        {vendors.map((m) => (
                                            <option key={m.id} value={m.id}>
                                                {m.name}
                                            </option>
                                        ))}
                                    </select>
                                </div>

                                <div className="relative">
                                    <Input
                                        type="number"
                                        min="0"
                                        step="0.01"
                                        required
                                        placeholder="Amount paid"
                                        value={formData.amount}
                                        onChange={(e) =>
                                            setFormData({ ...formData, amount: e.target.value })
                                        }
                                        className="text-2xl"
                                    />
                                </div>

                                <div className="relative">
                                    <CreditCard className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400 pointer-events-none z-10" />
                                    <select
                                        required
                                        value={formData.paymentMethod}
                                        onChange={(e) =>
                                            setFormData({
                                                ...formData,
                                                paymentMethod: e.target.value as typeof formData.paymentMethod,
                                            })
                                        }
                                        className="w-full pl-10 pr-10 py-2 text-xl border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-red-500"
                                    >
                                        <option value="CASH">Cash</option>
                                        <option value="CARD">Card</option>
                                        <option value="ONLINE">Online</option>
                                        <option value="DONATION">Donation</option>
                                        <option value="CREDIT">Credit</option>
                                    </select>
                                </div>

                                <div className="relative">
                                    <FileText className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
                                    <Input
                                        placeholder="Reference (Txn ID, Check #, etc - Optional)"
                                        value={formData.reference}
                                        onChange={(e) =>
                                            setFormData({ ...formData, reference: e.target.value })
                                        }
                                        className="pl-10 text-xl"
                                    />
                                </div>
                            </div>

                            <div className="flex justify-end gap-3 pt-6">
                                <Button
                                    type="button"
                                    variant="outline"
                                    onClick={onClose}
                                    className="border-gray-300 hover:bg-gray-50 text-gray-700 text-xl"
                                    disabled={isLoading}
                                >
                                    Cancel
                                </Button>
                                <Button
                                    type="submit"
                                    className="bg-red-800 hover:bg-red-900 text-white text-xl"
                                    disabled={isLoading}
                                >
                                    {isLoading ? "Saving..." : "Save payment"}
                                </Button>
                            </div>
                        </form>
                    </motion.div>
                </motion.div>
            )}
        </AnimatePresence>
    );
};

export default PaymentModal;
