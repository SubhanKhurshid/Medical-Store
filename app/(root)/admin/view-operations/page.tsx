"use client";
import React from "react";
import { motion } from "framer-motion";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Stethoscope, Syringe, Pill, UserCircle } from "lucide-react";

const ViewOperationsPage = () => {
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

  const viewOperations = [
    { href: "/admin/view-doctors", label: "View Doctors", icon: Stethoscope },
    { href: "/admin/view-nurses", label: "View Nurses", icon: Syringe },
    { href: "/admin/view-pharmacists", label: "View Pharmacists", icon: Pill },
    { href: "/admin/view-frontdesk", label: "View Frontdesk", icon: UserCircle },
  ];

  return (
    <motion.div
      initial="hidden"
      animate="visible"
      variants={containerVariants}
      className="min-h-screen bg-gradient-to-b from-emerald-50 to-white py-12 px-4 sm:px-6 lg:px-8"
    >
      <div className="max-w-4xl mx-auto">
        <motion.div
          className="text-center mb-12"
          variants={itemVariants}
        >
          <motion.h1
            className="text-4xl sm:text-5xl md:text-6xl font-bold text-emerald-700 mb-4"
            initial={{ opacity: 0, y: -50 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
          >
            View Your Desired Items
          </motion.h1>
          <motion.p
            className="text-xl text-emerald-600"
            variants={itemVariants}
          >
            Select the operation you want to perform
          </motion.p>
        </motion.div>

        <motion.div
          className="grid grid-cols-1 sm:grid-cols-2 gap-6"
          variants={containerVariants}
        >
          {viewOperations.map((op) => (
            <motion.div key={op.href} variants={itemVariants}>
              <Link href={op.href} passHref>
                <Button
                  className="w-full h-32 text-xl font-semibold bg-emerald-600 hover:bg-emerald-700 text-white transition-all duration-300 ease-in-out transform hover:scale-105 hover:shadow-lg rounded-xl flex items-center justify-center space-x-4"
                >
                  <op.icon className="h-8 w-8" />
                  <span>{op.label}</span>
                </Button>
              </Link>
            </motion.div>
          ))}
        </motion.div>
      </div>
    </motion.div>
  );
};

export default ViewOperationsPage;