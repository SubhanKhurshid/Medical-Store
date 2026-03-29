"use client";
import React, { useEffect, useState } from "react";
import { useAuth } from "@/app/providers/AuthProvider";
import { Card, CardContent } from "@/components/ui/card";
import { motion } from "framer-motion";
import { ArrowLeft } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import Loading from "@/components/shared/Loading";


type Period = "day" | "month" | "year";

interface ProfitLossData {
  period: string;
  totalRevenue: number;
  totalCost: number;
  profit: number;
  from: string;
  to: string;
}

export default function ProfitLossReportPage() {
  const { user } = useAuth();
  const [data, setData] = useState<ProfitLossData | null>(null);
  const [loading, setLoading] = useState(true);
  const [period, setPeriod] = useState<Period>("month");

  useEffect(() => {
    if (!user?.access_token) return;
    const fetchData = async () => {
      setLoading(true);
      try {
        const res = await fetch(
          `${process.env.NEXT_PUBLIC_API_BASE_URL}/pharmacist/reports/profit-loss?period=${period}`,
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
  }, [user?.access_token, period]);

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
                Profit & Loss Report
              </motion.h1>
              <motion.p
                className="mt-1 text-sm text-gray-500"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 0.4, delay: 0.1 }}
              >
                Revenue, cost, and profit analytics for business performance. Cost of goods uses each item’s net unit cost (list purchase after manufacturer and special company discounts).
              </motion.p>
            </div>
          </div>
          <div className="h-px bg-gradient-to-r from-red-200/80 via-red-100/50 to-transparent rounded-full" />
        </header>

        <Card className="overflow-hidden bg-white border border-gray-100 rounded-xl shadow-sm hover:shadow-md transition-shadow">
          <div className="border-l-4 border-l-red-500 bg-red-50/30 px-5 py-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h2 className="text-base font-semibold text-red-800">Financial Summary</h2>
              <p className="text-xs text-gray-500 mt-0.5">Select a period to filter results</p>
            </div>
            <div className="flex bg-white p-1 rounded-lg border border-gray-100 shadow-sm">
              {(["day", "month", "year"] as const).map((p) => (
                <Button
                  key={p}
                  variant={period === p ? "default" : "ghost"}
                  size="sm"
                  onClick={() => setPeriod(p)}
                  className={`capitalize px-4 ${period === p ? "bg-red-800 text-white hover:bg-red-700" : "text-gray-600 hover:text-red-800 hover:bg-red-50"
                    }`}
                >
                  {p}
                </Button>
              ))}
            </div>
          </div>
          <CardContent className="p-6">
            {loading ? (
              <div className="py-20 flex items-center justify-center">
                <Loading />
              </div>
            ) : data ? (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="grid gap-6 sm:grid-cols-3"
              >
                <div className="rounded-xl border border-green-100 bg-green-50/20 p-6 flex flex-col items-center sm:items-start group transition-all hover:bg-green-50/40">
                  <p className="text-sm font-medium text-green-700 mb-1">Total Revenue</p>
                  <p className="text-3xl font-bold text-green-600 tracking-tight group-hover:scale-105 transition-transform">
                    {formatCurrency(data.totalRevenue)}
                  </p>
                </div>
                <div className="rounded-xl border border-amber-100 bg-amber-50/20 p-6 flex flex-col items-center sm:items-start group transition-all hover:bg-amber-50/40">
                  <p className="text-sm font-medium text-amber-700 mb-1">Total Cost</p>
                  <p className="text-3xl font-bold text-amber-600 tracking-tight group-hover:scale-105 transition-transform">
                    {formatCurrency(data.totalCost)}
                  </p>
                </div>
                <div className={`rounded-xl border p-6 flex flex-col items-center sm:items-start group transition-all ${data.profit >= 0
                  ? "border-green-100 bg-green-50/20 hover:bg-green-50/40"
                  : "border-red-100 bg-red-50/20 hover:bg-red-50/40"
                  }`}>
                  <p className={`text-sm font-medium mb-1 ${data.profit >= 0 ? "text-green-700" : "text-red-700"}`}>
                    Net Profit
                  </p>
                  <p className={`text-3xl font-bold tracking-tight group-hover:scale-105 transition-transform ${data.profit >= 0 ? "text-green-600" : "text-red-600"
                    }`}>
                    {formatCurrency(data.profit)}
                  </p>
                </div>
              </motion.div>
            ) : (
              <div className="py-20 text-center">
                <p className="text-gray-500 font-medium">No financial data available for this period.</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

