"use client";

import { useAuth } from "@/app/providers/AuthProvider";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { motion } from "framer-motion";
import {
  BarChart3,
  Calendar,
  Package,
  TrendingUp,
  AlertTriangle,
  LayoutGrid,
} from "lucide-react";
import Link from "next/link";

const reportCards = [
  {
    title: "Daily & Monthly Sale Reports",
    description: "View sales by day, week, month, or year with charts.",
    href: "/pharmacist/sales-history",
    icon: BarChart3,
    color: "text-green-600",
    bg: "bg-green-50",
  },
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
    description: "Current stock levels and value (cost & selling).",
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
];

export default function ReportsPage() {
  const { user } = useAuth();

  if (!user) return null;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="p-6 md:p-8 max-w-6xl mx-auto min-h-screen bg-gray-50"
    >
      <div className="mb-8">
        <h1 className="text-3xl md:text-4xl font-bold text-red-800">
          Reports & Accounts
        </h1>
        <p className="text-xl text-gray-500 mt-2">
          Generate and view daily, monthly, stock, expiry, and P&L reports.
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        {reportCards.map((report, i) => {
          const Icon = report.icon;
          return (
            <Link key={report.href} href={report.href}>
              <Card className="h-full transition-shadow hover:shadow-lg cursor-pointer border border-gray-200">
                <CardHeader className="pb-2">
                  <div
                    className={`inline-flex p-3 rounded-lg ${report.bg} ${report.color} w-fit mb-2`}
                  >
                    <Icon className="h-6 w-6" />
                  </div>
                  <CardTitle className="text-lg">{report.title}</CardTitle>
                  <CardDescription className="text-sm">
                    {report.description}
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <span className="text-sm font-medium text-red-700 hover:underline">
                    View report →
                  </span>
                </CardContent>
              </Card>
            </Link>
          );
        })}
      </div>
    </motion.div>
  );
}
