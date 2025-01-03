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

interface SalesData {
  day: string;
  totalSales: number;
}

export default function SalesHistory() {
  const [tab, setTab] = useState("weekly");
  const [salesData, setSalesData] = useState<SalesData[]>([]);

  const fillMissingDays = (groupedData: any, isWeekly: boolean) => {
    if (isWeekly) {
      const days = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
      return days.map((day) => ({
        day,
        totalSales: groupedData[day] || 0,
      }));
    } else {
      const months = [
        "Jan", "Feb", "Mar", "Apr", "May", "Jun",
        "Jul", "Aug", "Sep", "Oct", "Nov", "Dec",
      ];
      return months.map((month) => ({
        day: month,
        totalSales: groupedData[month] || 0,
      }));
    }
  };

  const fetchAndFormatSalesData = async (tab: string) => {
    try {
      const salesResponse = await fetch(
        `http://localhost:3000/pharmacist/sales-graph?type=${tab}`
      );
      const salesResult = await salesResponse.json();

      const groupedSales = salesResult.reduce((acc: any, item: any) => {
        if (tab === "weekly") {
          acc[item.day] = item.totalSales;
        } else {
          const monthName = new Date(item.day).toLocaleString("default", {
            month: "short",
          });
          acc[monthName] = (acc[monthName] || 0) + item.totalSales;
        }
        return acc;
      }, {});
      return fillMissingDays(groupedSales, tab === "weekly");
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

interface SalesChartProps {
  data: SalesData[];
  period: "weekly" | "monthly";
}

function SalesChart({ data, period }: SalesChartProps) {
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
        className="w-full max-w-[90%] md:max-w-[75%] h-[300px] md:h-[400px]"
      >
        <ResponsiveContainer
          width="100%"
          height={window.innerWidth < 768 ? 200 : 400} // Adjust height for smaller screens
        >
          <LineChart
            data={data}
            margin={{
              top: window.innerWidth < 768 ? 10 : 20,
              right: 20,
              left: 10,
              bottom: window.innerWidth < 768 ? 20 : 10,
            }}
          >
            <XAxis
              dataKey="day"
              axisLine={false}
              tickLine={false}
              padding={{ left: 20, right: 20 }}
              tick={{ fontSize: window.innerWidth < 768 ? 10 : 12 }}
              interval={0}
              angle={period === "monthly" && window.innerWidth < 768 ? -30 : 0}
              textAnchor={
                period === "monthly" && window.innerWidth < 768 ? "end" : "middle"
              }
              height={window.innerWidth < 768 ? 50 : 60}
            />
            <YAxis
              axisLine={false}
              tickLine={false}
              width={window.innerWidth < 768 ? 40 : 50}
              tick={{ fontSize: window.innerWidth < 768 ? 10 : 12 }}
            />
            <ChartTooltip content={<ChartTooltipContent />} />
            <Line
              type="monotone"
              dataKey="totalSales"
              stroke="hsl(var(--primary))"
              strokeWidth={2}
              dot={false}
            />
          </LineChart>
        </ResponsiveContainer>
      </ChartContainer>
    </CardContent>
  </Card>
  
    );
}
