"use client";

import { useEffect, useState } from "react";
import axios from "axios";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import Loading from "@/components/shared/Loading";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { AlertCircle, Printer } from "lucide-react";

interface PendingManufacturer {
  id: string;
  companyName: string;
}

interface PendingVendor {
  id: string;
  name: string;
}

interface CompanyPurchaseOrder {
  id: string;
  quantityOrdered: number;
  status: "PENDING" | "DELIVERED" | "CANCELLED";
  orderDate: string;
  inventoryItem: {
    id: string;
    name: string;
    barcode?: string | null;
  };
  manufacturer: {
    id: string;
    companyName: string;
    phone?: string | null;
    address?: string | null;
  };
}

export default function CompanyPurchaseOrderPrintPage() {
  const router = useRouter();
  const [groupBy, setGroupBy] = useState<"vendor" | "manufacturer">("vendor");
  const [manufacturers, setManufacturers] = useState<PendingManufacturer[]>([]);
  const [vendors, setVendors] = useState<PendingVendor[]>([]);
  const [selectedManufacturerId, setSelectedManufacturerId] = useState<string>("");
  const [selectedVendorId, setSelectedVendorId] = useState<string>("");
  const [orders, setOrders] = useState<CompanyPurchaseOrder[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingOrders, setLoadingOrders] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const load = async () => {
      try {
        setLoading(true);
        const [mRes, vRes] = await Promise.all([
          axios.get(
            `${process.env.NEXT_PUBLIC_API_BASE_URL}/pharmacist/purchase-orders/pending-manufacturers`
          ),
          axios.get(
            `${process.env.NEXT_PUBLIC_API_BASE_URL}/pharmacist/purchase-orders/pending-vendors`
          ),
        ]);
        const mData = mRes.data ?? [];
        const vData = vRes.data ?? [];
        setManufacturers(mData);
        setVendors(vData);
        if (vData.length > 0) {
          setSelectedVendorId(vData[0].id);
        }
        if (mData.length > 0) {
          setSelectedManufacturerId(mData[0].id);
        }
      } catch (err) {
        console.error(err);
        setError("Failed to load pending purchase order groups");
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  useEffect(() => {
    const id = groupBy === "vendor" ? selectedVendorId : selectedManufacturerId;
    if (!id) {
      setOrders([]);
      return;
    }
    const fetchOrders = async () => {
      try {
        setLoadingOrders(true);
        const path =
          groupBy === "vendor"
            ? `${process.env.NEXT_PUBLIC_API_BASE_URL}/pharmacist/purchase-orders/by-vendor/${id}`
            : `${process.env.NEXT_PUBLIC_API_BASE_URL}/pharmacist/purchase-orders/by-manufacturer/${id}`;
        const { data } = await axios.get(path);
        setOrders(data ?? []);
        setError(null);
      } catch (err) {
        console.error(err);
        setError("Failed to load purchase orders for this selection");
      } finally {
        setLoadingOrders(false);
      }
    };
    fetchOrders();
  }, [groupBy, selectedManufacturerId, selectedVendorId]);

  const handlePrint = () => {
    window.print();
  };

  const formatDate = (iso: string) =>
    new Date(iso).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50/80">
        <Loading />
      </div>
    );
  }

  const selectedManufacturer = manufacturers.find((m) => m.id === selectedManufacturerId);
  const selectedVendor = vendors.find((v) => v.id === selectedVendorId);

  return (
    <div id="company-po-print-root" className="min-h-screen bg-gray-50/80 print:bg-white">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8 print:px-0 print:py-0">
        {/* Screen header (not printed) */}
        <header className="mb-6 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 print:hidden">
          <div>
            <motion.h1
              className="text-2xl sm:text-3xl font-bold text-red-800 tracking-tight"
              initial={{ opacity: 0, y: -8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4 }}
            >
              Pending purchase orders (print)
            </motion.h1>
            <motion.p
              className="mt-1 text-sm text-gray-500"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.1 }}
            >
              Group by vendor (supplier) or by drug manufacturer (legacy).
            </motion.p>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" onClick={() => router.back()}>
              Back
            </Button>
            <Button
              className="bg-red-800 hover:bg-red-700 text-white"
              onClick={handlePrint}
              disabled={!orders.length}
            >
              <Printer className="mr-2 h-4 w-4" />
              Print
            </Button>
          </div>
        </header>

        <Card className="bg-white border border-gray-100 rounded-xl shadow-sm print:shadow-none print:border print:border-black/40">
          <CardContent className="p-4 sm:p-5 print:p-4">
            {/* Print heading */}
            <div className="mb-4 border-b border-gray-200 pb-3 text-center">
              <h1 className="text-xl font-bold tracking-wide text-gray-900 print:text-lg">
                NS Ibrahim Medical Store
              </h1>
              <p className="text-xs text-gray-600">
                Pending Purchase Orders — {groupBy === "vendor" ? "by vendor" : "by manufacturer"}
              </p>
              <p className="mt-1 text-[11px] text-gray-500">
                Printed on{" "}
                {new Date().toLocaleDateString("en-US", {
                  year: "numeric",
                  month: "short",
                  day: "numeric",
                })}
              </p>
            </div>

            {/* Company + meta */}
            <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4 mb-4">
              <div>
                <p className="text-xs font-semibold text-gray-700">
                  {groupBy === "vendor" ? "Vendor" : "Drug manufacturer"}:
                </p>
                <p className="text-sm font-semibold text-gray-900 mt-0.5">
                  {groupBy === "vendor"
                    ? selectedVendor?.name || "Select vendor"
                    : selectedManufacturer?.companyName || "Select manufacturer"}
                </p>
              </div>
              <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 print:hidden">
                <Select
                  value={groupBy}
                  onValueChange={(v) => setGroupBy(v as "vendor" | "manufacturer")}
                >
                  <SelectTrigger className="w-44">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="vendor">By vendor</SelectItem>
                    <SelectItem value="manufacturer">By manufacturer</SelectItem>
                  </SelectContent>
                </Select>
                {groupBy === "vendor" ? (
                  <Select value={selectedVendorId} onValueChange={setSelectedVendorId}>
                    <SelectTrigger className="w-60">
                      <SelectValue placeholder="Select vendor" />
                    </SelectTrigger>
                    <SelectContent>
                      {vendors.map((m) => (
                        <SelectItem key={m.id} value={m.id}>
                          {m.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                ) : (
                  <Select value={selectedManufacturerId} onValueChange={setSelectedManufacturerId}>
                    <SelectTrigger className="w-60">
                      <SelectValue placeholder="Select manufacturer" />
                    </SelectTrigger>
                    <SelectContent>
                      {manufacturers.map((m) => (
                        <SelectItem key={m.id} value={m.id}>
                          {m.companyName}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
              </div>
            </div>

            {error && (
              <Alert variant="destructive" className="mb-4 print:hidden">
                <AlertCircle className="h-4 w-4" />
                <AlertTitle>Error</AlertTitle>
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}

            {loadingOrders ? (
              <div className="py-10 flex items-center justify-center">
                <Loading />
              </div>
            ) : !orders.length ? (
              <div className="py-12 text-center text-sm text-gray-500">
                No pending purchase orders for this selection.
              </div>
            ) : (
              <div className="border border-gray-200 rounded-md overflow-hidden">
                <Table>
                  <TableHeader className="bg-gray-50 print:bg-gray-100">
                    <TableRow>
                      <TableHead className="text-xs font-semibold text-gray-700">
                        Item
                      </TableHead>
                      {groupBy === "vendor" && (
                        <TableHead className="text-xs font-semibold text-gray-700">
                          Mfg.
                        </TableHead>
                      )}
                      <TableHead className="text-xs font-semibold text-gray-700">
                        Barcode
                      </TableHead>
                      <TableHead className="text-xs font-semibold text-gray-700">
                        Qty Ordered
                      </TableHead>
                      <TableHead className="text-xs font-semibold text-gray-700">
                        Order Date
                      </TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {orders.map((order) => (
                      <TableRow key={order.id}>
                        <TableCell className="text-xs">
                          {order.inventoryItem?.name ?? "N/A"}
                        </TableCell>
                        {groupBy === "vendor" && (
                          <TableCell className="text-xs">
                            {order.manufacturer?.companyName ?? "—"}
                          </TableCell>
                        )}
                        <TableCell className="text-xs">
                          {order.inventoryItem?.barcode || "-"}
                        </TableCell>
                        <TableCell className="text-xs">
                          {order.quantityOrdered}
                        </TableCell>
                        <TableCell className="text-xs">
                          {formatDate(order.orderDate)}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      <style jsx global>{`
        @media print {
          @page {
            size: A4 portrait;
            margin: 12mm;
          }

          body {
            background: white !important;
          }

          /* Show only our dedicated print root */
          body * {
            visibility: hidden;
          }

          #company-po-print-root,
          #company-po-print-root * {
            visibility: visible;
          }

          #company-po-print-root {
            margin: 0 !important;
            padding: 0 !important;
          }
        }
      `}</style>
    </div>
  );
}

