"use client";

import { useEffect, useState } from "react";
import { DataTable } from "@/components/shared/DataTable";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { motion, AnimatePresence } from "framer-motion";
import { Search, Eye } from "lucide-react";
import { Button } from "@/components/ui/button";

interface Sale {
  id: string;
  quantity: number;
  salePrice: number;
  totalPrice: number;
  soldAt: string;
  customerName?: string | null; // Optional
  customerPhone?: string | null; // Optional
  saleItems: {
    inventoryItem: {
      id: string;
      name: string;
      type: string;
      price: number;
    };
  }[];
}

const SalesTable = () => {
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(false);
  const [sales, setSales] = useState<Sale[]>([]);

  // Fetch Sales Data from API
  const fetchSalesWithDateRange = async (
    startDate?: string,
    endDate?: string
  ) => {
    try {
      setLoading(true);
      const queryParams = new URLSearchParams();
      if (startDate) queryParams.append("startDate", startDate);
      if (endDate) queryParams.append("endDate", endDate);

      const response = await fetch(
        `https://annual-johna-uni2234-7798c123.koyeb.app/pharmacist/sales?${queryParams}`
      );
      const result = await response.json();

      if (response.ok && result.success && Array.isArray(result.data)) {
        setSales(result.data); // ✅ Ensures only data array is set
      } else {
        console.error("Invalid response format:", result);
        setSales([]); // ✅ Prevents crash
      }
    } catch (error) {
      console.error("Error fetching sales:", error);
      setSales([]); // ✅ Ensures table does not break
    } finally {
      setLoading(false);
    }
  };

  // Fetch Data on Component Mount
  useEffect(() => {
    fetchSalesWithDateRange();
  }, []);

  const columns = [
    {
      id: "customerName",
      header: "Customer",
      cell: ({ row }: any) => (
        <span className="text-lg font-semibold">
          {row.original.customerName || "--"} {/* ✅ Handles null names */}
        </span>
      ),
    },
    {
      id: "customerPhone",
      header: "Phone",
      cell: ({ row }: any) => (
        <span className="text-lg font-semibold">
          {row.original.customerPhone || "--"} {/* ✅ Handles null phone */}
        </span>
      ),
    },
    {
      id: "soldAt",
      header: "Date",
      cell: ({ row }: any) => (
        <span className="text-lg font-semibold">
          {new Date(row.original.soldAt).toLocaleDateString()}
        </span>
      ),
    },
    {
      id: "quantity",
      header: "Quantity",
      cell: ({ row }: any) => (
        <span className="text-lg font-semibold">{row.original.quantity}</span>
      ),
    },
    {
      id: "salePrice",
      header: "Sale Price",
      cell: ({ row }: any) => (
        <span className="text-lg font-semibold">
          {row.original.salePrice} Rs
        </span>
      ),
    },
    {
      id: "totalPrice",
      header: "Total Price",
      cell: ({ row }: any) => (
        <span className="text-lg font-semibold">
          {row.original.totalPrice} Rs
        </span>
      ),
    },
    // {
    //   id: "actions",
    //   header: "Actions",
    //   cell: ({ row }: any) => (
    //     <Button variant="ghost" size="icon">
    //       <Eye className="h-6 w-6 text-gray-600" />
    //     </Button>
    //   ),
    // },
  ];

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.5 }}
      className="p-6 md:p-10 max-w-9xl mx-auto min-h-screen bg-gradient-to-br from-gray-50 to-gray-100"
    >
      <Card className="bg-white shadow-xl border-0 rounded-xl overflow-hidden">
        <CardHeader className="text-red-800 p-6 border-b-2 border-red-700">
          <CardTitle className="text-3xl md:text-4xl font-bold">
            Sales Records
          </CardTitle>
          <p className="text-gray-500 mt-2 text-xl">
            Track and manage your sales transactions efficiently
          </p>
        </CardHeader>
        <CardContent className="p-6">
          <div className="flex flex-col sm:flex-row justify-between gap-4 mb-6">
            <div className="relative w-full sm:w-1/3">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
              <Input
                placeholder="Search sales..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-12 pr-4 py-3 bg-white border border-gray-300 rounded-lg focus:border-red-500 focus:ring focus:ring-red-200 text-lg"
              />
            </div>
          </div>

          <AnimatePresence>
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
              className="rounded-lg border border-gray-200 bg-white overflow-hidden"
            >
              <DataTable
                columns={columns}
                data={Array.isArray(sales) ? sales : []} // ✅ Prevents errors
              />
            </motion.div>
          </AnimatePresence>
        </CardContent>
      </Card>
    </motion.div>
  );
};

export default SalesTable;
