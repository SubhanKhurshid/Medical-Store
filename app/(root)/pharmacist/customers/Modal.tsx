"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, User, Phone, Mail, MapPin } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

interface CustomerModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSave: (data: any) => void;
    editingCustomer?: { id: string; name: string; phone: string; email?: string | null; address?: string | null } | null;
    accessToken?: string | null;
}

const CustomerModal = ({ isOpen, onClose, onSave, editingCustomer, accessToken }: CustomerModalProps) => {
    const [formData, setFormData] = useState({
        name: "",
        phone: "",
        email: "",
        address: "",
    });

    useEffect(() => {
        if (editingCustomer) {
            setFormData({
                name: editingCustomer.name,
                phone: editingCustomer.phone,
                email: editingCustomer.email ?? "",
                address: editingCustomer.address ?? "",
            });
        } else {
            setFormData({ name: "", phone: "", email: "", address: "" });
        }
    }, [editingCustomer, isOpen]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        const headers: Record<string, string> = { "Content-Type": "application/json" };
        if (accessToken) headers["Authorization"] = `Bearer ${accessToken}`;

        try {
            if (editingCustomer) {
                const response = await fetch(
                    `${process.env.NEXT_PUBLIC_API_BASE_URL}/pharmacist/customer/${editingCustomer.id}`,
                    {
                        method: "PATCH",
                        headers,
                        body: JSON.stringify(formData),
                    }
                );
                if (!response.ok) {
                    throw new Error("Failed to update customer");
                }
                const updated = await response.json();
                onSave(updated);
            } else {
                const response = await fetch(
                    `${process.env.NEXT_PUBLIC_API_BASE_URL}/pharmacist/customer`,
                    {
                        method: "POST",
                        headers,
                        body: JSON.stringify(formData),
                    }
                );
                if (!response.ok) {
                    throw new Error("Failed to create customer");
                }
                const savedCustomer = await response.json();
                onSave(savedCustomer);
            }
            onClose();
        } catch (error) {
            console.error("Error saving customer:", error);
            alert("Failed to save customer. Please try again.");
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
                            <h3 className="text-3xl text-red-800 font-bold">
                                {editingCustomer ? "Edit Customer" : "Add New Customer"}
                            </h3>
                            <button
                                type="button"
                                onClick={onClose}
                                className="text-gray-500 hover:text-red-700 transition-colors"
                            >
                                <X className="h-6 w-6" />
                            </button>
                        </div>

                        <form onSubmit={handleSubmit} className="p-6 space-y-6">
                            <div className="space-y-4">
                                <div className="relative">
                                    <User className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
                                    <Input
                                        required
                                        placeholder="Full Name"
                                        value={formData.name}
                                        onChange={(e) =>
                                            setFormData({ ...formData, name: e.target.value })
                                        }
                                        className="pl-10 text-xl"
                                    />
                                </div>

                                <div className="relative">
                                    <Phone className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
                                    <Input
                                        required
                                        placeholder="Phone Number"
                                        value={formData.phone}
                                        onChange={(e) =>
                                            setFormData({ ...formData, phone: e.target.value })
                                        }
                                        className="pl-10 text-xl"
                                    />
                                </div>

                                <div className="relative">
                                    <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
                                    <Input
                                        type="email"
                                        placeholder="Email Address (Optional)"
                                        value={formData.email}
                                        onChange={(e) =>
                                            setFormData({ ...formData, email: e.target.value })
                                        }
                                        className="pl-10 text-xl"
                                    />
                                </div>

                                <div className="relative">
                                    <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
                                    <Input
                                        placeholder="Home Address (Optional)"
                                        value={formData.address}
                                        onChange={(e) =>
                                            setFormData({ ...formData, address: e.target.value })
                                        }
                                        className="pl-10 text-xl"
                                    />
                                </div>
                            </div>

                            <div className="flex justify-end gap-3 pt-4 border-t border-gray-100">
                                <Button
                                    type="button"
                                    variant="outline"
                                    onClick={onClose}
                                    className="border-gray-300 hover:bg-gray-50 text-gray-700 text-lg"
                                >
                                    Cancel
                                </Button>
                                <Button
                                    type="submit"
                                    className="bg-red-800 hover:bg-red-900 text-white text-lg"
                                >
                                    {editingCustomer ? "Update Customer" : "Save Customer"}
                                </Button>
                            </div>
                        </form>
                    </motion.div>
                </motion.div>
            )}
        </AnimatePresence>
    );
};

export default CustomerModal;
