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
        { inventoryItemId: "", quantity: 1, unitCost: 0, discount: 0 }
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
        setInvoiceItems([...invoiceItems, { inventoryItemId: "", quantity: 1, unitCost: 0, discount: 0 }]);
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

        setIsLoading(true);
        try {
            const payload = {
                ...invoiceData,
                items: invoiceItems.map((item) => ({
                    inventoryItemId: item.inventoryItemId,
                    quantity: Number(item.quantity),
                    unitCost: Number(item.unitCost),
                    discount: Number(item.discount),
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
            return total + (Number(item.quantity) * Number(item.unitCost) - Number(item.discount));
        }, 0);
    };

    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="p-6 md:p-8 max-w-7xl mx-auto min-h-screen bg-gray-50 bg-gradient-to-br from-gray-50 to-gray-100"
        >
            <form onSubmit={handleSubmit}>
                <Card className="bg-white shadow-xl border-0 rounded-xl overflow-hidden mb-6">
                    <CardHeader className="text-red-800 p-6 border-b-2 border-red-700 flex flex-row items-center justify-between">
                        <div>
                            <CardTitle className="text-3xl md:text-3xl font-bold">New Purchase Invoice</CardTitle>
                            <p className="text-gray-500 mt-2 text-lg">Record a received bill from supplier</p>
                        </div>
                        <div className="text-right">
                            <p className="text-gray-500 text-sm font-semibold uppercase tracking-wider">Total Amount</p>
                            <p className="text-4xl font-bold text-green-600">{calculateTotal().toLocaleString()} Rs</p>
                        </div>
                    </CardHeader>
                    <CardContent className="p-6">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div className="relative">
                                <FileText className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
                                <Input
                                    required
                                    placeholder="Invoice Number"
                                    value={invoiceData.invoiceNumber}
                                    onChange={(e) => setInvoiceData({ ...invoiceData, invoiceNumber: e.target.value })}
                                    className="pl-10 text-xl border-gray-300"
                                />
                            </div>
                            <div className="relative">
                                <select
                                    required
                                    value={invoiceData.manufacturerId}
                                    onChange={(e) => setInvoiceData({ ...invoiceData, manufacturerId: e.target.value })}
                                    className="w-full pl-3 pr-10 py-2 text-xl border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-red-500"
                                >
                                    <option value="" disabled>Select Supplier</option>
                                    {manufacturers.map((m) => (
                                        <option key={m.id} value={m.id}>{m.companyName}</option>
                                    ))}
                                </select>
                            </div>
                        </div>
                    </CardContent>
                </Card>

                <Card className="bg-white shadow-xl border-0 rounded-xl overflow-hidden">
                    <CardHeader className="bg-gray-50 border-b border-gray-200 p-4 flex flex-row justify-between items-center">
                        <CardTitle className="text-xl font-semibold text-gray-800 flex items-center">
                            <Package className="mr-2 h-5 w-5" /> Line Items
                        </CardTitle>
                        <Button type="button" onClick={handleAddItem} variant="outline" className="border-red-600 text-red-700 hover:bg-red-50">
                            <PlusCircle className="mr-2 h-4 w-4" /> Add Item
                        </Button>
                    </CardHeader>
                    <CardContent className="p-0">
                        <div className="overflow-x-auto">
                            <table className="w-full text-left border-collapse">
                                <thead>
                                    <tr className="bg-gray-100 text-gray-600 text-sm uppercase tracking-wider border-b border-gray-200">
                                        <th className="p-4 font-semibold w-1/3">Product</th>
                                        <th className="p-4 font-semibold w-32">Quantity</th>
                                        <th className="p-4 font-semibold w-32">Unit Cost (Rs)</th>
                                        <th className="p-4 font-semibold w-32">Discount (Rs)</th>
                                        <th className="p-4 font-semibold text-right w-32">Line Total</th>
                                        <th className="p-4 font-semibold w-16 text-center">Action</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-100">
                                    {invoiceItems.map((item, index) => {
                                        const lineTotal = (Number(item.quantity) * Number(item.unitCost)) - Number(item.discount);
                                        return (
                                            <tr key={index} className="hover:bg-gray-50 transition-colors">
                                                <td className="p-4">
                                                    <select
                                                        required
                                                        value={item.inventoryItemId}
                                                        onChange={(e) => handleItemChange(index, "inventoryItemId", e.target.value)}
                                                        className="w-full p-2 border border-gray-300 rounded focus:ring-2 focus:ring-red-500 focus:outline-none bg-white"
                                                    >
                                                        <option value="" disabled>Select Item</option>
                                                        {inventoryItems.map((inv) => (
                                                            <option key={inv.id} value={inv.id}>{inv.name} (Qty: {inv.quantity})</option>
                                                        ))}
                                                    </select>
                                                </td>
                                                <td className="p-4">
                                                    <Input
                                                        type="number"
                                                        min="1"
                                                        required
                                                        value={item.quantity}
                                                        onChange={(e) => handleItemChange(index, "quantity", e.target.value)}
                                                        className="w-full text-center"
                                                    />
                                                </td>
                                                <td className="p-4">
                                                    <Input
                                                        type="number"
                                                        min="0"
                                                        step="0.01"
                                                        required
                                                        value={item.unitCost}
                                                        onChange={(e) => handleItemChange(index, "unitCost", e.target.value)}
                                                        className="w-full text-right"
                                                    />
                                                </td>
                                                <td className="p-4">
                                                    <Input
                                                        type="number"
                                                        min="0"
                                                        step="0.01"
                                                        value={item.discount}
                                                        onChange={(e) => handleItemChange(index, "discount", e.target.value)}
                                                        className="w-full text-right text-red-600"
                                                    />
                                                </td>
                                                <td className="p-4 text-right font-semibold text-gray-800">
                                                    {lineTotal > 0 ? lineTotal.toLocaleString() : "0"} Rs
                                                </td>
                                                <td className="p-4 text-center">
                                                    <Button
                                                        type="button"
                                                        variant="ghost"
                                                        size="icon"
                                                        onClick={() => handleRemoveItem(index)}
                                                        className="text-red-500 hover:text-red-700 hover:bg-red-50"
                                                    >
                                                        <Trash2 className="h-5 w-5" />
                                                    </Button>
                                                </td>
                                            </tr>
                                        );
                                    })}
                                </tbody>
                            </table>
                            {invoiceItems.length === 0 && (
                                <div className="p-8 text-center text-gray-500">
                                    No items added yet. Click &quot;Add Item&quot; to begin.
                                </div>
                            )}
                        </div>

                        <div className="p-6 bg-gray-50 border-t border-gray-200 flex justify-end">
                            <Button type="button" variant="outline" onClick={() => router.back()} className="mr-4 text-lg">
                                Cancel
                            </Button>
                            <Button type="submit" disabled={isLoading || invoiceItems.length === 0} className="bg-red-800 hover:bg-red-900 text-white text-lg px-8">
                                {isLoading ? "Saving..." : <><Save className="mr-2 h-5 w-5" /> Save Invoice</>}
                            </Button>
                        </div>
                    </CardContent>
                </Card>
            </form>
        </motion.div>
    );
}
