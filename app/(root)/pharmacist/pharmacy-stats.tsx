"use client";

import { Package, TrendingDown, AlertTriangle, BarChart3 } from "lucide-react";
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

interface StatCardProps {
  title: string;
  value: string | number;
  change: { value: number; trend: "up" | "down" };
  changeLabel?: string;
  icon: React.ElementType;
  accent: "red" | "amber" | "emerald";
}

const accentStyles = {
  red: {
    iconBg: "bg-red-100",
    icon: "text-red-600",
    value: "text-red-800",
    border: "border-l-red-500",
    badge: "bg-red-50 text-red-700",
    chart: "#dc2626",
    chartFill: "#fecaca",
  },
  amber: {
    iconBg: "bg-amber-100",
    icon: "text-amber-600",
    value: "text-red-800",
    border: "border-l-amber-500",
    badge: "bg-amber-50 text-amber-800",
    chart: "#d97706",
    chartFill: "#fde68a",
  },
  emerald: {
    iconBg: "bg-emerald-100",
    icon: "text-emerald-600",
    value: "text-red-800",
    border: "border-l-emerald-500",
    badge: "bg-emerald-50 text-emerald-700",
    chart: "#059669",
    chartFill: "#a7f3d0",
  },
};

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

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35, delay: index * 0.06 }}
    >
      <Card
        className={`overflow-hidden border-l-4 ${style.border} bg-white border border-gray-100 shadow-sm hover:shadow-md hover:border-gray-200 transition-all duration-300 rounded-xl`}
      >
        <div className="p-5 flex flex-col h-full min-h-[120px]">
          <div className="flex items-start justify-between gap-3">
            <div className={`p-2.5 rounded-xl ${style.iconBg}`}>
              <Icon className={`h-5 w-5 ${style.icon}`} />
            </div>
            <div className="flex-1 min-w-0 text-right">
              <p className="text-xs font-medium text-gray-500 uppercase tracking-wider mb-0.5">
                {title}
              </p>
              <h3
                className={`text-2xl font-bold tabular-nums ${style.value}`}
              >
                {typeof value === "number" ? value.toLocaleString() : value}
              </h3>
            </div>
          </div>
          <div className="mt-4 flex items-center justify-between gap-2">
            <div className="w-24 h-10 flex-shrink-0">
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
                      <stop offset="0%" stopColor={style.chart} stopOpacity={0.35} />
                      <stop offset="100%" stopColor={style.chartFill} stopOpacity={0.08} />
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
            <div className="flex items-center gap-1.5 flex-shrink-0">
              <span
                className={`inline-flex items-center px-2 py-0.5 rounded-md text-xs font-medium ${style.badge}`}
              >
                {change.trend === "up" ? "↑" : "↓"} {Math.abs(change.value)}%
              </span>
              <span className="text-[11px] text-gray-400 hidden sm:inline">
                {changeLabel}
              </span>
            </div>
          </div>
        </div>
      </Card>
    </motion.div>
  );
};

function formatCurrency(amount: number) {
  return new Intl.NumberFormat("en-PK", {
    style: "currency",
    currency: "PKR",
    maximumFractionDigits: 0,
  }).format(amount);
}

export default function PharmacyStats({
  items,
  lowStockCount,
  expiringCount,
  earnedThisMonth = 0,
  earnedLastMonth = 0,
}: {
  items: any[];
  lowStockCount: number;
  expiringCount: number;
  earnedThisMonth?: number;
  earnedLastMonth?: number;
}) {
  const earnedChange =
    earnedLastMonth > 0
      ? ((earnedThisMonth - earnedLastMonth) / earnedLastMonth) * 100
      : 0;
  const earnedTrend: "up" | "down" = earnedChange >= 0 ? "up" : "down";

  const stats: (StatCardProps & { index: number })[] = [
    {
      index: 0,
      title: "Total Items",
      value: items.length,
      change: { value: 4.63, trend: "up" },
      icon: Package,
      accent: "red",
    },
    {
      index: 1,
      title: "Low Stock",
      value: lowStockCount,
      change: { value: 2.34, trend: "down" },
      icon: TrendingDown,
      accent: "red",
    },
    {
      index: 2,
      title: "Expiring Soon",
      value: expiringCount,
      change: { value: 4.63, trend: "up" },
      icon: AlertTriangle,
      accent: "amber",
    },
    {
      index: 3,
      title: "Earned This Month",
      value: formatCurrency(earnedThisMonth),
      change: {
        value: Math.abs(Number(earnedChange.toFixed(1))),
        trend: earnedTrend,
      },
      changeLabel: "vs. last month",
      icon: BarChart3,
      accent: "emerald",
    },
  ];

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-5 mb-8">
      {stats.map((stat) => (
        <StatCard key={stat.title} {...stat} />
      ))}
    </div>
  );
}
