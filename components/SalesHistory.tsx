"use client";

import React, { useState, useEffect } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from "@/components/ui/chart";
import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
} from "recharts";

interface WeekSales {
  week: string;
  totalSales: number;
}

interface SalesData {
  month: string;
  weekSales: WeekSales[];
}

interface WeeklySalesData {
  day: string;
  totalSales: number;
}

type ChartData = SalesData[] | WeeklySalesData[];

interface SalesChartProps {
  data: ChartData;
  period: "weekly" | "monthly";
}

const isSalesData = (data: any): data is SalesData => {
  return data && typeof data.month === 'string' && Array.isArray(data.weekSales);
};

function SalesChart({ data, period }: SalesChartProps) {
  const [chartDimensions, setChartDimensions] = useState({ width: 0, height: 0 });

  useEffect(() => {
    const updateDimensions = () => {
      const width = window.innerWidth;
      const height = window.innerHeight;
      setChartDimensions({
        width: width < 768 ? width * 0.9 : width * 0.75,
        height: width < 768 ? 250 : 400,
      });
    };

    updateDimensions();
    window.addEventListener('resize', updateDimensions);

    return () => window.removeEventListener('resize', updateDimensions);
  }, []);

  const getXAxisProps = () => {
    const isSmallScreen = window.innerWidth < 768;
    return {
      dataKey: period === "weekly" ? "day" : "month",
      axisLine: false,
      tickLine: false,
      padding: { left: 20, right: 20 },
      tick: { fontSize: isSmallScreen ? 10 : 12 },
      interval: 0,
      angle: isSmallScreen ? -30 : 0,
      textAnchor: isSmallScreen ? "end" : "middle",
      height: isSmallScreen ? 50 : 60,
    };
  };

  const getYAxisProps = () => {
    const isSmallScreen = window.innerWidth < 768;
    return {
      axisLine: false,
      tickLine: false,
      width: isSmallScreen ? 40 : 50,
      tick: { fontSize: isSmallScreen ? 10 : 12 },
    };
  };

  const renderWeeklyChart = () => (
    <LineChart
      data={data as WeeklySalesData[]}
      margin={{
        top: chartDimensions.height * 0.05,
        right: chartDimensions.width * 0.05,
        left: chartDimensions.width * 0.02,
        bottom: chartDimensions.height * 0.1,
      }}
    >
      <XAxis {...getXAxisProps()} />
      <YAxis {...getYAxisProps()} />
      <ChartTooltip content={<ChartTooltipContent />} />
      <Line
        type="monotone"
        dataKey="totalSales"
        stroke="hsl(var(--primary))"
        strokeWidth={2}
        dot={false}
      />
    </LineChart>
  );

  const renderMonthlyChart = () => (
    <LineChart
      data={data.filter(isSalesData)}
      margin={{
        top: chartDimensions.height * 0.05,
        right: chartDimensions.width * 0.05,
        left: chartDimensions.width * 0.02,
        bottom: chartDimensions.height * 0.1,
      }}
    >
      <XAxis {...getXAxisProps()} />
      <YAxis {...getYAxisProps()} />
      <ChartTooltip content={<ChartTooltipContent />} />
      {['Week 1', 'Week 2', 'Week 3', 'Week 4'].map((week, index) => (
        <Line
          key={week}
          type="monotone"
          dataKey={(d: SalesData) => {
            if (!d || !Array.isArray(d.weekSales)) return 0;
            const weekData = d.weekSales[index];
            return weekData && typeof weekData.totalSales === 'number' ? weekData.totalSales : 0;
          }}
          name={week}
          stroke={`hsl(${index * 60}, 70%, 50%)`}
          strokeWidth={2}
          dot={false}
        />
      ))}
    </LineChart>
  );

  return (
    <Card className="h-full">
      <CardHeader>
        <CardTitle>
          {period === "weekly" ? "Weekly Sales" : "Monthly Sales"}
        </CardTitle>
        <CardDescription>
          Overview of sales for the past {period === "weekly" ? "week" : "year"}
        </CardDescription>
      </CardHeader>
      <CardContent className="flex flex-col justify-center items-center h-full">
        <ChartContainer
          config={{
            sales: {
              label: "Sales",
              color: "hsl(var(--primary))",
            },
          }}
          className="w-full h-full"
        >
          <ResponsiveContainer width="100%" height="100%">
            {period === "weekly" ? renderWeeklyChart() : renderMonthlyChart()}
          </ResponsiveContainer>
        </ChartContainer>
      </CardContent>
    </Card>
  );
}

export default function SalesHistory() {
  const [tab, setTab] = useState("weekly");
  const [salesData, setSalesData] = useState<ChartData>([]);

  const formatMonthlyData = (data: any[]): SalesData[] => {
    const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
    return months.map(month => {
      const monthData = data.find(item => item.month === month) || { month, weekSales: [] };
      const filledWeekSales = Array.from({ length: 4 }, (_, i) => {
        const weekNumber = i + 1;
        const existingWeek = monthData.weekSales && Array.isArray(monthData.weekSales)
          ? monthData.weekSales.find((w: WeekSales) => w.week === `Week ${weekNumber}`)
          : null;
        return existingWeek && typeof existingWeek.totalSales === 'number'
          ? existingWeek
          : { week: `Week ${weekNumber}`, totalSales: 0 };
      });
      return { month: monthData.month, weekSales: filledWeekSales };
    });
  };

  const fetchAndFormatSalesData = async (tab: string) => {
    try {
      const salesResponse = await fetch(
        `http://localhost:3000/pharmacist/sales-graph?type=${tab}`
      );
      const salesResult = await salesResponse.json();

      if (tab === "weekly") {
        const days = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
        return days.map(day => ({
          day,
          totalSales: salesResult.find((item: any) => item.day === day)?.totalSales || 0,
        }));
      } else {
        return formatMonthlyData(salesResult);
      }
    } catch (error) {
      console.error("Error fetching sales data:", error);
      return [];
    }
  };

  useEffect(() => {
    const fetchData = async () => {
      const formattedSales = await fetchAndFormatSalesData(tab);
      setSalesData(formattedSales);
    };

    fetchData();
  }, [tab]);

  return (
    <div className="flex flex-col min-h-screen">
      <div className="flex-1 p-4 md:p-8">
        <h2 className="text-2xl md:text-3xl font-bold tracking-tight mb-6">
          Sales History
        </h2>
        <Tabs
          defaultValue="weekly"
          className="h-[calc(100vh-12rem)]"
          onValueChange={setTab}
        >
          <TabsList>
            <TabsTrigger value="weekly">Weekly</TabsTrigger>
            <TabsTrigger value="monthly">Monthly</TabsTrigger>
          </TabsList>
          <TabsContent value="weekly" className="h-full">
            <SalesChart data={salesData} period="weekly" />
          </TabsContent>
          <TabsContent value="monthly" className="h-full">
            <SalesChart data={salesData} period="monthly" />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}

