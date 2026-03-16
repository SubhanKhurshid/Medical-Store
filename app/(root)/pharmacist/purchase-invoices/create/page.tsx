"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { motion } from "framer-motion";
import { PlusCircle, Trash2, Save, FileText, Building2, Package, Tag, Percent } from "lucide-react";
import { toast } from "sonner";

export default function CreatePurchaseInvoicePage() {
    const router = useRouter();
    const [manufacturers, setManufacturers] = useState<any[]>([]);
    const [inventoryItems, setInventoryItems] = useState<any[]>([]);
    const [isLoading, setIsLoading] = useState(false);

    const [invoiceData, setInvoiceData] = useState({
        invoiceNumber: "",
        manufacturerId: "",
    });

    const [invoiceItems, setInvoiceItems] = useState<any[]>([
        { inventoryItemId: "", quantity: "", unitCost: "", discount: "" }
    ]);

    useEffect(() => {
        // Fetch manufacturers
        fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL}/pharmacist/manufacturer`)
            .then((res) => res.json())
            .then((data) => setManufacturers(Array.isArray(data) ? data : [data]))
            .catch((err) => console.error(err));

        // Fetch inventory items
        fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL}/pharmacist`)
            .then((res) => res.json())
            .then((data) => setInventoryItems(Array.isArray(data) ? data : [data]))
            .catch((err) => console.error(err));
    }, []);

    const handleAddItem = () => {
        setInvoiceItems([
            ...invoiceItems,
            { inventoryItemId: "", quantity: "", unitCost: "", discount: "" },
        ]);
    };

    const handleRemoveItem = (index: number) => {
        const newItems = invoiceItems.filter((_, i) => i !== index);
        setInvoiceItems(newItems);
    };

    const handleItemChange = (index: number, field: string, value: any) => {
        const newItems = [...invoiceItems];
        newItems[index][field] = value;
        setInvoiceItems(newItems);
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!invoiceData.invoiceNumber || !invoiceData.manufacturerId) {
            toast.error("Please fill in invoice number and supplier");
            return;
        }

        if (invoiceItems.length === 0 || invoiceItems.some((item) => !item.inventoryItemId)) {
            toast.error("Please add at least one valid item");
            return;
        }

        const invalidDiscount = invoiceItems.some((item) => {
            const d = Number(item.discount || 0);
            return isNaN(d) || d < 0 || d > 100;
        });
        if (invalidDiscount) {
            toast.error("Discount must be between 0 and 100%");
            return;
        }

        setIsLoading(true);
        try {
            const payload = {
                ...invoiceData,
                items: invoiceItems.map((item) => ({
                    inventoryItemId: item.inventoryItemId,
                    quantity: Number(item.quantity || 0),
                    unitCost: Number(item.unitCost || 0),
                    discount: Number(item.discount || 0),
                }))
            };

            const res = await fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL}/pharmacist/purchase-invoice`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(payload),
            });

            if (!res.ok) throw new Error("Failed to create purchase invoice");

            toast.success("Purchase Invoice Created successfully");
            router.push("/pharmacist/purchase-invoices");
        } catch (error) {
            console.error(error);
            toast.error("Failed to create purchase invoice");
        } finally {
            setIsLoading(false);
        }
    };

    const calculateTotal = () => {
        return invoiceItems.reduce((total, item) => {
            const qty = Number(item.quantity || 0);
            const cost = Number(item.unitCost || 0);
            const lineSubtotal = qty * cost;
            const discountPct = Number(item.discount || 0);
            if (!lineSubtotal) return total;
            return total + (lineSubtotal - lineSubtotal * (discountPct / 100));
        }, 0);
    };

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
                        New Purchase Invoice
                    </motion.h1>
                    <motion.p
                        className="mt-1 text-sm text-gray-500"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ delay: 0.1 }}
                    >
                        Record received stock from a supplier.
                    </motion.p>
                    <div className="mt-4 h-px bg-gradient-to-r from-red-200/80 via-red-100/50 to-transparent rounded-full" />
                </header>

                <form onSubmit={handleSubmit} className="space-y-5">
                    <Card className="overflow-hidden bg-white border border-gray-100 rounded-xl shadow-sm">
                        <div className="border-l-4 border-l-red-500 bg-red-50/30 px-5 py-3 flex items-center justify-between">
                            <div>
                                <h2 className="text-base font-semibold text-red-800">
                                    Invoice details
                                </h2>
                                <p className="text-xs text-gray-500 mt-0.5">
                                    Invoice number and supplier.
                                </p>
                            </div>
                            <div className="text-right text-sm text-gray-600">
                                <span className="block text-[11px] uppercase tracking-wide">
                                    Total amount
                                </span>
                                <span className="font-semibold text-green-700">
                                    {calculateTotal().toLocaleString()} Rs
                                </span>
                            </div>
                        </div>
                        <CardContent className="p-4 sm:p-5">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div className="relative">
                                    <FileText className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                                    <Input
                                        required
                                        placeholder="Invoice number"
                                        value={invoiceData.invoiceNumber}
                                        onChange={(e) =>
                                            setInvoiceData({
                                                ...invoiceData,
                                                invoiceNumber: e.target.value,
                                            })
                                        }
                                        className="pl-9 h-11 border-gray-200 focus:border-red-500 focus:ring-red-500/20 text-sm"
                                    />
                                </div>
                                <div>
                                    <div className="relative">
                                        <Building2 className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                                        <select
                                            required
                                            value={invoiceData.manufacturerId}
                                            onChange={(e) =>
                                                setInvoiceData({
                                                    ...invoiceData,
                                                    manufacturerId: e.target.value,
                                                })
                                            }
                                            className="w-full pl-9 pr-3 h-11 text-sm border border-gray-200 rounded-md bg-white focus:outline-none focus:border-red-500 focus:ring-1 focus:ring-red-500/20"
                                        >
                                            <option value="" disabled>
                                                Select supplier
                                            </option>
                                            {manufacturers.map((m) => (
                                                <option key={m.id} value={m.id}>
                                                    {m.companyName}
                                                </option>
                                            ))}
                                        </select>
                                    </div>
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    <Card className="overflow-hidden bg-white border border-gray-100 rounded-xl shadow-sm">
                        <div className="border-l-4 border-l-gray-300 bg-gray-50/60 px-5 py-3 flex items-center justify-between">
                            <div>
                                <h2 className="text-base font-semibold text-gray-800 flex items-center gap-2">
                                    <Package className="h-4 w-4 text-gray-500" />
                                    Line items
                                </h2>
                                <p className="text-xs text-gray-500 mt-0.5">
                                    Add each product on the supplier invoice.
                                </p>
                            </div>
                            <Button
                                type="button"
                                onClick={handleAddItem}
                                variant="outline"
                                className="border-red-600 text-red-700 hover:bg-red-50"
                            >
                                <PlusCircle className="mr-2 h-4 w-4" />
                                Add item
                            </Button>
                        </div>
                        <CardContent className="p-0">
                            <div className="overflow-x-auto">
                                <table className="w-full text-left border-collapse">
                                    <thead>
                                        <tr className="bg-gray-100 text-gray-600 text-xs uppercase tracking-wide border-b border-gray-200">
                                            <th className="p-3 font-semibold w-1/3">Product</th>
                                            <th className="p-3 font-semibold w-28 text-center">
                                                Qty
                                            </th>
                                            <th className="p-3 font-semibold w-32 text-right">
                                                Unit cost (Rs)
                                            </th>
                                            <th className="p-3 font-semibold w-32 text-right">
                                                Discount (%)
                                            </th>
                                            <th className="p-3 font-semibold text-right w-32">
                                                Line total
                                            </th>
                                            <th className="p-3 font-semibold w-12 text-center">
                                                Action
                                            </th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-gray-100">
                                        {invoiceItems.map((item, index) => {
                                            const lineSubtotal =
                                                Number(item.quantity || 0) *
                                                Number(item.unitCost || 0);
                                            const discountPct = Number(item.discount || 0);
                                            const lineTotal =
                                                lineSubtotal -
                                                lineSubtotal * (discountPct / 100);
                                            return (
                                                <tr
                                                    key={index}
                                                    className="hover:bg-gray-50 transition-colors"
                                                >
                                                    <td className="p-3 align-top">
                                                        <select
                                                            required
                                                            value={item.inventoryItemId}
                                                            onChange={(e) =>
                                                                handleItemChange(
                                                                    index,
                                                                    "inventoryItemId",
                                                                    e.target.value,
                                                                )
                                                            }
                                                            className="w-full p-2 text-sm border border-gray-300 rounded-md focus:ring-1 focus:ring-red-500/30 focus:border-red-500 bg-white"
                                                        >
                                                            <option value="" disabled>
                                                                Select item
                                                            </option>
                                                            {inventoryItems.map((inv) => (
                                                                <option key={inv.id} value={inv.id}>
                                                                    {inv.name} (Qty: {inv.quantity})
                                                                </option>
                                                            ))}
                                                        </select>
                                                    </td>
                                                    <td className="p-3 align-top">
                                                        <Input
                                                            type="number"
                                                            min="1"
                                                            required
                                                            value={item.quantity}
                                                            onChange={(e) =>
                                                                handleItemChange(
                                                                    index,
                                                                    "quantity",
                                                                    e.target.value,
                                                                )
                                                            }
                                                            className="w-full h-9 text-center text-sm border-gray-300"
                                                            placeholder="Qty"
                                                        />
                                                    </td>
                                                    <td className="p-3 align-top">
                                                        <Input
                                                            type="number"
                                                            min="0"
                                                            step="0.01"
                                                            required
                                                            value={item.unitCost}
                                                            onChange={(e) =>
                                                                handleItemChange(
                                                                    index,
                                                                    "unitCost",
                                                                    e.target.value,
                                                                )
                                                            }
                                                            className="w-full h-9 text-right text-sm border-gray-300"
                                                            placeholder="0.00"
                                                        />
                                                    </td>
                                                    <td className="p-3 align-top">
                                                        <div className="flex items-center gap-1">
                                                            <Input
                                                                type="number"
                                                                min={0}
                                                                max={100}
                                                                step="any"
                                                                placeholder="e.g. 10"
                                                                value={item.discount}
                                                                onChange={(e) =>
                                                                    handleItemChange(
                                                                        index,
                                                                        "discount",
                                                                        e.target.value,
                                                                    )
                                                                }
                                                                className="w-full h-9 text-right text-sm text-red-600 border-gray-300"
                                                            />
                                                            <span className="text-red-600 text-xs font-medium">
                                                                %
                                                            </span>
                                                        </div>
                                                    </td>
                                                    <td className="p-3 align-top text-right text-sm font-semibold text-gray-800">
                                                        {lineTotal > 0
                                                            ? lineTotal.toLocaleString()
                                                            : "0"}{" "}
                                                        Rs
                                                    </td>
                                                    <td className="p-3 align-top text-center">
                                                        <Button
                                                            type="button"
                                                            variant="ghost"
                                                            size="icon"
                                                            onClick={() => handleRemoveItem(index)}
                                                            className="text-red-500 hover:text-red-700 hover:bg-red-50"
                                                        >
                                                            <Trash2 className="h-4 w-4" />
                                                        </Button>
                                                    </td>
                                                </tr>
                                            );
                                        })}
                                    </tbody>
                                </table>
                                {invoiceItems.length === 0 && (
                                    <div className="p-8 text-center text-sm text-gray-500">
                                        No items added yet. Click{" "}
                                        <span className="font-medium">Add item</span> to begin.
                                    </div>
                                )}
                            </div>

                            <div className="p-4 sm:p-5 bg-gray-50 border-t border-gray-200 flex flex-col sm:flex-row items-center justify-end gap-3">
                                <Button
                                    type="button"
                                    variant="outline"
                                    onClick={() => router.back()}
                                    className="w-full sm:w-auto"
                                >
                                    Cancel
                                </Button>
                                <Button
                                    type="submit"
                                    disabled={isLoading || invoiceItems.length === 0}
                                    className="w-full sm:w-auto bg-red-800 hover:bg-red-900 text-white"
                                >
                                    {isLoading ? (
                                        "Saving..."
                                    ) : (
                                        <>
                                            <Save className="mr-2 h-4 w-4" />
                                            Save invoice
                                        </>
                                    )}
                                </Button>
                            </div>
                        </CardContent>
                    </Card>
                </form>
            </div>
        </div>
    );
}
