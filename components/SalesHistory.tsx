import { useState, useEffect } from 'react';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { useMediaQuery } from 'react-responsive';

type WeeklySalesData = {
  day: string;
  totalSales: number;
};

type MonthlySalesData = {
  month: string;
  weekSales: { week: string; totalSales: number }[] | undefined;
};

type SalesData = WeeklySalesData | MonthlySalesData;

type ChartData = (WeeklySalesData | MonthlySalesData)[];

interface SalesChartProps {
  data: ChartData;
  period: "weekly" | "monthly";
}

const isSalesData = (data: any): data is SalesData => {
  return data && (data.day || data.month);
};

function SalesChart({ data, period }: SalesChartProps) {
  const isMobile = useMediaQuery({ maxWidth: 640 });
  const isTablet = useMediaQuery({ maxWidth: 1024 });

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-white/95 border border-gray-200 p-2 sm:p-4 rounded-lg shadow-lg backdrop-blur-sm max-w-[200px] sm:max-w-none">
          <p className="font-semibold text-gray-900 mb-1 sm:mb-2 text-xs sm:text-sm">{label}</p>
          {payload.map((entry: any, index: number) => (
            <p
              key={index}
              className="text-xs sm:text-sm flex items-center gap-1 sm:gap-2"
              style={{ color: entry.color }}
            >
              <span className="w-2 h-2 sm:w-3 sm:h-3 rounded-full" style={{ backgroundColor: entry.color }}></span>
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
          fill: 'hsl(var(--muted-foreground))',
        },
        angle: isMobile ? -45 : 0,
        textAnchor: isMobile ? 'end' : 'middle',
        dy: isMobile ? 10 : 0,
      },
      yAxis: {
        width: isMobile ? 45 : 60,
        tick: {
          fontSize: baseFontSize,
          fill: 'hsl(var(--muted-foreground))',
        },
      },
    };
  };

  const renderWeeklyChart = () => {
    const { xAxis, yAxis } = getAxisConfig();
    return (
      <LineChart
        data={data as WeeklySalesData[]}
        margin={{
          top: 20,
          right: isMobile ? 10 : 30,
          left: isMobile ? 0 : 20,
          bottom: isMobile ? 20 : 30,
        }}
      >
        <XAxis
          dataKey="day"
          axisLine={false}
          tickLine={false}
          padding={{ left: 20, right: 20 }}
          {...xAxis}
        />
        <YAxis
          axisLine={false}
          tickLine={false}
          tickFormatter={(value) => `Rs ${value}`}
          {...yAxis}
        />
        <Tooltip content={<CustomTooltip />} />
        <Line
          type="monotone"
          dataKey="totalSales"
          stroke="#22C55E"
          strokeWidth={isMobile ? 2 : 3}
          dot={{ fill: "#22C55E", strokeWidth: isMobile ? 1 : 2, r: isMobile ? 3 : 4 }}
          activeDot={{ r: isMobile ? 6 : 8, fill: "#22C55E" }}
        />
      </LineChart>
    );
  };

  const renderMonthlyChart = () => {
    const { xAxis, yAxis } = getAxisConfig();
    return (
      <LineChart
        data={data.filter(isSalesData) as MonthlySalesData[]}
        margin={{
          top: 20,
          right: isMobile ? 10 : 30,
          left: isMobile ? 0 : 20,
          bottom: isMobile ? 20 : 30,
        }}
      >
        <XAxis
          dataKey="month"
          axisLine={false}
          tickLine={false}
          padding={{ left: 20, right: 20 }}
          {...xAxis}
        />
        <YAxis
          axisLine={false}
          tickLine={false}
          tickFormatter={(value) => `Rs ${value}`}
          {...yAxis}
        />
        <Tooltip content={<CustomTooltip />} />
        {['Week 1', 'Week 2', 'Week 3', 'Week 4'].map((week, index) => (
          <Line
            key={week}
            type="monotone"
            dataKey={(d: MonthlySalesData) => {
              if (d && d.weekSales && Array.isArray(d.weekSales) && d.weekSales[index]) {
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
              r: isMobile ? 3 : 4
            }}
            activeDot={{ r: isMobile ? 6 : 8 }}
          />
        ))}
      </LineChart>
    );
  };

  return (
    <Card className="w-full h-full">
      <CardHeader className="space-y-1 sm:space-y-2 p-4 sm:p-6">
        <CardTitle className="text-lg sm:text-2xl font-bold">
          {period === "weekly" ? "Weekly Sales" : "Monthly Sales"}
        </CardTitle>
        <CardDescription className="text-sm sm:text-base">
          Overview of sales for the past {period === "weekly" ? "week" : "year"}
        </CardDescription>
      </CardHeader>
      <CardContent className="h-[250px] sm:h-[300px] md:h-[400px] p-2 sm:p-4 md:p-6">
        <ResponsiveContainer width="100%" height="100%">
          {period === "weekly" ? renderWeeklyChart() : renderMonthlyChart()}
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
}

export default function SalesHistory() {
  const [tab, setTab] = useState("weekly");
  const [salesData, setSalesData] = useState<ChartData>([]);

  const formatMonthlyData = (data: any[]): MonthlySalesData[] => {
    const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
    return months.map(month => {
      const monthData = data.find(item => item.month === month) || { month, weekSales: [] };
      const filledWeekSales = Array.from({ length: 4 }, (_, i) => {
        const weekNumber = i + 1;
        const existingWeek = monthData.weekSales && Array.isArray(monthData.weekSales)
          ? monthData.weekSales.find((w: { week: string; totalSales: number }) => w.week === `Week ${weekNumber}`)
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
    <div className="flex flex-col h-full bg-background">
      <div className="flex-1 p-2 sm:p-4 md:p-8">
        <h2 className="text-xl sm:text-2xl font-bold tracking-tight mb-4 sm:mb-6">
          Sales History
        </h2>
        <Tabs
          defaultValue="weekly"
          className="space-y-2 sm:space-y-4"
          onValueChange={setTab}
        >
          <TabsList className="grid w-full grid-cols-2 max-w-[300px] sm:max-w-[400px]">
            <TabsTrigger value="weekly" className="text-sm sm:text-base">Weekly</TabsTrigger>
            <TabsTrigger value="monthly" className="text-sm sm:text-base">Monthly</TabsTrigger>
          </TabsList>
          <TabsContent value="weekly" className="mt-0">
            <SalesChart data={salesData} period="weekly" />
          </TabsContent>
          <TabsContent value="monthly" className="mt-0">
            <SalesChart data={salesData} period="monthly" />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}

