"use client";

import { useAuth } from "@/app/providers/AuthProvider";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { motion } from "framer-motion";
import { Loader, Package, ArrowLeft } from "lucide-react";
import Link from "next/link";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

import Loading from "@/components/shared/Loading";

interface StockReportData {
  summary: {
    totalItems: number;
    totalValueAtCost: number;
    totalValueAtSelling: number;
  };
  items: Array<{
    id: string;
    name: string;
    type: string;
    quantity: number;
    minimumStock: number;
    valueAtCost: number;
    valueAtSelling: number;
    manufacturer?: string;
  }>;
}

export default function StockReportPage() {
  const { user } = useAuth();
  const [data, setData] = useState<StockReportData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user?.access_token) return;
    const fetchData = async () => {
      setLoading(true);
      try {
        const res = await fetch(
          `${process.env.NEXT_PUBLIC_API_BASE_URL}/pharmacist/reports/stock`,
          { headers: { Authorization: `Bearer ${user.access_token}` } }
        );
        const json = await res.json();
        setData(json);
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [user?.access_token]);

  const formatCurrency = (n: number) =>
    new Intl.NumberFormat("en-PK", {
      style: "currency",
      currency: "PKR",
      maximumFractionDigits: 0,
    }).format(n);

  return (
    <div className="min-h-screen bg-gray-50/80">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
        <header className="mb-8">
          <div className="flex items-center gap-4 mb-4">
            <Button variant="ghost" size="icon" asChild className="rounded-full hover:bg-red-50 hover:text-red-800">
              <Link href="/pharmacist/reports">
                <ArrowLeft className="h-5 w-5" />
              </Link>
            </Button>
            <div>
              <motion.h1
                className="text-2xl sm:text-3xl font-bold text-red-800 tracking-tight"
                initial={{ opacity: 0, y: -8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4 }}
              >
                Stock Report
              </motion.h1>
              <motion.p
                className="mt-1 text-sm text-gray-500"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 0.4, delay: 0.1 }}
              >
                Comprehensive overview of current inventory levels and valuation.
              </motion.p>
            </div>
          </div>
          <div className="h-px bg-gradient-to-r from-red-200/80 via-red-100/50 to-transparent rounded-full" />
        </header>

        {loading ? (
          <div className="py-20 flex items-center justify-center">
            <Loading />
          </div>
        ) : data ? (
          <>
            <div className="grid gap-6 sm:grid-cols-3 mb-8">
              <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
                <Card className="border-gray-100 shadow-sm overflow-hidden bg-white">
                  <CardHeader className="pb-2 bg-gray-50/50 border-b border-gray-100">
                    <CardTitle className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Total Items</CardTitle>
                  </CardHeader>
                  <CardContent className="pt-4 pb-6">
                    <p className="text-3xl font-bold text-gray-900">{data.summary.totalItems}</p>
                    <p className="text-xs text-gray-400 mt-1">Unique products in stock</p>
                  </CardContent>
                </Card>
              </motion.div>
              <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
                <Card className="border-gray-100 shadow-sm overflow-hidden bg-white">
                  <CardHeader className="pb-2 bg-amber-50/30 border-b border-amber-100">
                    <CardTitle className="text-xs font-semibold text-amber-700 uppercase tracking-wider">Value at Cost</CardTitle>
                  </CardHeader>
                  <CardContent className="pt-4 pb-6">
                    <p className="text-3xl font-bold text-amber-600">{formatCurrency(data.summary.totalValueAtCost)}</p>
                    <p className="text-xs text-amber-500 mt-1">Investment in inventory</p>
                  </CardContent>
                </Card>
              </motion.div>
              <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}>
                <Card className="border-gray-100 shadow-sm overflow-hidden bg-white">
                  <CardHeader className="pb-2 bg-green-50/30 border-b border-green-100">
                    <CardTitle className="text-xs font-semibold text-green-700 uppercase tracking-wider">Value at Selling</CardTitle>
                  </CardHeader>
                  <CardContent className="pt-4 pb-6">
                    <p className="text-3xl font-bold text-green-600">{formatCurrency(data.summary.totalValueAtSelling)}</p>
                    <p className="text-xs text-green-500 mt-1">Expected return on sales</p>
                  </CardContent>
                </Card>
              </motion.div>
            </div>

            <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }}>
              <Card className="overflow-hidden border border-gray-100 rounded-xl shadow-sm bg-white">
                <div className="border-l-4 border-l-red-500 bg-red-50/30 px-5 py-4">
                  <h2 className="text-base font-semibold text-red-800">Item-wise Stock Analysis</h2>
                  <p className="text-xs text-gray-500 mt-0.5">Quantity and valuation details for each inventory item.</p>
                </div>
                <CardContent className="p-0">
                  <div className="overflow-x-auto">
                    <Table>
                      <TableHeader className="bg-gray-50/80">
                        <TableRow>
                          <TableHead className="font-semibold text-gray-900">Name</TableHead>
                          <TableHead className="font-semibold text-gray-900 text-center">Type</TableHead>
                          <TableHead className="font-semibold text-gray-900 text-center">Qty</TableHead>
                          <TableHead className="font-semibold text-gray-900 text-center">Min Stock</TableHead>
                          <TableHead className="font-semibold text-gray-900 text-right">Value (Cost)</TableHead>
                          <TableHead className="font-semibold text-gray-900 text-right">Value (Selling)</TableHead>
                          <TableHead className="font-semibold text-gray-900">Manufacturer</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {data.items.length === 0 ? (
                          <TableRow>
                            <TableCell colSpan={7} className="h-32 text-center text-gray-500 italic">
                              No stock data recorded yet.
                            </TableCell>
                          </TableRow>
                        ) : (
                          data.items.map((row) => (
                            <TableRow key={row.id} className="hover:bg-gray-50/50 transition-colors">
                              <TableCell className="font-medium text-gray-900">{row.name}</TableCell>
                              <TableCell className="text-center">
                                <span className="inline-flex px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-gray-100 text-gray-600 uppercase">
                                  {row.type}
                                </span>
                              </TableCell>
                              <TableCell className="text-center font-bold text-red-900">{row.quantity}</TableCell>
                              <TableCell className="text-center text-gray-500">{row.minimumStock}</TableCell>
                              <TableCell className="text-right text-amber-700 font-medium">{formatCurrency(row.valueAtCost)}</TableCell>
                              <TableCell className="text-right text-green-700 font-medium">{formatCurrency(row.valueAtSelling)}</TableCell>
                              <TableCell className="text-muted-foreground">{row.manufacturer ?? "—"}</TableCell>
                            </TableRow>
                          ))
                        )}
                      </TableBody>
                    </Table>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          </>
        ) : (
          <div className="py-20 text-center bg-white rounded-xl border border-dashed border-gray-200">
            <Package className="h-12 w-12 text-gray-300 mx-auto mb-4" />
            <p className="text-gray-500 font-medium">No stock data available at this moment.</p>
          </div>
        )}
      </div>
    </div>
  );
}

