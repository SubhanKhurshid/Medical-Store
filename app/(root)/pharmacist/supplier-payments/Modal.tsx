"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Building2, FileText } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

interface PaymentModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSave: (data: any) => void;
}

const PaymentModal = ({ isOpen, onClose, onSave }: PaymentModalProps) => {
    const [manufacturers, setManufacturers] = useState<any[]>([]);
    const [formData, setFormData] = useState({
        manufacturerId: "",
        amount: "",
        reference: "",
    });
    const [isLoading, setIsLoading] = useState(false);

    useEffect(() => {
        if (isOpen) {
            fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL}/pharmacist/manufacturer`)
                .then((res) => res.json())
                .then((data) => {
                    setManufacturers(Array.isArray(data) ? data : [data]);
                })
                .catch((err) => console.error("Error fetching manufacturers:", err));
        }
    }, [isOpen]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!formData.manufacturerId) {
            alert("Please select a manufacturer");
            return;
        }

        setIsLoading(true);
        const paymentData = {
            manufacturerId: formData.manufacturerId,
            amount: parseFloat(formData.amount),
            reference: formData.reference,
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
            // Reset form
            setFormData({ manufacturerId: "", amount: "", reference: "" });
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
                            <h3 className="text-3xl text-red-800 font-bold">Record Payment</h3>
                            <button
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
                                        value={formData.manufacturerId}
                                        onChange={(e) =>
                                            setFormData({ ...formData, manufacturerId: e.target.value })
                                        }
                                        className="w-full pl-3 pr-10 py-2 text-xl border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-red-500"
                                    >
                                        <option value="" disabled>Select Manufacturer</option>
                                        {manufacturers.map((m) => (
                                            <option key={m.id} value={m.id}>
                                                {m.companyName}
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
                                        placeholder="Amount Paid"
                                        value={formData.amount}
                                        onChange={(e) =>
                                            setFormData({ ...formData, amount: e.target.value })
                                        }
                                        className="pl-10 text-2xl"
                                    />
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
                                    {isLoading ? "Saving..." : "Save Payment"}
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
