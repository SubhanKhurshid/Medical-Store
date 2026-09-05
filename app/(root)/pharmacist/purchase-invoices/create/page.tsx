"use client";

import { useState, useEffect, useMemo } from "react";
import { fetchAllPaginatedList } from "@/lib/api";
import { ItemCombobox } from "@/components/purchase-invoices/ItemCombobox";
import { sortByLocaleKey } from "@/lib/sort-alphabetical";
import { useRouter, useSearchParams } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { motion } from "framer-motion";
import { PlusCircle, Trash2, Save, FileText, Building2, Package, Tag, Percent } from "lucide-react";
import { toast } from "sonner";

function formatInventoryOptionLabel(inv: {
    name: string;
    quantity?: number;
    purchasePrice?: number;
    manufacturerDiscount?: number;
    specialCompanyDiscount?: number;
}) {
    const bits: string[] = [`${inv.name} (Qty: ${inv.quantity ?? 0})`];
    const mfg = Number(inv.manufacturerDiscount ?? 0);
    const spec = Number(inv.specialCompanyDiscount ?? 0);
    const list = Number(inv.purchasePrice ?? 0);
    if (list > 0) bits.push(`list ${list}`);
    if (mfg > 0) bits.push(`mfg ${mfg}%`);
    if (spec > 0) bits.push(`spec. co. ${spec}%`);
    return bits.join(" · ");
}

interface VendorOption {
    id: string;
    name: string;
}

export default function CreatePurchaseInvoicePage() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const purchaseOrderId = searchParams.get("purchaseOrderId");
    const [vendors, setVendors] = useState<VendorOption[]>([]);
    const [inventoryItems, setInventoryItems] = useState<any[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const [loadingItems, setLoadingItems] = useState(false);
    const [loadingOrder, setLoadingOrder] = useState(Boolean(purchaseOrderId));
    const [linkedPurchaseOrder, setLinkedPurchaseOrder] = useState<{
        id: string;
        status: string;
        itemName: string;
    } | null>(null);

    const [invoiceData, setInvoiceData] = useState({
        invoiceNumber: "",
        vendorId: "",
    });

    const [invoiceItems, setInvoiceItems] = useState<any[]>([
        { inventoryItemId: "", quantity: "", unitCost: "", discount: "", purchaseOrderId: "" }
    ]);

    useEffect(() => {
        fetchAllPaginatedList<VendorOption>(
            `${process.env.NEXT_PUBLIC_API_BASE_URL}/pharmacist/vendor`,
        )
            .then((data) =>
                setVendors(sortByLocaleKey(data, (v) => v.name)),
            )
            .catch((err) => console.error(err));
    }, []);

    useEffect(() => {
        if (!purchaseOrderId) {
            toast.error("Create invoices from a purchase order, not this page.");
            router.replace("/pharmacist/purchase-orders/view");
            return;
        }
        let cancelled = false;
        setLoadingOrder(true);
        fetch(
            `${process.env.NEXT_PUBLIC_API_BASE_URL}/pharmacist/purchase-orders/${purchaseOrderId}`,
        )
            .then(async (res) => {
                if (!res.ok) throw new Error("Failed to load purchase order");
                return res.json();
            })
            .then((order) => {
                if (cancelled) return;
                if (order.status === "CANCELLED") {
                    toast.error("This purchase order is cancelled");
                    router.replace("/pharmacist/purchase-orders/view");
                    return;
                }
                const existingInvoice =
                    order.invoiceItem?.invoice ?? order.invoiceItems?.[0]?.invoice;
                if (existingInvoice?.invoiceNumber) {
                    toast.error(
                        `This order already has invoice #${existingInvoice.invoiceNumber}`,
                    );
                    router.replace("/pharmacist/purchase-invoices");
                    return;
                }
                if (!order.vendor?.id) {
                    toast.error("This purchase order has no vendor");
                    router.replace("/pharmacist/purchase-orders/view");
                    return;
                }
                const mfg = Number(order.manufacturerDiscount ?? order.inventoryItem?.manufacturerDiscount ?? 0);
                setLinkedPurchaseOrder({
                    id: order.id,
                    status: order.status,
                    itemName: order.inventoryItem?.name || "Item",
                });
                setInvoiceData((prev) => ({
                    ...prev,
                    vendorId: order.vendor.id,
                }));
                setInvoiceItems([
                    {
                        inventoryItemId: order.inventoryItemId,
                        quantity: String(order.quantityOrdered ?? ""),
                        unitCost: String(order.purchasePrice ?? order.inventoryItem?.purchasePrice ?? ""),
                        discount: mfg > 0 ? String(mfg) : "",
                        purchaseOrderId: order.id,
                    },
                ]);
            })
            .catch((err) => {
                console.error(err);
                toast.error("Could not load purchase order");
                router.replace("/pharmacist/purchase-orders/view");
            })
            .finally(() => {
                if (!cancelled) setLoadingOrder(false);
            });
        return () => {
            cancelled = true;
        };
    }, [purchaseOrderId, router]);

    // Items are fetched per vendor: the server filters to that vendor's linked
    // manufacturers, so the whole catalogue is never downloaded.
    useEffect(() => {
        const vendorId = invoiceData.vendorId;
        if (!vendorId) {
            setInventoryItems([]);
            return;
        }
        let cancelled = false;
        setLoadingItems(true);
        fetchAllPaginatedList<{ id: string; name: string }>(
            `${process.env.NEXT_PUBLIC_API_BASE_URL}/pharmacist?vendorId=${encodeURIComponent(vendorId)}`,
        )
            .then((data) => {
                if (cancelled) return;
                setInventoryItems(sortByLocaleKey(data, (i) => i.name));
            })
            .catch((err) => {
                if (cancelled) return;
                console.error(err);
                setInventoryItems([]);
                toast.error("Failed to load items for this vendor");
            })
            .finally(() => {
                if (!cancelled) setLoadingItems(false);
            });
        return () => {
            cancelled = true;
        };
    }, [invoiceData.vendorId]);

    const itemOptions = useMemo(
        () =>
            inventoryItems.map((inv) => ({
                id: inv.id as string,
                label: formatInventoryOptionLabel(inv),
            })),
        [inventoryItems],
    );

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
        if (field === "inventoryItemId" && value) {
            const inv = inventoryItems.find((i: { id: string }) => i.id === value);
            if (inv) {
                const pp = Number((inv as { purchasePrice?: number }).purchasePrice ?? 0);
                const cur = String(newItems[index].unitCost ?? "").trim();
                if (pp > 0 && (cur === "" || cur === "0")) {
                    newItems[index].unitCost = String(pp);
                }
            }
        }
        setInvoiceItems(newItems);
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!invoiceData.vendorId) {
            toast.error("Please select a vendor");
            return;
        }

        if (invoiceItems.length === 0 || invoiceItems.some((item) => !item.inventoryItemId || !item.purchaseOrderId)) {
            toast.error("This invoice must come from a purchase order");
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
            const payload: Record<string, unknown> = {
                vendorId: invoiceData.vendorId,
                items: invoiceItems.map((item) => ({
                    inventoryItemId: item.inventoryItemId,
                    quantity: Number(item.quantity || 0),
                    unitCost: Number(item.unitCost || 0),
                    discount: Number(item.discount || 0),
                    ...(item.purchaseOrderId
                        ? { purchaseOrderId: item.purchaseOrderId }
                        : {}),
                })),
            };
            if (invoiceData.invoiceNumber.trim()) {
                payload.invoiceNumber = invoiceData.invoiceNumber.trim();
            }

            const res = await fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL}/pharmacist/purchase-invoice`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(payload),
            });

            const result = await res.json().catch(() => null);
            if (!res.ok) {
                const msg =
                    typeof result?.message === "string"
                        ? result.message
                        : Array.isArray(result?.message)
                            ? result.message.join(", ")
                            : "Failed to create purchase invoice";
                throw new Error(msg);
            }

            toast.success(
                "Invoice saved. Stock was not added — it is received only when the purchase order is marked delivered.",
            );
            router.push("/pharmacist/purchase-invoices");
        } catch (error) {
            console.error(error);
            toast.error(
                error instanceof Error
                    ? error.message
                    : "Failed to create purchase invoice",
            );
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
                        Record the supplier bill for this purchase order. Stock is added only when the order is marked delivered.
                    </motion.p>
                    <div className="mt-4 h-px bg-gradient-to-r from-red-200/80 via-red-100/50 to-transparent rounded-full" />
                </header>

                {loadingOrder ? (
                    <p className="text-sm text-gray-500">Loading purchase order…</p>
                ) : null}

                {linkedPurchaseOrder && (
                    <div className="mb-5 rounded-lg border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-900">
                        Billing <strong>{linkedPurchaseOrder.itemName}</strong> from a
                        {linkedPurchaseOrder.status === "DELIVERED"
                            ? " delivered"
                            : " pending"}{" "}
                        purchase order. Saving this invoice updates the vendor balance only
                        {linkedPurchaseOrder.status === "DELIVERED"
                            ? " — quantity is already in inventory."
                            : ". Quantity is added when you mark the order delivered, not here."}
                    </div>
                )}

                <form onSubmit={handleSubmit} className="space-y-5">
                    <Card className="overflow-hidden bg-white border border-gray-100 rounded-xl shadow-sm">
                        <div className="border-l-4 border-l-red-500 bg-red-50/30 px-5 py-3 flex items-center justify-between">
                            <div>
                                <h2 className="text-base font-semibold text-red-800">
                                    Invoice details
                                </h2>
                                <p className="text-xs text-gray-500 mt-0.5">
                                    Vendor (who you owe) and optional manual invoice # (otherwise auto: 00001, 00002, …).
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
                                        placeholder="Invoice # (optional — auto if empty)"
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
                                            disabled={Boolean(linkedPurchaseOrder)}
                                            value={invoiceData.vendorId}
                                            onChange={(e) => {
                                                setInvoiceData({
                                                    ...invoiceData,
                                                    vendorId: e.target.value,
                                                });
                                                // Previously picked items may not belong to the new vendor.
                                                setInvoiceItems((rows) =>
                                                    rows.map((r) => ({ ...r, inventoryItemId: "" })),
                                                );
                                            }}
                                            className="w-full pl-9 pr-3 h-11 text-sm border border-gray-200 rounded-md bg-white focus:outline-none focus:border-red-500 focus:ring-1 focus:ring-red-500/20 disabled:bg-gray-50 disabled:text-gray-600"
                                        >
                                            <option value="" disabled>
                                                Select vendor
                                            </option>
                                            {vendors.map((m) => (
                                                <option key={m.id} value={m.id}>
                                                    {m.name}
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
                                    {linkedPurchaseOrder
                                        ? "Product and quantity come from the purchase order. You can adjust unit cost and discount to match the supplier bill."
                                        : "Add each product on the vendor invoice. If the item was already received on a delivered purchase order, stock will not be added again."}
                                </p>
                            </div>
                            {!linkedPurchaseOrder && (
                            <Button
                                type="button"
                                onClick={handleAddItem}
                                variant="outline"
                                className="border-red-600 text-red-700 hover:bg-red-50"
                            >
                                <PlusCircle className="mr-2 h-4 w-4" />
                                Add item
                            </Button>
                            )}
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
                                                        <ItemCombobox
                                                            options={
                                                                linkedPurchaseOrder && item.inventoryItemId
                                                                    ? [
                                                                          {
                                                                              id: item.inventoryItemId,
                                                                              label: linkedPurchaseOrder.itemName,
                                                                          },
                                                                          ...itemOptions.filter(
                                                                              (o) => o.id !== item.inventoryItemId,
                                                                          ),
                                                                      ]
                                                                    : itemOptions
                                                            }
                                                            value={item.inventoryItemId}
                                                            onChange={(id) =>
                                                                handleItemChange(
                                                                    index,
                                                                    "inventoryItemId",
                                                                    id,
                                                                )
                                                            }
                                                            disabled={
                                                                Boolean(item.purchaseOrderId) ||
                                                                !invoiceData.vendorId ||
                                                                loadingItems
                                                            }
                                                            placeholder={
                                                                !invoiceData.vendorId
                                                                    ? "Select a vendor first"
                                                                    : loadingItems
                                                                        ? "Loading items…"
                                                                        : "Select item"
                                                            }
                                                        />
                                                    </td>
                                                    <td className="p-3 align-top">
                                                        <Input
                                                            type="number"
                                                            min="1"
                                                            required
                                                            value={item.quantity}
                                                            disabled={Boolean(item.purchaseOrderId)}
                                                            onChange={(e) =>
                                                                handleItemChange(
                                                                    index,
                                                                    "quantity",
                                                                    e.target.value,
                                                                )
                                                            }
                                                            className="w-full h-9 text-center text-sm border-gray-300 disabled:bg-gray-50"
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
                                                        {!item.purchaseOrderId && (
                                                        <Button
                                                            type="button"
                                                            variant="ghost"
                                                            size="icon"
                                                            onClick={() => handleRemoveItem(index)}
                                                            className="text-red-500 hover:text-red-700 hover:bg-red-50"
                                                        >
                                                            <Trash2 className="h-4 w-4" />
                                                        </Button>
                                                        )}
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
