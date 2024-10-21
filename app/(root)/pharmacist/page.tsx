"use client";
import { useAuth } from "@/app/providers/AuthProvider";
import { useRouter } from "next/navigation";
import React, { useEffect } from "react";
import Unauthorized from "../unauthorized/page";
import { motion } from 'framer-motion'
import { Pill, Clipboard, User, BarChart, ArrowRight } from 'lucide-react'
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import Link from "next/link"

const PharmacistPage = () => {
  const { user } = useAuth();
  if (user?.role !== "pharmacist") {
    return <Unauthorized />;
  }

  const fadeInUp = {
    initial: { opacity: 0, y: 20 },
    animate: { opacity: 1, y: 0 },
    transition: { duration: 0.6 }
  }

  const stats = [
    { title: "Total Medicines", value: "1,234", icon: Pill, color: "from-emerald-400 to-teal-500" },
    { title: "Prescriptions Filled", value: "567", icon: Clipboard, color: "from-blue-400 to-indigo-500" },
    { title: "Patients Served", value: "890", icon: User, color: "from-orange-400 to-pink-500" },
    { title: "Revenue", value: "$12,345", icon: BarChart, color: "from-purple-400 to-pink-500" },
  ]

  
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
              staggerChildren: 0.1
            }
          }
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
                    <p className="text-sm font-medium text-emerald-600">{stat.title}</p>
                    <h3 className="text-3xl font-bold text-emerald-900">{stat.value}</h3>
                  </div>
                  <div className={`p-3 rounded-full bg-gradient-to-br ${stat.color}`}>
                    <stat.icon className="h-8 w-8 text-white" />
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        ))}
      </motion.div>

      <motion.div 
        className="grid grid-cols-1 md:grid-cols-2 gap-6"
        
      >
        <Link href="pharmacist/inventory-management" className="block">
          <Card className="h-full hover:shadow-xl transition-shadow duration-300 bg-white bg-opacity-60 backdrop-filter backdrop-blur-lg">
            <CardContent className="p-6">
              <h2 className="text-2xl font-semibold text-emerald-700 mb-2">Inventory Management</h2>
              <p className="text-emerald-600 mb-4">Add, update, or remove medicines from your inventory.</p>
              <Button className="bg-emerald-500 hover:bg-emerald-600 text-white">
                Manage Inventory <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </CardContent>
          </Card>
        </Link>
        <Link href="pharmacist/inventory-view" className="block">
          <Card className="h-full hover:shadow-xl transition-shadow duration-300 bg-white bg-opacity-60 backdrop-filter backdrop-blur-lg">
            <CardContent className="p-6">
              <h2 className="text-2xl font-semibold text-emerald-700 mb-2">View Inventory</h2>
              <p className="text-emerald-600 mb-4">Check current stock levels and medicine details.</p>
              <Button className="bg-teal-500 hover:bg-teal-600 text-white">
                View Inventory <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </CardContent>
          </Card>
        </Link>
      </motion.div>
    </div>
  );
};

export default PharmacistPage;
