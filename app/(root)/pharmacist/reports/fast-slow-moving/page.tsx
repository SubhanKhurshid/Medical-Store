"use client";

import { useAuth } from "@/app/providers/AuthProvider";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { motion } from "framer-motion";
import { ArrowLeft, TrendingUp, TrendingDown } from "lucide-react";
import Loading from "@/components/shared/Loading";
import Link from "next/link";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { TableEmptyState } from "@/components/shared/TableEmptyState";

interface MovingItem {
  id: string;
  name: string;
  type: string;
  quantitySold: number;
}

interface FastSlowData {
  fastMoving: MovingItem[];
  slowMoving: MovingItem[];
  days: number;
}

export default function FastSlowMovingReportPage() {
  const { user } = useAuth();
  const [data, setData] = useState<FastSlowData | null>(null);
  const [loading, setLoading] = useState(true);
  const [days, setDays] = useState(30);

  useEffect(() => {
    if (!user?.access_token) return;
    const fetchData = async () => {
      setLoading(true);
      try {
        const res = await fetch(
          `${process.env.NEXT_PUBLIC_API_BASE_URL}/pharmacist/reports/fast-slow-moving?days=${days}`,
          { headers: { Authorization: `Bearer ${user.access_token}` } }
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
  }, [user?.access_token, days]);

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="p-6 md:p-8 max-w-6xl mx-auto min-h-screen bg-gray-50"
    >
      <div className="flex items-center gap-4 mb-6">
        <Button variant="ghost" size="icon" asChild>
          <Link href="/pharmacist/reports">
            <ArrowLeft className="h-5 w-5" />
          </Link>
        </Button>
        <div>
          <h1 className="text-2xl md:text-3xl font-bold text-red-800">
            Fast / Slow Moving Items
          </h1>
          <p className="text-gray-500">Items sold most and least in the selected period.</p>
        </div>
      </div>

      <Card className="mb-6">
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>Period</CardTitle>
          <div className="flex gap-2">
            {[7, 30, 90].map((d) => (
              <Button
                key={d}
                variant={days === d ? "default" : "outline"}
                size="sm"
                onClick={() => setDays(d)}
              >
                Last {d} days
              </Button>
            ))}
          </div>
        </CardHeader>
      </Card>

      {loading ? (
        <Card>
          <CardContent className="min-h-[280px] flex items-center justify-center">
            <Loading />
          </CardContent>
        </Card>
      ) : data ? (
        <div className="grid gap-6 lg:grid-cols-2">
          <Card>
            <CardHeader className="flex flex-row items-center gap-2">
              <TrendingUp className="h-5 w-5 text-green-600" />
              <CardTitle>Fast moving (top 50)</CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              <Table wrapperClassName={data.fastMoving.length > 0 ? "min-h-[260px]" : undefined}>
                <TableHeader>
                  <TableRow>
                    <TableHead>#</TableHead>
                    <TableHead>Name</TableHead>
                    <TableHead>Type</TableHead>
                    <TableHead className="text-right">Qty sold</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {data.fastMoving.length === 0 ? (
                    <TableEmptyState
                      icon={TrendingUp}
                      title="No sales in this period"
                      description="Fast moving items will appear here once you have sales in the selected range."
                      colSpan={4}
                    />
                  ) : (
                    data.fastMoving.map((row, i) => (
                      <TableRow key={row.id}>
                        <TableCell className="text-muted-foreground w-12">{i + 1}</TableCell>
                        <TableCell className="font-medium">{row.name}</TableCell>
                        <TableCell>{row.type}</TableCell>
                        <TableCell className="text-right">{row.quantitySold}</TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center gap-2">
              <TrendingDown className="h-5 w-5 text-amber-600" />
              <CardTitle>Slow moving (bottom 50)</CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              <Table wrapperClassName={data.slowMoving.length > 0 ? "min-h-[260px]" : undefined}>
                <TableHeader>
                  <TableRow>
                    <TableHead>#</TableHead>
                    <TableHead>Name</TableHead>
                    <TableHead>Type</TableHead>
                    <TableHead className="text-right">Qty sold</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {data.slowMoving.length === 0 ? (
                    <TableEmptyState
                      icon={TrendingDown}
                      title="No sales in this period"
                      description="Slow moving items will appear here once you have sales in the selected range."
                      colSpan={4}
                    />
                  ) : (
                    data.slowMoving.map((row, i) => (
                      <TableRow key={row.id}>
                        <TableCell className="text-muted-foreground w-12">{i + 1}</TableCell>
                        <TableCell className="font-medium">{row.name}</TableCell>
                        <TableCell>{row.type}</TableCell>
                        <TableCell className="text-right">{row.quantitySold}</TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </div>
      ) : (
        <Card>
          <CardContent className="py-12 text-center text-muted-foreground">
            No data available.
          </CardContent>
        </Card>
      )}
    </motion.div>
  );
}
