'use client'
import { Link } from "lucide-react";
import React from "react";
import { motion } from 'framer-motion';


const Footer = () => {
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
    <div className="mt-10">
      <motion.footer
        className="w-full py-8 bg-emerald-800 text-white"
        variants={containerVariants}
      >
        <div className="container px-4 sm:px-6 lg:px-8 flex flex-col md:flex-row justify-between items-center">
          <motion.p variants={itemVariants} className="text-sm md:text-base">
            © 2024 Ibrahim Medical. All rights reserved.
          </motion.p>
          <motion.div variants={itemVariants} className="flex space-x-4 mt-4 md:mt-0">
            <h1 className="text-sm md:text-base hover:underline">
              Privacy Policy
            </h1>
            <h1 className="text-sm md:text-base hover:underline">
              Terms of Service
            </h1>
          </motion.div>
        </div>
      </motion.footer>
    </div>
  );
};

export default Footer;
