"use client";

import { useState } from "react";
import { DataTable } from "@/components/shared/DataTable";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { motion, AnimatePresence } from "framer-motion";
import { Search, Eye } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

interface Sale {
  id: string;
  quantity: number;
  salePrice: number;
  totalPrice: number;
  soldAt: string;
  customerName: string;
  customerPhone: string;
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
  const [sales, setSales] = useState<Sale[]>([ // Dummy data
    {
      id: "sale123",
      quantity: 5,
      salePrice: 50.0,
      totalPrice: 250.0,
      soldAt: "2025-02-20T10:00:00.000Z",
      customerName: "John Doe",
      customerPhone: "1234567890",
      saleItems: [
        {
          inventoryItem: {
            id: "item456",
            name: "Paracetamol",
            type: "MEDICINE",
            price: 50.0,
          },
        },
      ],
    },
    {
      id: "sale124",
      quantity: 2,
      salePrice: 100.0,
      totalPrice: 200.0,
      soldAt: "2025-02-21T14:30:00.000Z",
      customerName: "Jane Smith",
      customerPhone: "9876543210",
      saleItems: [
        {
          inventoryItem: {
            id: "item789",
            name: "Ibuprofen",
            type: "MEDICINE",
            price: 100.0,
          },
        },
      ],
    },
  ]);

  const columns = [
    {
      id: "customerName",
      header: "Customer",
      cell: ({ row }: any) => (
        <span className="text-lg font-semibold">{row.original.customerName}</span>
      ),
    },
    {
      id: "customerPhone",
      header: "Phone",
      cell: ({ row }: any) => (
        <span className="text-lg font-semibold">{row.original.customerPhone}</span>
      ),
    },
    {
      id: "soldAt",
      header: "Date",
      cell: ({ row }: any) => (
        <span className="text-lg font-semibold">{new Date(row.original.soldAt).toLocaleDateString()}</span>
      ),
    },
    {
      id: "quantity",
      header: "Quantity",
      cell: ({ row }: any) => <span className="text-lg font-semibold">{row.original.quantity}</span>,
    },
    {
      id: "salePrice",
      header: "Sale Price",
      cell: ({ row }: any) => <span className="text-lg font-semibold">{row.original.salePrice} Rs</span>,
    },
    {
      id: "totalPrice",
      header: "Total Price",
      cell: ({ row }: any) => <span className="text-lg font-semibold">{row.original.totalPrice} Rs</span>,
    },
    {
      id: "actions",
      header: "Actions",
      cell: ({ row }: any) => (
        <Button variant="ghost" size="icon">
          <Eye className="h-6 w-6 text-gray-600" />
        </Button>
      ),
    },
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
                data={sales.filter(
                  (s) =>
                    s.customerName?.toLowerCase().includes(search?.toLowerCase()) ||
                    s.customerPhone?.includes(search)
                )}
              />
            </motion.div>
          </AnimatePresence>
        </CardContent>
      </Card>
    </motion.div>
  );
};

export default SalesTable;
