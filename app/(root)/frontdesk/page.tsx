"use client";
import { useAuth } from "@/app/providers/AuthProvider";
import { Button } from "@/components/ui/button";
import { Calendar, PlusCircle, Search } from "lucide-react";
import Link from "next/link";
import React from "react";
import Unauthorized from "../unauthorized/page";
import { motion } from "framer-motion";

const FrontDeskPage = () => {
  const { user } = useAuth();

  if (user?.role !== "frontdesk") {
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
    <motion.main
      initial="hidden"
      animate="visible"
      variants={containerVariants}
      className="min-h-screen bg-gradient-to-b from-emerald-50 to-white"
    >
      <section className="flex items-center justify-center py-12 md:py-16 lg:py-20 xl:py-24">
        <div className="container px-4 sm:px-6 lg:px-8">
          <motion.div
            className="flex flex-col items-center justify-center space-y-4 text-center"
            variants={itemVariants}
          >
            <motion.div className="space-y-2" variants={itemVariants}>
              <h1 className="text-3xl font-bold tracking-tighter sm:text-4xl md:text-5xl lg:text-6xl text-emerald-600">
                Welcome to Ibrahim Medical
              </h1>
              <p className="mx-auto max-w-[90%] sm:max-w-[70%] text-gray-600 text-base sm:text-lg md:text-xl">
                Your trusted partner in healthcare. We provide quality medical
                supplies and services to our community.
              </p>
            </motion.div>
          </motion.div>
        </div>
      </section>

      <section className="w-full bg-emerald-50 py-12 md:py-16 lg:py-20 xl:py-24">
        <div className="container px-4 sm:px-6 lg:px-8">
          <motion.h2
            className="text-2xl md:text-3xl lg:text-4xl font-bold text-center mb-12 text-emerald-700"
            variants={itemVariants}
          >
            Front Desk Dashboard
          </motion.h2>
          <motion.div
            className="grid gap-6 sm:gap-8 md:grid-cols-2 lg:grid-cols-3"
            variants={containerVariants}
          >
            <motion.div variants={itemVariants}>
              <Link href="/frontdesk/add-patient" passHref>
                <Button className="h-32 sm:h-36 md:h-40 text-base sm:text-lg md:text-xl font-semibold bg-white hover:bg-emerald-100 text-emerald-700 border-2 border-emerald-200 transition-all duration-300 ease-in-out transform hover:scale-105 hover:shadow-lg w-full rounded-xl flex flex-col items-center justify-center space-y-2">
                  <PlusCircle className="h-8 w-8 sm:h-10 sm:w-10" />
                  <span>Add Patient</span>
                </Button>
              </Link>
            </motion.div>
            <motion.div variants={itemVariants}>
              <Link href="/frontdesk/search-patient" passHref>
                <Button className="h-32 sm:h-36 md:h-40 text-base sm:text-lg md:text-xl font-semibold bg-white hover:bg-emerald-100 text-emerald-700 border-2 border-emerald-200 transition-all duration-300 ease-in-out transform hover:scale-105 hover:shadow-lg w-full rounded-xl flex flex-col items-center justify-center space-y-2">
                  <Search className="h-8 w-8 sm:h-10 sm:w-10" />
                  <span>Search Patient</span>
                </Button>
              </Link>
            </motion.div>
            <motion.div variants={itemVariants}>
              <Link href="/frontdesk/view-visit" passHref>
                <Button className="h-32 sm:h-36 md:h-40 text-base sm:text-lg md:text-xl font-semibold bg-white hover:bg-emerald-100 text-emerald-700 border-2 border-emerald-200 transition-all duration-300 ease-in-out transform hover:scale-105 hover:shadow-lg w-full rounded-xl flex flex-col items-center justify-center space-y-2">
                  <Calendar className="h-8 w-8 sm:h-10 sm:w-10" />
                  <span>View Visits</span>
                </Button>
              </Link>
            </motion.div>
          </motion.div>
        </div>
      </section>
    </motion.main>
  );
};

export default FrontDeskPage;
