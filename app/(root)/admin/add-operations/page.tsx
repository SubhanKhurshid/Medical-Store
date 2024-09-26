"use client";
import { Button } from "@/components/ui/button";
import { motion } from "framer-motion";
import Link from "next/link";
import React, { useState } from "react";
import { UserPlus, Stethoscope, Syringe, Pill, UserCircle } from "lucide-react";

const AddOperationsPage = () => {
  const [role, setRole] = useState("");

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

  const operations = [
    { role: "doctor", label: "Add Doctor", icon: Stethoscope },
    { role: "nurse", label: "Add Nurse", icon: Syringe },
    { role: "pharmacist", label: "Add Pharmacist", icon: Pill },
    { role: "frontdesk", label: "Add Frontdesk", icon: UserCircle },
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
            Perform Your Add Operations
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
          {operations.map((op) => (
            <motion.div key={op.role} variants={itemVariants}>
              <Link href={{ pathname: "/signup", query: { role: op.role } }} passHref>
                <Button
                  className="w-full h-32 text-xl font-semibold bg-emerald-600 hover:bg-emerald-700 text-white transition-all duration-300 ease-in-out transform hover:scale-105 hover:shadow-lg rounded-xl flex items-center justify-center space-x-4"
                  onClick={() => setRole(op.role)}
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

export default AddOperationsPage;