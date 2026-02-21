import { useState, useEffect, useCallback } from "react";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
} from "@/components/ui/card";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { useMediaQuery } from "react-responsive";
import { motion } from "framer-motion";

type WeeklySalesData = {
  day: string;
  totalSales: number;
};

type MonthlySalesData = {
  month: string;
  weekSales: { week: string; totalSales: number }[] | undefined;
};

type DailySalesData = {
  time: string;
  totalSales: number;
};

type SalesData = WeeklySalesData | MonthlySalesData | DailySalesData;

type ChartData = (
  | WeeklySalesData
  | MonthlySalesData
  | { hour: string; totalSales: number }
  | { month: string; totalSales: number }
  | DailySalesData
)[];

interface SalesChartProps {
  data: ChartData;
  period: "daily" | "weekly" | "monthly" | "yearly";
}

const isSalesData = (data: any): data is SalesData => {
  return data && (data.day || data.month || data.time);
};

function SalesChart({ data, period }: SalesChartProps) {
  const isMobile = useMediaQuery({ maxWidth: 640 });
  const isTablet = useMediaQuery({ maxWidth: 1024 });

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-white/95 border border-gray-200 p-2 sm:p-4 rounded-lg shadow-lg backdrop-blur-sm max-w-[200px] sm:max-w-none">
          <p className="font-semibold text-gray-900 mb-1 sm:mb-2 text-xs sm:text-sm">
            {period === "daily" ? `Time: ${label}` : label}
          </p>
          {payload.map((entry: any, index: number) => (
            <p
              key={index}
              className="text-xs sm:text-sm flex items-center gap-1 sm:gap-2"
              style={{ color: entry.color }}
            >
              <span
                className="w-2 h-2 sm:w-3 sm:h-3 rounded-full"
                style={{ backgroundColor: entry.color }}
              ></span>
              {entry.name}: Rs {entry.value.toLocaleString()}
            </p>
          ))}
        </div>
      );
    }
    return null;
  };

  const getAxisConfig = () => {
    const baseFontSize = isMobile ? 10 : isTablet ? 11 : 12;
    return {
      xAxis: {
        height: isMobile ? 40 : 60,
        tick: {
          fontSize: baseFontSize,
          fill: "hsl(var(--muted-foreground))",
        },
        angle: isMobile ? -45 : 0,
        textAnchor: isMobile ? "end" : "middle",
        dy: isMobile ? 10 : 0,
      },
      yAxis: {
        width: isMobile ? 45 : 60,
        tick: {
          fontSize: baseFontSize,
          fill: "hsl(var(--muted-foreground))",
        },
      },
    };
  };

  const renderChart = () => {
    const { xAxis, yAxis } = getAxisConfig();

    const getChartData = () => {
      switch (period) {
        case "daily":
          return data as DailySalesData[];
        case "weekly":
          return data as WeeklySalesData[];
        case "monthly":
          return data.filter(isSalesData) as MonthlySalesData[];
        case "yearly":
          return data as { month: string; totalSales: number }[];
        default:
          return [];
      }
    };

    const getXAxisDataKey = () => {
      switch (period) {
        case "daily":
          return "time";
        case "weekly":
          return "day";
        case "monthly":
          return "month";
        case "yearly":
          return "month";
        default:
          return "";
      }
    };

    const chartData = getChartData();
    const hasSales = chartData.some((item: any) => item.totalSales > 0);

    if (period === "daily" && !hasSales) {
      return (
        <div className="flex items-center justify-center h-full">
          <p className="text-lg text-gray-500">
            No sales have been made today.
          </p>
        </div>
      );
    }

    return (
      <LineChart
        data={chartData}
        margin={{
          top: 20,
          right: isMobile ? 10 : 30,
          left: isMobile ? 0 : 20,
          bottom: isMobile ? 20 : 30,
        }}
      >
        <XAxis
          dataKey={getXAxisDataKey()}
          axisLine={false}
          tickLine={false}
          padding={{ left: 20, right: 20 }}
          {...xAxis}
          angle={-45}
          textAnchor="end"
          height={60}
          tickFormatter={(value) =>
            period === "daily" ? value.split(" - ")[0] : value
          }
        />
        <YAxis
          axisLine={false}
          tickLine={false}
          tickFormatter={(value) => `Rs ${value}`}
          {...yAxis}
        />
        <Tooltip content={<CustomTooltip />} />
        {period === "monthly" ? (
          ["Week 1", "Week 2", "Week 3", "Week 4"].map((week, index) => (
            <Line
              key={week}
              type="monotone"
              dataKey={(d: MonthlySalesData) => {
                if (
                  d &&
                  d.weekSales &&
                  Array.isArray(d.weekSales) &&
                  d.weekSales[index]
                ) {
                  return d.weekSales[index].totalSales;
                }
                return 0;
              }}
              name={week}
              stroke={`hsl(${index * 30 + 142}, 76%, 36%)`}
              strokeWidth={isMobile ? 2 : 3}
              dot={{
                fill: `hsl(${index * 30 + 142}, 76%, 36%)`,
                strokeWidth: isMobile ? 1 : 2,
                r: isMobile ? 3 : 4,
              }}
              activeDot={{ r: isMobile ? 6 : 8 }}
            />
          ))
        ) : (
          <Line
            type="monotone"
            dataKey="totalSales"
            stroke="#22C55E"
            strokeWidth={isMobile ? 2 : 3}
            dot={{
              fill: "#22C55E",
              strokeWidth: isMobile ? 1 : 2,
              r: isMobile ? 3 : 4,
            }}
            activeDot={{ r: isMobile ? 6 : 8, fill: "#22C55E" }}
          />
        )}
      </LineChart>
    );
  };

  return (
    <Card className="w-full h-full">
      <CardHeader className="space-y-1 sm:space-y-2 p-4 sm:p-6">
        <CardTitle className="text-lg sm:text-2xl font-bold">
          {period === "weekly"
            ? "Weekly Sales"
            : period === "monthly"
            ? "Monthly Sales"
            : period === "daily"
            ? "Daily Sales"
            : "Yearly Sales"}
        </CardTitle>
        <CardDescription className="text-sm sm:text-base">
          Overview of sales for the past{" "}
          {period === "weekly"
            ? "week"
            : period === "monthly"
            ? "year"
            : period === "daily"
            ? "day"
            : "year"}
        </CardDescription>
      </CardHeader>
      <CardContent className="h-[250px] sm:h-[300px] md:h-[400px] p-2 sm:p-4 md:p-6">
        <ResponsiveContainer width="100%" height="100%">
          {renderChart()}
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
}

export default function SalesHistory() {
  const [tab, setTab] = useState("weekly");
  const [salesData, setSalesData] = useState<ChartData>([]);

  const formatMonthlyData = (data: any[]): MonthlySalesData[] => {
    const months = [
      "Jan",
      "Feb",
      "Mar",
      "Apr",
      "May",
      "Jun",
      "Jul",
      "Aug",
      "Sep",
      "Oct",
      "Nov",
      "Dec",
    ];
    return months.map((month) => {
      const monthData = data.find((item) => item.month === month) || {
        month,
        weekSales: [],
      };
      const filledWeekSales = Array.from({ length: 4 }, (_, i) => {
        const weekNumber = i + 1;
        const existingWeek =
          monthData.weekSales && Array.isArray(monthData.weekSales)
            ? monthData.weekSales.find(
                (w: { week: string; totalSales: number }) =>
                  w.week === `Week ${weekNumber}`
              )
            : null;
        return existingWeek && typeof existingWeek.totalSales === "number"
          ? existingWeek
          : { week: `Week ${weekNumber}`, totalSales: 0 };
      });
      return { month: monthData.month, weekSales: filledWeekSales };
    });
  };

  const fetchAndFormatSalesData = async (tab: string) => {
    try {
      const salesResponse = await fetch(
        `${process.env.NEXT_PUBLIC_API_BASE_URL}/pharmacist/sales-graph?type=${tab}`
      );
      const salesResult = await salesResponse.json();

      switch (tab) {
        case "daily":
          // Group the data into 6-hour intervals with 12-hour format
          const intervals = [
            { range: "12:00AM - 5:59AM", start: 0, end: 6 },
            { range: "6:00AM - 11:59AM", start: 6, end: 12 },
            { range: "12:00PM - 5:59PM", start: 12, end: 18 },
            { range: "6:00PM - 11:59PM", start: 18, end: 24 },
          ];
          return intervals.map((interval) => {
            const salesInInterval = salesResult.filter((item: any) => {
              const [hours] = item.time.split(":");
              const hour = Number.parseInt(hours, 10);
              return hour >= interval.start && hour < interval.end;
            });
            const totalSales = salesInInterval.reduce(
              (sum: number, item: any) => sum + item.totalSales,
              0
            );
            return { time: interval.range, totalSales };
          });
        case "weekly":
          const days = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
          return days.map((day) => ({
            day,
            totalSales:
              salesResult.find((item: any) => item.day === day)?.totalSales ||
              0,
          }));
        case "monthly":
          return formatMonthlyData(salesResult);
        case "yearly":
          return salesResult.map((item: any) => ({
            month: item.month,
            totalSales: item.totalSales || 0,
          }));
        default:
          return [];
      }
    } catch (error) {
      console.error("Error fetching sales data:", error);
      return [];
    }
  };

  const calculateTotalSales = () => {
    if (!salesData || salesData.length === 0) return 0;

    switch (tab) {
      case "daily":
      case "weekly":
      case "yearly":
        return salesData.reduce(
          (total, item: any) => total + (item.totalSales || 0),
          0
        );
      case "monthly":
        return (salesData as MonthlySalesData[]).reduce((total, month) => {
          const monthTotal =
            month.weekSales?.reduce(
              (weekTotal, week) => weekTotal + (week.totalSales || 0),
              0
            ) || 0;
          return total + monthTotal;
        }, 0);
      default:
        return 0;
    }
  };

  const fetchData = useCallback(async () => {
    const formattedSales = await fetchAndFormatSalesData(tab);
    setSalesData(formattedSales);
  }, [tab]); // Only re-run when `tab` changes

  useEffect(() => {
    fetchData();
  }, [fetchData]); // Only depends on fetchData, no infinite loop
  const totalSales = calculateTotalSales();

  return (
    <div className="flex flex-col h-full bg-background">
      <div className="flex-1 p-2 sm:p-4 md:p-8">
        <div className="flex flex-col gap-2 mb-10">
          <motion.h1
            className="text-3xl md:text-4xl font-bold text-red-800"
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
          >
            Sales History
          </motion.h1>
          <motion.p className="text-xl text-gray-500">
            Your sales stats are shown in graph below
          </motion.p>
        </div>
        <Tabs
          defaultValue="weekly"
          className="space-y-2 sm:space-y-4"
          onValueChange={setTab}
        >
          <TabsList className="grid w-full grid-cols-4 max-w-[400px] sm:max-w-[600px]">
            <TabsTrigger value="daily" className="text-xs sm:text-sm">
              Daily
            </TabsTrigger>
            <TabsTrigger value="weekly" className="text-xs sm:text-sm">
              Weekly
            </TabsTrigger>
            <TabsTrigger value="monthly" className="text-xs sm:text-sm">
              Monthly
            </TabsTrigger>
            <TabsTrigger value="yearly" className="text-xs sm:text-sm">
              Yearly
            </TabsTrigger>
          </TabsList>
          <TabsContent value="daily" className="mt-0">
            <SalesChart data={salesData} period="daily" />
          </TabsContent>
          <TabsContent value="weekly" className="mt-0">
            <SalesChart data={salesData} period="weekly" />
          </TabsContent>
          <TabsContent value="monthly" className="mt-0">
            <SalesChart data={salesData} period="monthly" />
          </TabsContent>
          <TabsContent value="yearly" className="mt-0">
            <SalesChart data={salesData} period="yearly" />
          </TabsContent>
        </Tabs>
        <div className="mt-4 sm:mt-6 text-center">
          {tab === "daily" && totalSales === 0 ? (
            <p className="text-sm sm:text-base text-gray-500">
              No sales have been made today.
            </p>
          ) : (
            <p className="text-sm sm:text-base font-semibold">
              Total {tab.charAt(0).toUpperCase() + tab.slice(1)} Sales: Rs{" "}
              {totalSales.toLocaleString()}
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
