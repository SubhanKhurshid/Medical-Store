import { Package, TrendingDown, AlertTriangle, BarChart } from 'lucide-react'
import { Card } from "@/components/ui/card"
import { Area, AreaChart, ResponsiveContainer } from "recharts"
import type React from "react"

const generateSparklineData = (points: number, trend: "up" | "down") => {
  return Array.from({ length: points }, (_, i) => ({
    value: trend === "up"
      ? 50 + Math.sin(i / 2) * 30 + (i / points) * 40
      : 90 - Math.sin(i / 2) * 30 - (i / points) * 40
  }))
}

interface StatCardProps {
  title: string
  value: string | number
  change: {
    value: number
    trend: "up" | "down"
  }
  icon: React.ElementType
  color: {
    light: string
    medium: string
    dark: string
  }
}

const StatCard = ({ title, value, change, icon: Icon, color }: StatCardProps) => {
  const sparklineData = generateSparklineData(20, change.trend)

  return (
    <Card className="overflow-hidden bg-white border-0 shadow-sm hover:shadow-md transition-all duration-300 mb-6">
      <div className="p-6 flex flex-col h-full">
        <div className="flex items-center justify-between mb-4">
          <div className={`p-2 rounded-lg`} style={{ backgroundColor: `${color.light}30` }}>
            <Icon className="h-5 w-5" style={{ color: color.dark }} />
          </div>
          <div className="text-right">
            <p className="text-sm font-medium text-gray-500 mb-1">{title}</p>
            <h3 className="text-2xl font-bold" style={{ color: color.dark }}>
              {typeof value === "number" ? value.toLocaleString() : value}
            </h3>
          </div>
        </div>

        <div className="flex items-center justify-between">
          <div className="w-28 h-12">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={sparklineData}>
                <defs>
                  <linearGradient id={`gradient-${title}`} x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor={color.medium} stopOpacity={0.4} />
                    <stop offset="100%" stopColor={color.medium} stopOpacity={0.1} />
                  </linearGradient>
                </defs>
                <Area
                  type="monotone"
                  dataKey="value"
                  stroke={color.medium}
                  fill={`url(#gradient-${title})`}
                  strokeWidth={2}
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
          <div className="flex items-center gap-2">
            <span
              className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium`}
              style={{
                backgroundColor: change.trend === "up" ? "#dcfce7" : "#fee2e2",
                color: change.trend === "up" ? "#16a34a" : "#dc2626",
              }}
            >
              {change.trend === "up" ? "↑" : "↓"} {Math.abs(change.value)}%
            </span>
            <span className="text-xs text-gray-500">vs. last week</span>
          </div>
        </div>
      </div>
    </Card>
  )
}

export default function PharmacyStats({
  items,
  lowStockCount,
  expiringCount,
}: {
  items: any[]
  lowStockCount: number
  expiringCount: number
}) {
  const stats: {
    title: string
    value: string | number
    change: { value: number; trend: "up" | "down" }
    icon: React.ElementType
    color: { light: string; medium: string; dark: string }
  }[] = [
    {
      title: "Total Items",
      value: items.length,
      change: { value: 4.63, trend: "up" },
      icon: Package,
      color: {
        light: "#e0f2fe",
        medium: "#38bdf8",
        dark: "#0284c7",
      },
    },
    {
      title: "Low Stock",
      value: lowStockCount,
      change: { value: 2.34, trend: "down" },
      icon: TrendingDown,
      color: {
        light: "#fee2e2",
        medium: "#f87171",
        dark: "#dc2626",
      },
    },
    {
      title: "Expiring Soon",
      value: expiringCount,
      change: { value: 4.63, trend: "up" },
      icon: AlertTriangle,
      color: {
        light: "#fef3c7",
        medium: "#fbbf24",
        dark: "#d97706",
      },
    },
    {
      title: "Earned This Month",
      value: "RS12,345",
      change: { value: 1.34, trend: "up" },
      icon: BarChart,
      color: {
        light: "#dcfce7",
        medium: "#4ade80",
        dark: "#16a34a",
      },
    },
  ]

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
      {stats.map((stat, index) => (
        <StatCard key={index} {...stat} />
      ))}
    </div>
  )
}
