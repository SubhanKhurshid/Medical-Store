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

type PaymentTotalsResponse = {
  period: Period;
  from: string;
  to: string;
  CASH: number;
  CARD: number;
  ONLINE: number;
  DONATION: number;
  CREDIT: number;
  grandTotal: number;
};

export default function PaymentMethodTotalsPage() {
  const { user } = useAuth();
  const [data, setData] = useState<PaymentTotalsResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [period, setPeriod] = useState<Period>("month");

  const formatCurrency = (n: number) =>
    new Intl.NumberFormat("en-PK", {
      style: "currency",
      currency: "PKR",
      maximumFractionDigits: 0,
    }).format(n);

  useEffect(() => {
    if (!user?.access_token) return;
    const fetchData = async () => {
      setLoading(true);
      try {
        const res = await fetch(
          `${process.env.NEXT_PUBLIC_API_BASE_URL}/pharmacist/reports/payment-method-totals?period=${period}`,
          { headers: { Authorization: `Bearer ${user.access_token}` } },
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

  return (
    <div className="min-h-screen bg-gray-50/80">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
        <header className="mb-8">
          <div className="flex items-center gap-4 mb-4">
            <Button
              variant="ghost"
              size="icon"
              asChild
              className="rounded-full hover:bg-red-50 hover:text-red-800"
            >
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
                Accounts: Payment Totals
              </motion.h1>
              <motion.p
                className="mt-1 text-sm text-gray-500"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 0.4, delay: 0.1 }}
              >
                Total sales by Cash / Card / Online / Donation / Credit.
              </motion.p>
            </div>
          </div>
          <div className="h-px bg-gradient-to-r from-red-200/80 via-red-100/50 to-transparent rounded-full" />
        </header>

        <Card className="overflow-hidden bg-white border border-gray-100 rounded-xl shadow-sm hover:shadow-md transition-shadow">
          <div className="border-l-4 border-l-red-500 bg-red-50/30 px-5 py-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h2 className="text-base font-semibold text-red-800">
                Payment Method Summary
              </h2>
              <p className="text-xs text-gray-500 mt-0.5">
                Select a period to view totals.
              </p>
            </div>
            <div className="flex bg-white p-1 rounded-lg border border-gray-100 shadow-sm">
              {(["day", "month", "year"] as const).map((p) => (
                <Button
                  key={p}
                  variant={period === p ? "default" : "ghost"}
                  size="sm"
                  onClick={() => setPeriod(p)}
                  className={`capitalize px-4 ${
                    period === p
                      ? "bg-red-800 text-white hover:bg-red-700"
                      : "text-gray-600 hover:text-red-800 hover:bg-red-50"
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
                className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3"
              >
                <div className="rounded-xl border border-red-100 bg-red-50/20 p-6">
                  <p className="text-sm font-medium text-red-700 mb-1">Cash</p>
                  <p className="text-3xl font-bold text-red-600 tracking-tight">
                    {formatCurrency(data.CASH || 0)}
                  </p>
                </div>

                <div className="rounded-xl border border-blue-100 bg-blue-50/20 p-6">
                  <p className="text-sm font-medium text-blue-700 mb-1">Card</p>
                  <p className="text-3xl font-bold text-blue-600 tracking-tight">
                    {formatCurrency(data.CARD || 0)}
                  </p>
                </div>

                <div className="rounded-xl border border-indigo-100 bg-indigo-50/20 p-6">
                  <p className="text-sm font-medium text-indigo-700 mb-1">Online</p>
                  <p className="text-3xl font-bold text-indigo-600 tracking-tight">
                    {formatCurrency(data.ONLINE || 0)}
                  </p>
                </div>

                <div className="rounded-xl border border-amber-100 bg-amber-50/20 p-6">
                  <p className="text-sm font-medium text-amber-700 mb-1">
                    Donation
                  </p>
                  <p className="text-3xl font-bold text-amber-600 tracking-tight">
                    {formatCurrency(data.DONATION || 0)}
                  </p>
                </div>

                <div className="rounded-xl border border-green-100 bg-green-50/20 p-6">
                  <p className="text-sm font-medium text-green-700 mb-1">
                    Credit
                  </p>
                  <p className="text-3xl font-bold text-green-600 tracking-tight">
                    {formatCurrency(data.CREDIT || 0)}
                  </p>
                </div>

                <div className="rounded-xl border border-gray-200 bg-gray-50/60 p-6 sm:col-span-2 lg:col-span-1">
                  <p className="text-sm font-medium text-gray-700 mb-1">
                    Grand Total (net)
                  </p>
                  <p className="text-3xl font-bold text-gray-900 tracking-tight">
                    {formatCurrency(data.grandTotal || 0)}
                  </p>
                  <p className="text-xs text-gray-500 mt-2">
                    Net after refunds for selected period.
                  </p>
                </div>
              </motion.div>
            ) : (
              <div className="py-20 text-center">
                <p className="text-gray-500 font-medium">
                  No sales data available for this period.
                </p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

