"use client";

import { useAuth } from "@/app/providers/AuthProvider";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { motion } from "framer-motion";
import { Calendar, ArrowLeft } from "lucide-react";
import Loading from "@/components/shared/Loading";
import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { sortByLocaleKey } from "@/lib/sort-alphabetical";
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
import { CalendarX } from "lucide-react";

interface ExpiryItem {
  id: string;
  name: string;
  quantity: number;
  expiryDate: string;
  batchNumber: string;
  manufacturer?: string;
}

export default function ExpiryReportPage() {
  const { user } = useAuth();
  const [items, setItems] = useState<ExpiryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [days, setDays] = useState(30);

  useEffect(() => {
    if (!user?.access_token) return;
    const fetchData = async () => {
      setLoading(true);
      try {
        const res = await fetch(
          `${process.env.NEXT_PUBLIC_API_BASE_URL}/pharmacist/reports/expiry?days=${days}`,
          { headers: { Authorization: `Bearer ${user.access_token}` } }
        );
        const json = await res.json();
        setItems(Array.isArray(json) ? json : []);
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

  const sortedItems = useMemo(() => sortByLocaleKey(items, (r) => r.name), [items]);

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
            Expiry Report
          </h1>
          <p className="text-gray-500">Items expiring within the selected window.</p>
        </div>
      </div>

      <Card>
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
        <CardContent className="p-0">
          {loading ? (
            <div className="min-h-[280px] flex items-center justify-center">
              <Loading />
            </div>
          ) : (
            <Table wrapperClassName={sortedItems.length > 0 ? "min-h-[260px]" : undefined}>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Quantity</TableHead>
                  <TableHead>Expiry Date</TableHead>
                  <TableHead>Batch</TableHead>
                  <TableHead>Manufacturer</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {sortedItems.length === 0 ? (
                  <TableEmptyState
                    icon={CalendarX}
                    title="No items expiring soon"
                    description={`No inventory items expire in the next ${days} days.`}
                    colSpan={5}
                  />
                ) : (
                  sortedItems.map((row) => (
                    <TableRow key={row.id}>
                      <TableCell className="font-medium">{row.name}</TableCell>
                      <TableCell>{row.quantity}</TableCell>
                      <TableCell>{formatDate(row.expiryDate)}</TableCell>
                      <TableCell>{row.batchNumber}</TableCell>
                      <TableCell>{row.manufacturer ?? "—"}</TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </motion.div>
  );
}
