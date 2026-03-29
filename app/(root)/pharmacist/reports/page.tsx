"use client";

import { useAuth } from "@/app/providers/AuthProvider";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { motion } from "framer-motion";
import {
  Calendar,
  Package,
  TrendingUp,
  AlertTriangle,
  LayoutGrid,
  Wallet,
  Building2,
} from "lucide-react";
import Link from "next/link";

const reportCards = [
  // {
  //   title: "Daily & Monthly Sale Reports",
  //   description: "View sales by day, week, month, or year with charts.",
  //   href: "/pharmacist/sales-history",
  //   icon: BarChart3,
  //   color: "text-green-600",
  //   bg: "bg-green-50",
  // },
  {
    title: "Profit & Loss Report",
    description: "Revenue, cost, and profit for a selected period.",
    href: "/pharmacist/reports/profit-loss",
    icon: TrendingUp,
    color: "text-blue-600",
    bg: "bg-blue-50",
  },
  {
    title: "Stock Report",
    description: "Stock levels and value using list purchase, manufacturer %, and special company % for net cost.",
    href: "/pharmacist/reports/stock",
    icon: Package,
    color: "text-amber-600",
    bg: "bg-amber-50",
  },
  {
    title: "Expiry Report",
    description: "Items expiring within the next 30, 60, or 90 days.",
    href: "/pharmacist/reports/expiry",
    icon: Calendar,
    color: "text-orange-600",
    bg: "bg-orange-50",
  },
  {
    title: "Fast / Slow Moving Items",
    description: "Items sold most and least over the selected period.",
    href: "/pharmacist/reports/fast-slow-moving",
    icon: LayoutGrid,
    color: "text-purple-600",
    bg: "bg-purple-50",
  },
  {
    title: "Integrated Expiry & Low Stock",
    description: "Combined view of low stock and soon-to-expire items.",
    href: "/pharmacist/reports/integrated",
    icon: AlertTriangle,
    color: "text-red-600",
    bg: "bg-red-50",
  },
  {
    title: "Cash / Card / Online Totals",
    description: "Total sales by payment method (daily / monthly / yearly).",
    href: "/pharmacist/reports/payment-method-totals",
    icon: Wallet,
    color: "text-indigo-600",
    bg: "bg-indigo-50",
  },
  {
    title: "Manufacturer Ledger",
    description: "Detailed transaction history and balance for any manufacturer.",
    href: "/pharmacist/reports/manufacturer-ledger",
    icon: Building2,
    color: "text-rose-600",
    bg: "bg-rose-50",
  },
];

export default function ReportsPage() {
  const { user } = useAuth();

  if (!user) return null;

  return (
    <div className="min-h-screen bg-gray-50/80">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
        <header className="mb-8">
          <motion.h1
            className="text-2xl sm:text-3xl font-bold text-red-800 tracking-tight"
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4 }}
          >
            Reports & Accounts
          </motion.h1>
          <motion.p
            className="mt-1 text-sm sm:text-base text-gray-500"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.4, delay: 0.1 }}
          >
            Generate and view daily, monthly, stock, expiry, and P&L reports.
          </motion.p>
          <div className="mt-4 h-px bg-gradient-to-r from-red-200/80 via-red-100/50 to-transparent rounded-full" />
        </header>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {reportCards.map((report, i) => {
            const Icon = report.icon;
            return (
              <motion.div
                key={report.href}
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4, delay: 0.1 + i * 0.05 }}
              >
                <Link href={report.href} className="block h-full group">
                  <Card className="h-full transition-all duration-300 hover:shadow-md hover:border-red-200 border border-gray-100 overflow-hidden bg-white group-hover:-translate-y-1">
                    <CardHeader className="pb-2">
                      <div
                        className={`inline-flex p-3 rounded-xl ${report.bg} ${report.color} w-fit mb-3 transition-transform duration-300 group-hover:scale-110`}
                      >
                        <Icon className="h-6 w-6" />
                      </div>
                      <CardTitle className="text-lg group-hover:text-red-700 transition-colors">
                        {report.title}
                      </CardTitle>
                      <CardDescription className="text-sm leading-relaxed mt-1">
                        {report.description}
                      </CardDescription>
                    </CardHeader>
                    <CardContent className="pt-4 flex items-center text-sm font-semibold text-red-700 group-hover:gap-2 transition-all">
                      <span>View report</span>
                      <span className="ml-1 transition-transform group-hover:translate-x-1">→</span>
                    </CardContent>
                  </Card>
                </Link>
              </motion.div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
