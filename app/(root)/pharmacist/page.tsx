"use client";
import { useAuth } from "@/app/providers/AuthProvider";
import { useRouter } from "next/navigation";
import React, { useEffect, useState } from "react";
import Unauthorized from "../unauthorized/page";
import { motion } from "framer-motion";
import {
  Pill,
  Clipboard,
  User,
  BarChart,
  ArrowRight,
  TrendingDown,
  Package,
  AlertTriangle,
} from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { DataTable } from "@/components/shared/DataTable";
import { inventoryColumns } from "@/components/shared/columns";
import { useInventory } from "@/app/context/InventoryContext";
import { InventoryItem } from "@/app/context/InventoryContext"; // Ensure InventoryItem type is imported

const PharmacistPage = () => {
  const {
    state: { items },
    getLowStockItems,
    getExpiringItems,
  } = useInventory();

  const [lowStockItems, setLowStockItems] = useState<InventoryItem[]>([]);
  const [expiringItems, setExpiringItems] = useState<InventoryItem[]>([]);
  const [lowStockCount, setLowStockCount] = useState(0);
  const [expiringCount, setExpiringCount] = useState(0);

  const { user } = useAuth();
  if (user?.role !== "pharmacist") {
    return <Unauthorized />;
  }

  const fadeInUp = {
    initial: { opacity: 0, y: 20 },
    animate: { opacity: 1, y: 0 },
    transition: { duration: 0.6 },
  };

  useEffect(() => {
    const fetchData = async () => {
      const lowStock = await getLowStockItems();
      const expiring = await getExpiringItems();
      setLowStockItems(lowStock);
      setExpiringItems(expiring);
      setLowStockCount(lowStock.length);
      setExpiringCount(expiring.length);
    };
    fetchData();
  }, []);

  const stats = [
    {
      title: "Total Items",
      value: items.length,
      icon: Package,
      color: "from-emerald-400 to-teal-500",
    },
    {
      title: "Low Stock",
      value: lowStockCount,
      icon: TrendingDown,
      color: "from-blue-400 to-indigo-500",
    },
    {
      title: "Expiring Soon",
      value: expiringCount,
      icon: AlertTriangle,
      color: "from-red-500 to-red-200",
    },
    {
      title: "Earned This Month",
      value: "12,345",
      icon: BarChart,
      color: "from-purple-400 to-pink-500",
    },
  ];

  return (
    <div className="p-8 max-w-7xl mx-auto  min-h-screen">
      <motion.h1
        className="text-4xl font-bold text-emerald-800 mb-8 text-center"
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        Pharmacy Dashboard
      </motion.h1>

      <motion.div
        className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-12"
        variants={{
          animate: {
            transition: {
              staggerChildren: 0.1,
            },
          },
        }}
        initial="initial"
        animate="animate"
      >
        {stats.map((stat, index) => (
          <motion.div key={index}>
            <Card className="overflow-hidden transform hover:scale-105 transition-transform duration-300">
              <CardContent className="p-6">
                <div className={`absolute inset-0 opacity-10 rounded-lg`}></div>
                <div className="relative z-10 flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-emerald-600">
                      {stat.title}
                    </p>
                    <h3 className="text-3xl font-bold text-emerald-900">
                      {stat.value}
                    </h3>
                  </div>
                  <div
                    className={`p-3 rounded-full bg-gradient-to-br ${stat.color}`}
                  >
                    <stat.icon className="h-8 w-8 text-white" />
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        ))}
      </motion.div>

      <div className="grid gap-4 md:grid-cols-2">
        <Card className="p-4">
          <h2 className="text-lg font-semibold mb-4">Low Stock Items</h2>
          <DataTable columns={inventoryColumns} data={lowStockItems} />
        </Card>

        <Card className="p-4">
          <h2 className="text-lg font-semibold mb-4">Expiring Soon</h2>
          <DataTable columns={inventoryColumns} data={expiringItems} />
        </Card>
      </div>
    </div>
  );
};

export default PharmacistPage;
