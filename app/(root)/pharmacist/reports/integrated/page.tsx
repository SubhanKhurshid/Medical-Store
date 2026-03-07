"use client";

import { useAuth } from "@/app/providers/AuthProvider";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { motion } from "framer-motion";
import { Loader, ArrowLeft, AlertTriangle, Package } from "lucide-react";
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
import { TableEmptyState } from "@/components/shared/TableEmptyState";

interface LowStockItem {
  id: string;
  name: string;
  currentQuantity: number;
  minimumQuantity: number;
  manufacturer?: string;
}

interface ExpiryItem {
  id: string;
  name: string;
  quantity: number;
  expiryDate: string;
  batchNumber: string;
  manufacturer?: string;
}

interface IntegratedData {
  lowStock: LowStockItem[];
  expiring: ExpiryItem[];
}

export default function IntegratedReportPage() {
  const { user } = useAuth();
  const [data, setData] = useState<IntegratedData | null>(null);
  const [loading, setLoading] = useState(true);
  const [days, setDays] = useState(30);

  useEffect(() => {
    if (!user?.access_token) return;
    const fetchData = async () => {
      setLoading(true);
      try {
        const res = await fetch(
          `${process.env.NEXT_PUBLIC_API_BASE_URL}/pharmacist/reports/integrated?days=${days}`,
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
  }, [user?.access_token, days]);

  const formatDate = (d: string) =>
    new Date(d).toLocaleDateString("en-PK", { year: "numeric", month: "short", day: "numeric" });

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="p-6 md:p-8 max-w-6xl mx-auto min-h-screen bg-gray-50"
    >
      <div className="flex items-center gap-4 mb-6">
        <Button variant="ghost" size="icon" asChild>
          <Link href="/pharmacist/reports">
            <ArrowLeft className="h-5 w-5" />
          </Link>
        </Button>
        <div>
          <h1 className="text-2xl md:text-3xl font-bold text-red-800">
            Integrated Expiry & Low Stock
          </h1>
          <p className="text-gray-500">Items below minimum stock and items expiring soon.</p>
        </div>
      </div>

      <Card className="mb-6">
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>Expiring within</CardTitle>
          <div className="flex gap-2">
            {[30, 60, 90].map((d) => (
              <Button
                key={d}
                variant={days === d ? "default" : "outline"}
                size="sm"
                onClick={() => setDays(d)}
              >
                {d} days
              </Button>
            ))}
          </div>
        </CardHeader>
      </Card>

      {loading ? (
        <Card>
          <CardContent className="flex items-center justify-center py-12">
            <Loader className="h-8 w-8 animate-spin text-red-600" />
          </CardContent>
        </Card>
      ) : data ? (
        <div className="grid gap-6 lg:grid-cols-2">
          <Card>
            <CardHeader className="flex flex-row items-center gap-2">
              <Package className="h-5 w-5 text-amber-600" />
              <CardTitle>Low stock ({data.lowStock?.length ?? 0})</CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              <Table wrapperClassName={(data.lowStock ?? []).length > 0 ? "min-h-[260px]" : undefined}>
                <TableHeader>
                  <TableRow>
                    <TableHead>Name</TableHead>
                    <TableHead>Current</TableHead>
                    <TableHead>Minimum</TableHead>
                    <TableHead>Manufacturer</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {(data.lowStock ?? []).length === 0 ? (
                    <TableEmptyState
                      icon={Package}
                      title="No low stock items"
                      description="All items are above their minimum stock level."
                      colSpan={4}
                    />
                  ) : (
                    (data.lowStock ?? []).map((row) => (
                      <TableRow key={row.id}>
                        <TableCell className="font-medium">{row.name}</TableCell>
                        <TableCell className="text-amber-600 font-semibold">{row.currentQuantity}</TableCell>
                        <TableCell>{row.minimumQuantity}</TableCell>
                        <TableCell>{row.manufacturer ?? "—"}</TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-orange-600" />
              <CardTitle>Expiring soon ({data.expiring?.length ?? 0})</CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              <Table wrapperClassName={(data.expiring ?? []).length > 0 ? "min-h-[260px]" : undefined}>
                <TableHeader>
                  <TableRow>
                    <TableHead>Name</TableHead>
                    <TableHead>Qty</TableHead>
                    <TableHead>Expiry</TableHead>
                    <TableHead>Batch</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {(data.expiring ?? []).length === 0 ? (
                    <TableEmptyState
                      icon={AlertTriangle}
                      title="No items expiring soon"
                      description={`No inventory items expire in the next ${days} days.`}
                      colSpan={4}
                    />
                  ) : (
                    (data.expiring ?? []).map((row) => (
                      <TableRow key={row.id}>
                        <TableCell className="font-medium">{row.name}</TableCell>
                        <TableCell>{row.quantity}</TableCell>
                        <TableCell>{formatDate(row.expiryDate)}</TableCell>
                        <TableCell>{row.batchNumber}</TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </div>
      ) : (
        <Card>
          <CardContent className="py-12 text-center text-muted-foreground">
            No data available.
          </CardContent>
        </Card>
      )}
    </motion.div>
  );
}
