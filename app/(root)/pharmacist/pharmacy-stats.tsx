"use client";

import {
  Package,
  TrendingDown,
  AlertTriangle,
  TrendingUp,
  Wallet,
} from "lucide-react";
import { Card } from "@/components/ui/card";
import { motion } from "framer-motion";
import { Area, AreaChart, ResponsiveContainer } from "recharts";
import type React from "react";

const generateSparklineData = (points: number, trend: "up" | "down") =>
  Array.from({ length: points }, (_, i) => ({
    value:
      trend === "up"
        ? 50 + Math.sin(i / 2) * 30 + (i / points) * 40
        : 90 - Math.sin(i / 2) * 30 - (i / points) * 40,
  }));

type Accent = "red" | "amber" | "sky" | "emerald";

interface StatCardProps {
  title: string;
  value: string | number;
  change: { value: number; trend: "up" | "down" };
  changeLabel?: string;
  icon: React.ElementType;
  accent: Accent;
}

const accentStyles: Record<
  Accent,
  {
    iconBg: string;
    icon: string;
    value: string;
    border: string;
    badge: string;
    badgeDown: string;
    chart: string;
    chartFill: string;
  }
> = {
  red: {
    iconBg: "bg-red-100",
    icon: "text-red-600",
    value: "text-red-800",
    border: "border-l-red-500",
    badge: "bg-red-50 text-red-700",
    badgeDown: "bg-red-50 text-red-700",
    chart: "#dc2626",
    chartFill: "#fecaca",
  },
  amber: {
    iconBg: "bg-amber-100",
    icon: "text-amber-600",
    value: "text-amber-900",
    border: "border-l-amber-500",
    badge: "bg-amber-50 text-amber-800",
    badgeDown: "bg-amber-50 text-amber-800",
    chart: "#d97706",
    chartFill: "#fde68a",
  },
  sky: {
    iconBg: "bg-sky-100",
    icon: "text-sky-600",
    value: "text-sky-900",
    border: "border-l-sky-500",
    badge: "bg-sky-50 text-sky-700",
    badgeDown: "bg-red-50 text-red-700",
    chart: "#0284c7",
    chartFill: "#bae6fd",
  },
  emerald: {
    iconBg: "bg-emerald-100",
    icon: "text-emerald-600",
    value: "text-emerald-900",
    border: "border-l-emerald-500",
    badge: "bg-emerald-50 text-emerald-700",
    badgeDown: "bg-red-50 text-red-700",
    chart: "#059669",
    chartFill: "#a7f3d0",
  },
};

function formatCurrency(amount: number) {
  return new Intl.NumberFormat("en-PK", {
    style: "currency",
    currency: "PKR",
    maximumFractionDigits: 0,
  }).format(amount);
}

function pctChange(current: number, previous: number) {
  if (previous > 0) {
    return ((current - previous) / previous) * 100;
  }
  if (current > 0) return 100;
  return 0;
}

const StatCard = ({
  title,
  value,
  change,
  changeLabel = "vs. last week",
  icon: Icon,
  accent,
  index,
}: StatCardProps & { index: number }) => {
  const style = accentStyles[accent];
  const sparklineData = generateSparklineData(20, change.trend);
  const badgeClass =
    change.trend === "up" ? style.badge : style.badgeDown;

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35, delay: index * 0.06 }}
      className="h-full"
    >
      <Card
        className={`h-full overflow-hidden border-l-4 ${style.border} bg-white border border-gray-100 shadow-sm hover:shadow-md hover:border-gray-200 transition-all duration-300 rounded-xl`}
      >
        <div className="p-5 flex flex-col h-full min-h-[128px]">
          <div className="flex items-start justify-between gap-3">
            <div className={`p-2.5 rounded-xl shrink-0 ${style.iconBg}`}>
              <Icon className={`h-5 w-5 ${style.icon}`} />
            </div>
            <div className="flex-1 min-w-0 text-right">
              <p className="text-[11px] font-medium text-gray-500 uppercase tracking-wider leading-tight">
                {title}
              </p>
              <h3
                className={`text-2xl font-bold tabular-nums leading-tight mt-0.5 ${style.value}`}
              >
                {typeof value === "number" ? value.toLocaleString() : value}
              </h3>
            </div>
          </div>
          <div className="mt-auto pt-4 flex items-end justify-between gap-2">
            <div className="w-20 h-9 shrink-0">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={sparklineData}>
                  <defs>
                    <linearGradient
                      id={`grad-${title.replace(/\s/g, "-")}-${index}`}
                      x1="0"
                      y1="0"
                      x2="0"
                      y2="1"
                    >
                      <stop offset="0%" stopColor={style.chart} stopOpacity={0.3} />
                      <stop offset="100%" stopColor={style.chartFill} stopOpacity={0.05} />
                    </linearGradient>
                  </defs>
                  <Area
                    type="monotone"
                    dataKey="value"
                    stroke={style.chart}
                    fill={`url(#grad-${title.replace(/\s/g, "-")}-${index})`}
                    strokeWidth={1.5}
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
            <div className="flex flex-col items-end gap-0.5 min-w-0">
              <span
                className={`inline-flex items-center px-2 py-0.5 rounded-md text-xs font-medium whitespace-nowrap ${badgeClass}`}
              >
                {change.trend === "up" ? "↑" : "↓"}{" "}
                {Math.abs(change.value).toFixed(1)}%
              </span>
              <span className="text-[10px] text-gray-400 text-right leading-tight">
                {changeLabel}
              </span>
            </div>
          </div>
        </div>
      </Card>
    </motion.div>
  );
};

interface ProfitCardProps {
  variant: "gross" | "net";
  amount: number;
  lastMonth: number;
  expensesThisMonth?: number;
  index: number;
}

function ProfitCard({
  variant,
  amount,
  lastMonth,
  expensesThisMonth = 0,
  index,
}: ProfitCardProps) {
  const isGross = variant === "gross";
  const accent: Accent = isGross ? "sky" : "emerald";
  const style = accentStyles[accent];
  const change = pctChange(amount, lastMonth);
  const trend: "up" | "down" = change >= 0 ? "up" : "down";
  const sparklineData = generateSparklineData(24, trend);
  const badgeClass = trend === "up" ? style.badge : style.badgeDown;
  const Icon = isGross ? TrendingUp : Wallet;
  const gradId = `profit-${variant}-${index}`;

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35, delay: 0.2 + index * 0.06 }}
      className="h-full"
    >
      <Card
        className={`h-full overflow-hidden border-l-4 ${style.border} bg-gradient-to-br from-white to-gray-50/80 border border-gray-100 shadow-sm hover:shadow-md transition-all duration-300 rounded-xl`}
      >
        <div className="p-5 sm:p-6 flex flex-col sm:flex-row sm:items-center gap-4 sm:gap-6">
          <div className="flex items-start gap-4 flex-1 min-w-0">
            <div className={`p-3 rounded-2xl shrink-0 ${style.iconBg}`}>
              <Icon className={`h-6 w-6 ${style.icon}`} />
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider">
                {isGross ? "Gross profit" : "Net profit"}
              </p>
              <p className="text-[11px] text-gray-400 mt-0.5">
                {isGross
                  ? "Sales revenue − cost of goods (this month)"
                  : "Gross profit − personal expenses (this month)"}
              </p>
              <p className={`text-3xl font-bold tabular-nums mt-2 ${style.value}`}>
                {formatCurrency(amount)}
              </p>
              {!isGross && expensesThisMonth > 0 && (
                <p className="text-xs text-gray-500 mt-1.5">
                  Includes{" "}
                  <span className="font-medium text-rose-700">
                    {formatCurrency(expensesThisMonth)}
                  </span>{" "}
                  personal expenses
                </p>
              )}
              {!isGross && expensesThisMonth === 0 && (
                <p className="text-xs text-gray-400 mt-1.5">
                  No personal expenses recorded this month
                </p>
              )}
            </div>
          </div>

          <div className="flex sm:flex-col items-center sm:items-end justify-between sm:justify-center gap-3 sm:gap-2 sm:min-w-[140px] border-t sm:border-t-0 sm:border-l border-gray-100 pt-3 sm:pt-0 sm:pl-6">
            <div className="w-full sm:w-28 h-10">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={sparklineData}>
                  <defs>
                    <linearGradient id={gradId} x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor={style.chart} stopOpacity={0.3} />
                      <stop offset="100%" stopColor={style.chartFill} stopOpacity={0.05} />
                    </linearGradient>
                  </defs>
                  <Area
                    type="monotone"
                    dataKey="value"
                    stroke={style.chart}
                    fill={`url(#${gradId})`}
                    strokeWidth={1.5}
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
            <div className="text-right">
              <span
                className={`inline-flex items-center px-2.5 py-1 rounded-md text-xs font-semibold whitespace-nowrap ${badgeClass}`}
              >
                {trend === "up" ? "↑" : "↓"} {Math.abs(change).toFixed(1)}%
              </span>
              <p className="text-[10px] text-gray-400 mt-1">vs. last month</p>
            </div>
          </div>
        </div>
      </Card>
    </motion.div>
  );
}

export default function PharmacyStats({
  totalItems,
  lowStockCount,
  expiringCount,
  grossProfitThisMonth = 0,
  grossProfitLastMonth = 0,
  netProfitThisMonth = 0,
  netProfitLastMonth = 0,
  personalExpensesThisMonth = 0,
}: {
  totalItems: number;
  lowStockCount: number;
  expiringCount: number;
  grossProfitThisMonth?: number;
  grossProfitLastMonth?: number;
  netProfitThisMonth?: number;
  netProfitLastMonth?: number;
  personalExpensesThisMonth?: number;
}) {
  const inventoryStats: (StatCardProps & { index: number })[] = [
    {
      index: 0,
      title: "Total Items",
      value: totalItems,
      change: { value: 4.63, trend: "up" },
      changeLabel: "vs. last week",
      icon: Package,
      accent: "red",
    },
    {
      index: 1,
      title: "Low Stock",
      value: lowStockCount,
      change: { value: 2.34, trend: "down" },
      changeLabel: "vs. last week",
      icon: TrendingDown,
      accent: "red",
    },
    {
      index: 2,
      title: "Expiring Soon",
      value: expiringCount,
      change: { value: 4.63, trend: "up" },
      changeLabel: "vs. last week",
      icon: AlertTriangle,
      accent: "amber",
    },
  ];

  return (
    <div className="space-y-4 sm:space-y-5 mb-8">
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-5">
        {inventoryStats.map((stat) => (
          <StatCard key={stat.title} {...stat} />
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-5">
        <ProfitCard
          variant="gross"
          amount={grossProfitThisMonth}
          lastMonth={grossProfitLastMonth}
          index={0}
        />
        <ProfitCard
          variant="net"
          amount={netProfitThisMonth}
          lastMonth={netProfitLastMonth}
          expensesThisMonth={personalExpensesThisMonth}
          index={1}
        />
      </div>
    </div>
  );
}
