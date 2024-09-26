"use client";
import { useRouter } from "next/navigation";
import React from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/app/providers/AuthProvider";
import Unauthorized from "../unauthorized/page";
import { PlusCircle, Eye } from "lucide-react";

const AdminPage = () => {
  const { user } = useAuth();

  if (user?.role !== "admin") {
    return <Unauthorized />;
  }

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1,
        delayChildren: 0.3,
      },
    },
  };

  const itemVariants = {
    hidden: { y: 20, opacity: 0 },
    visible: {
      y: 0,
      opacity: 1,
      transition: {
        type: "spring",
        stiffness: 100,
      },
    },
  };

  return (
    <motion.div
      initial="hidden"
      animate="visible"
      variants={containerVariants}
      className="min-h-screen bg-gradient-to-b from-emerald-50 to-white py-12 px-4 sm:px-6 lg:px-8"
    >
      <div className="max-w-4xl mx-auto">
        <motion.div
          className="text-center"
          variants={itemVariants}
        >
          <motion.h1
            className="text-4xl sm:text-5xl md:text-6xl font-bold text-emerald-700 mb-4"
            initial={{ opacity: 0, y: -50 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
          >
            Welcome to N.S Ibrahim Medical
          </motion.h1>
          <motion.p
            className="text-xl text-emerald-600 mb-12"
            variants={itemVariants}
          >
            Select the operation you want to perform
          </motion.p>
        </motion.div>

        <motion.div
          className="grid grid-cols-1 sm:grid-cols-2 gap-6"
          variants={containerVariants}
        >
          <motion.div variants={itemVariants}>
            <Link href="/admin/add-operations" passHref>
              <Button className="w-full h-40 text-xl font-semibold bg-emerald-600 hover:bg-emerald-700 text-white transition-all duration-300 ease-in-out transform hover:scale-105 hover:shadow-lg rounded-xl flex flex-col items-center justify-center space-y-4">
                <PlusCircle className="h-12 w-12" />
                <span>Add Operations</span>
              </Button>
            </Link>
          </motion.div>
          <motion.div variants={itemVariants}>
            <Link href="/admin/view-operations" passHref>
              <Button className="w-full h-40 text-xl font-semibold bg-emerald-600 hover:bg-emerald-700 text-white transition-all duration-300 ease-in-out transform hover:scale-105 hover:shadow-lg rounded-xl flex flex-col items-center justify-center space-y-4">
                <Eye className="h-12 w-12" />
                <span>View Operations</span>
              </Button>
            </Link>
          </motion.div>
        </motion.div>
      </div>
    </motion.div>
  );
};

export default AdminPage;