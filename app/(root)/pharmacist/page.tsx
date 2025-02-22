"use client";
import { useAuth } from "@/app/providers/AuthProvider";
import { useRouter } from "next/navigation";
import React, { useEffect, useState } from "react";
import { motion } from "framer-motion";
import Unauthorized from "@/app/(root)/unauthorized/page";
import { Pill, Clipboard, User, BarChart, ArrowRight, TrendingDown, Package, AlertTriangle } from 'lucide-react';
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { DataTable } from "@/components/shared/DataTable";
import { inventoryColumns } from "@/components/shared/columns";
import { useInventory } from "@/app/context/InventoryContext";
import { InventoryItem } from "@/app/context/InventoryContext";
import PharmacyStats from "./pharmacy-stats";

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
  console.log(user);

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

  if (user?.role !== "pharmacist") {
    return <Unauthorized />;
  }

  const stats = [
    {
      title: "Total Items",
      value: items.length,
      icon: Package,
      color: "from-red-600 to-red-400",
    },
    {
      title: "Low Stock",
      value: lowStockCount,
      icon: TrendingDown,
      color: "from-red-500 to-red-300",
    },
    {
      title: "Expiring Soon",
      value: expiringCount,
      icon: AlertTriangle,
      color: "from-red-400 to-red-200",
    },
    {
      title: "Earned This Month",
      value: "12,345",
      icon: BarChart,
      color: "from-red-700 to-red-500",
    },
  ];

  return (
    <div className="p-4 sm:p-8 max-w-9xl mx-auto min-h-screen bg-gray-50">
      <motion.h1 
        className="font-bold text-3xl md:text-4xl text-red-800 "
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        Pharmacy Dashboard
      </motion.h1>
      <motion.p className="mt-2 mb-6 text-xl text-gray-500">Welcome to the Dashboard of Pharmacist</motion.p>
{/* 
      <motion.div 
        className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6 mb-8"
        variants={{
          hidden: { opacity: 0 },
          show: {
            opacity: 1,
            transition: {
              staggerChildren: 0.1
            }
          }
        }}
        initial="hidden"
        animate="show"
      >
        {stats.map((stat, index) => (
          <motion.div 
            key={index}
          >
            <Card className="overflow-hidden transform transition-all duration-300 hover:shadow-lg hover:-translate-y-1">
              <CardContent className="p-4 sm:p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-red-600">
                      {stat.title}
                    </p>
                    <h3 className="text-2xl sm:text-3xl font-bold text-gray-900">
                      {stat.value}
                    </h3>
                  </div>
                  <div
                    className={`p-2 rounded-full bg-gradient-to-br ${stat.color}`}
                  >
                    <stat.icon className="h-6 w-6 text-white" />
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        ))}
      </motion.div> */}
       <PharmacyStats 
        items={items}
        lowStockCount={lowStockCount}
        expiringCount={expiringCount}
      />

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.5, delay: 0.2 }}
        >
          <Card className="p-4 shadow-md">
            <h2 className="text-lg font-semibold mb-4 text-red-700">Low Stock Items</h2>
            <DataTable columns={inventoryColumns} data={lowStockItems} />
          </Card>
        </motion.div>
        <motion.div
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.5, delay: 0.2 }}
        >
          <Card className="p-4 shadow-md">
            <h2 className="text-lg font-semibold mb-4 text-red-700">Expiring Soon</h2>
            <DataTable columns={inventoryColumns} data={expiringItems} />
          </Card>
        </motion.div>
      </div>
    </div>
  );
};

export default PharmacistPage;

