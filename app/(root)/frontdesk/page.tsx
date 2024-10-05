"use client"

import { useAuth } from "@/app/providers/AuthProvider"
import { Button } from "@/components/ui/button"
import { Calendar, PlusCircle, Search, UserCircle } from "lucide-react"
import Link from "next/link"
import React from "react"
import Unauthorized from "../unauthorized/page"
import { motion } from "framer-motion"

const FrontDeskPage = () => {
  const { user } = useAuth()

  if (user?.role !== "frontdesk") {
    return <Unauthorized />
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
  }

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
  }

  return (
    <motion.main
      initial="hidden"
      animate="visible"
      variants={containerVariants}
      className="min-h-screen"
    >
      <section className="relative overflow-hidden py-12 md:py-20 lg:py-28">
        <div className="container px-4 sm:px-6 lg:px-8 relative z-10">
          <motion.div
            className="flex flex-col items-center justify-center space-y-4 text-center"
            variants={itemVariants}
          >
            <motion.div className="space-y-2" variants={itemVariants}>
              <h1 className="text-4xl font-bold tracking-tighter sm:text-5xl md:text-6xl lg:text-7xl bg-clip-text text-transparent bg-gradient-to-r from-emerald-600 to-teal-500">
                Welcome to Ibrahim Medical
              </h1>
              <p className="mx-auto max-w-[90%] sm:max-w-[70%] text-gray-600 text-lg sm:text-xl md:text-2xl font-light">
                Your trusted partner in healthcare. We provide quality medical
                supplies and services to our community.
              </p>
            </motion.div>
          </motion.div>
        </div>
        <div className="absolute inset-0 bg-[url('/placeholder.svg?height=400&width=800')] opacity-5 bg-repeat"></div>
      </section>

      <section className="w-full py-12 md:py-20 lg:py-28">
        <div className="container px-4 sm:px-6 lg:px-8">
          <motion.h2
            className="text-3xl md:text-4xl lg:text-5xl font-bold text-center mb-12 text-emerald-700"
            variants={itemVariants}
          >
            Front Desk Dashboard
          </motion.h2>
          <motion.div
            className="grid gap-8 sm:gap-10 md:grid-cols-2 lg:grid-cols-3"
            variants={containerVariants}
          >
            {[
              { href: "/frontdesk/add-patient", icon: PlusCircle, label: "Add Patient" },
              { href: "/frontdesk/search-patient", icon: Search, label: "Search Patient" },
              { href: "/frontdesk/view-visit", icon: Calendar, label: "View Visits" },
            ].map((item, index) => (
              <motion.div key={index} variants={itemVariants}>
                <Link href={item.href} passHref>
                  <Button
                    className="h-40 sm:h-48 md:h-56 text-xl sm:text-2xl md:text-3xl font-semibold bg-white hover:bg-emerald-50 text-emerald-700 border-2 border-emerald-200 transition-all duration-300 ease-in-out transform hover:scale-105 hover:shadow-xl w-full rounded-2xl flex flex-col items-center justify-center space-y-4 overflow-hidden group relative"
                  >
                    <div className="absolute inset-0 bg-gradient-to-br from-emerald-400 to-teal-500 opacity-0 group-hover:opacity-10 transition-opacity duration-300 ease-in-out"></div>
                    <item.icon className="h-12 w-12 sm:h-16 sm:w-16 transition-transform duration-300 ease-in-out group-hover:scale-110" />
                    <span className="relative z-10">{item.label}</span>
                  </Button>
                </Link>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      <motion.section
        className="w-full py-12 md:py-20 lg:py-28 bg-gradient-to-b from-emerald-50 to-white"
        variants={containerVariants}
      >
        <div className="container px-4 sm:px-6 lg:px-8">
          <motion.h2
            className="text-3xl md:text-4xl lg:text-5xl font-bold text-center mb-12 text-emerald-700"
            variants={itemVariants}
          >
            Quick Stats
          </motion.h2>
          <motion.div
            className="grid gap-8 sm:gap-10 md:grid-cols-2 lg:grid-cols-4"
            variants={containerVariants}
          >
            {[
              { label: "Patients Today", value: "42" },
              { label: "Appointments", value: "18" },
              { label: "New Patients", value: "7" },
              { label: "Completed Visits", value: "35" },
            ].map((stat, index) => (
              <motion.div
                key={index}
                className="bg-white p-6 rounded-xl shadow-lg border border-emerald-100 flex flex-col items-center justify-center space-y-2 transition-all duration-300 ease-in-out hover:shadow-xl hover:border-emerald-300"
                variants={itemVariants}
              >
                <span className="text-4xl font-bold text-emerald-600">{stat.value}</span>
                <span className="text-gray-600 text-lg">{stat.label}</span>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </motion.section>


    </motion.main>
  )
}

export default FrontDeskPage