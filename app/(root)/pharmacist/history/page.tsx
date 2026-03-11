"use client";

import { useEffect, useState, useMemo } from "react";
import { DataTable } from "@/components/shared/DataTable";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { motion, AnimatePresence } from "framer-motion";
import { Search, Eye, RotateCcw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/app/providers/AuthProvider";
import { useInventory } from "@/app/context/InventoryContext";
import axios from "axios";
import { toast } from "sonner";
import Loading from "@/components/shared/Loading";

const PAYMENT_LABELS: Record<string, string> = {
  CASH: "Cash",
  CARD: "Card",
  ONLINE: "Online",
  DONATION: "Donation",
};

interface Sale {
  id: string;
  invoiceNumber?: string | null;
  quantity: number;
  salePrice: number;
  totalPrice: number;
  discount?: number;
  refundedAmount?: number;
  paymentMethod?: string;
  soldAt: string;
  customerName?: string | null;
  customerPhone?: string | null;
  saleItems: {
    id: string;
    quantity: number;
    salePrice: number;
    totalPrice: number;
    inventoryItemId: string;
    inventoryItem: {
      id: string;
      name: string;
      type: string;
      price: number;
    } | null;
  }[];
}

const SalesTable = () => {
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [sales, setSales] = useState<Sale[]>([]);
  const [viewSale, setViewSale] = useState<Sale | null>(null);
  const [refundSale, setRefundSale] = useState<Sale | null>(null);
  const [refundQuantities, setRefundQuantities] = useState<Record<string, number>>({});
  const [refundReason, setRefundReason] = useState("");
  const [refundSubmitting, setRefundSubmitting] = useState(false);
  const { user } = useAuth();
  const accessToken = user?.access_token;
  const { refetchInventory } = useInventory();

  const fetchSalesWithDateRange = async (
    startDate?: string,
    endDate?: string
  ) => {
    try {
      setLoading(true);
      const queryParams = new URLSearchParams();
      if (startDate) queryParams.append("startDate", startDate);
      if (endDate) queryParams.append("endDate", endDate);

      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_BASE_URL}/pharmacist/sales?${queryParams}`,
        {
          headers: accessToken ? { Authorization: `Bearer ${accessToken}` } : {},
        }
      );
      const result = await response.json();

      if (response.ok && result.success && Array.isArray(result.data)) {
        setSales(result.data);
      } else {
        console.error("Invalid response format:", result);
        setSales([]);
      }
    } catch (error) {
      console.error("Error fetching sales:", error);
      setSales([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSalesWithDateRange();
  }, [accessToken]);

  const filteredSales = useMemo(() => {
    if (!search.trim()) return sales;
    const s = search.toLowerCase();
    return sales.filter(
      (sale) =>
        (sale.invoiceNumber ?? "").toLowerCase().includes(s) ||
        (sale.customerName ?? "").toLowerCase().includes(s) ||
        (sale.customerPhone ?? "").toLowerCase().includes(s)
    );
  }, [sales, search]);

  const fetchSaleById = async (id: string) => {
    try {
      const { data } = await axios.get(
        `${process.env.NEXT_PUBLIC_API_BASE_URL}/pharmacist/sales/${id}`,
        { headers: { Authorization: `Bearer ${accessToken}` } }
      );
      setViewSale(data);
    } catch (e: any) {
      toast.error(e.response?.data?.message ?? "Failed to load sale");
    }
  };

  const openRefundModal = (sale: Sale) => {
    setRefundSale(sale);
    const q: Record<string, number> = {};
    sale.saleItems.forEach((si) => {
      q[si.id] = 0;
    });
    setRefundQuantities(q);
    setRefundReason("");
  };

  const handleRefundSubmit = async () => {
    if (!refundSale || !accessToken) return;
    const items = Object.entries(refundQuantities)
      .filter(([, q]) => q > 0)
      .map(([saleItemId, quantity]) => ({ saleItemId, quantity }));
    if (items.length === 0) {
      toast.error("Select at least one item and quantity to refund.");
      return;
    }
    setRefundSubmitting(true);
    try {
      await axios.post(
        `${process.env.NEXT_PUBLIC_API_BASE_URL}/pharmacist/sales/${refundSale.id}/refund`,
        { items, reason: refundReason || undefined },
        { headers: { Authorization: `Bearer ${accessToken}` } }
      );
      toast.success("Refund processed successfully.");
      setRefundSale(null);
      refetchInventory(); // Restored stock; keep inventory view in sync
      fetchSalesWithDateRange();
    } catch (e: any) {
      toast.error(e.response?.data?.message ?? "Refund failed.");
    } finally {
      setRefundSubmitting(false);
    }
  };

  const columns = [
    {
      id: "invoiceNumber",
      header: "Invoice #",
      cell: ({ row }: any) => (
        <span className="font-medium font-mono text-foreground">
          {row.original.invoiceNumber || "—"}
        </span>
      ),
    },
    {
      id: "customerName",
      header: "Customer",
      cell: ({ row }: any) => (
        <span className="text-foreground">{row.original.customerName || "—"}</span>
      ),
    },
    {
      id: "customerPhone",
      header: "Phone",
      cell: ({ row }: any) => (
        <span className="text-muted-foreground">{row.original.customerPhone || "—"}</span>
      ),
    },
    {
      id: "soldAt",
      header: "Date",
      cell: ({ row }: any) => (
        <span className="text-muted-foreground">
          {new Date(row.original.soldAt).toLocaleDateString()}
        </span>
      ),
    },
    {
      id: "paymentMethod",
      header: "Payment",
      cell: ({ row }: any) => (
        <span className="text-foreground">
          {PAYMENT_LABELS[row.original.paymentMethod as string] ?? row.original.paymentMethod ?? "—"}
        </span>
      ),
    },
    {
      id: "totalPrice",
      header: "Total",
      cell: ({ row }: any) => {
        const refunded = Number(row.original.refundedAmount) || 0;
        return (
          <span className="font-medium text-foreground">
            Rs {row.original.totalPrice.toLocaleString()}
            {refunded > 0 && (
              <span className="text-amber-600 text-xs ml-1 font-normal">
                (refunded: Rs {refunded})
              </span>
            )}
          </span>
        );
      },
    },
    {
      id: "actions",
      header: "Actions",
      cell: ({ row }: any) => (
        <div className="flex gap-1.5">
          <Button
            variant="outline"
            size="sm"
            onClick={(e) => { e.stopPropagation(); fetchSaleById(row.original.id); }}
            className="text-red-700 border-red-200 hover:bg-red-50 h-8 text-xs"
          >
            <Eye className="h-3.5 w-3.5 mr-1" />
            View
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={(e) => { e.stopPropagation(); openRefundModal(row.original); }}
            disabled={(Number(row.original.refundedAmount) || 0) >= row.original.totalPrice}
            className="text-amber-700 border-amber-200 hover:bg-amber-50 h-8 text-xs"
          >
            <RotateCcw className="h-3.5 w-3.5 mr-1" />
            Refund
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
            Sales History
          </motion.h1>
          <motion.p
            className="mt-1 text-sm text-gray-500"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.1 }}
          >
            Track and manage your sales transactions.
          </motion.p>
          <div className="mt-4 h-px bg-gradient-to-r from-red-200/80 via-red-100/50 to-transparent rounded-full" />
        </header>

        <Card className="overflow-hidden bg-white border border-gray-100 rounded-xl shadow-sm hover:shadow-md transition-shadow">
          <div className="border-l-4 border-l-red-500 bg-red-50/30 px-5 py-3">
            <h2 className="text-base font-semibold text-red-800">Sales Records</h2>
            <p className="text-xs text-gray-500 mt-0.5">
              Search by invoice, customer name, or phone.
            </p>
          </div>
          <CardContent className="p-4 sm:p-5">
            <div className="relative max-w-sm mb-4">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input
                placeholder="Search sales..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-9 h-10 border-gray-200 focus:border-red-500 focus:ring-red-500/20"
              />
            </div>
            {loading ? (
              <div className="min-h-[280px] flex items-center justify-center">
                <Loading />
              </div>
            ) : (
              <AnimatePresence>
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ duration: 0.2 }}
                  className="rounded-lg border border-gray-100 overflow-hidden"
                >
                  <DataTable
                    columns={columns}
                    data={Array.isArray(filteredSales) ? filteredSales : []}
                    disableRowClick={true}
                  />
                </motion.div>
              </AnimatePresence>
            )}
          </CardContent>
        </Card>

      {/* View Sale Detail Dialog */}
      <Dialog open={!!viewSale} onOpenChange={() => setViewSale(null)}>
        <DialogContent className="max-w-lg max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-red-800">
              Sale {viewSale?.invoiceNumber ?? viewSale?.id}
            </DialogTitle>
          </DialogHeader>
          {viewSale && (
            <div className="space-y-3 text-sm">
              <div className="grid grid-cols-2 gap-2">
                <span className="text-gray-500">Date</span>
                <span>{new Date(viewSale.soldAt).toLocaleString()}</span>
                <span className="text-gray-500">Customer</span>
                <span>{viewSale.customerName || "—"}</span>
                <span className="text-gray-500">Phone</span>
                <span>{viewSale.customerPhone || "—"}</span>
                <span className="text-gray-500">Payment</span>
                <span>{PAYMENT_LABELS[viewSale.paymentMethod as string] ?? viewSale.paymentMethod ?? "—"}</span>
                <span className="text-gray-500">Total</span>
                <span>Rs {viewSale.totalPrice}</span>
                {(Number(viewSale.refundedAmount) || 0) > 0 && (
                  <>
                    <span className="text-gray-500">Refunded</span>
                    <span className="text-amber-600">Rs {viewSale.refundedAmount}</span>
                  </>
                )}
              </div>
              <div>
                <p className="font-medium text-gray-700 mb-2">Items</p>
                <ul className="border rounded p-2 space-y-1">
                  {viewSale.saleItems?.map((si) => (
                    <li key={si.id} className="flex justify-between">
                      <span>{si.inventoryItem?.name ?? si.inventoryItemId}</span>
                      <span>{si.quantity} × Rs {si.salePrice} = Rs {si.totalPrice}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Refund Dialog */}
      <Dialog open={!!refundSale} onOpenChange={() => setRefundSale(null)}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="text-red-800">Refund Sale</DialogTitle>
          </DialogHeader>
          {refundSale && (
            <div className="space-y-4">
              <p className="text-sm text-gray-600">
                Invoice: {refundSale.invoiceNumber ?? refundSale.id}. Select quantities to refund.
              </p>
              <div className="space-y-2 max-h-48 overflow-y-auto">
                {refundSale.saleItems.map((si) => (
                  <div key={si.id} className="flex items-center justify-between gap-2 border-b pb-2">
                    <span className="text-sm font-medium truncate flex-1">{si.inventoryItem?.name ?? si.inventoryItemId}</span>
                    <span className="text-xs text-gray-500">max: {si.quantity}</span>
                    <Input
                      type="number"
                      min={0}
                      max={si.quantity}
                      value={refundQuantities[si.id] ?? 0}
                      onChange={(e) =>
                        setRefundQuantities((prev) => ({
                          ...prev,
                          [si.id]: Math.min(si.quantity, Math.max(0, parseInt(e.target.value, 10) || 0)),
                        }))
                      }
                      className="w-20"
                    />
                  </div>
                ))}
              </div>
              <div>
                <Label>Reason (optional)</Label>
                <Input
                  value={refundReason}
                  onChange={(e) => setRefundReason(e.target.value)}
                  placeholder="e.g. Returned by customer"
                  className="mt-1"
                />
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setRefundSale(null)}>
              Cancel
            </Button>
            <Button
              className="bg-red-800 hover:bg-red-900"
              onClick={handleRefundSubmit}
              disabled={refundSubmitting}
            >
              {refundSubmitting ? "Processing..." : "Process Refund"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      </div>
    </div>
  );
};

export default SalesTable;
