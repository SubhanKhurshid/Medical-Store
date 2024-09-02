"use client";
import React from "react";
import { motion } from "framer-motion";
import Link from "next/link";
import { Button } from "@/components/ui/button";

const ViewOperationsPage = () => {
  return (
    <div className="flex flex-col items-center justify-center mt-20 gap-10">
      <div className="flex flex-col items-center justify-center gap-2">
        <motion.h1
          className="text-2xl md:text-7xl max-w-3xl text-center tracking-tighter font-bold"
          initial={{ opacity: 0, y: -50 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 1 }}
        >
          View your desired items from here
        </motion.h1>
        <h1>Select the operation you want to perform</h1>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5 items-center justify-center md:gap-3">
        <Link href={"/admin/view-doctors"}>
          <Button className="bg-[#5f8d4e] hover:bg-[#5f8d4e]  hover:opacity-80  text-white font-light w-full">
            VIEW DOCTORS
          </Button>
        </Link>
        <Link href={"/admin/view-nurses"}>
          <Button className="bg-[#5f8d4e] hover:bg-[#5f8d4e]  hover:opacity-80  text-white font-light w-full">
            VIEW NURSES
          </Button>
        </Link>
        <Link href={"/admin/view-pharmacists"}>
          <Button className="bg-[#5f8d4e] hover:bg-[#5f8d4e]  hover:opacity-80  text-white font-light w-full">
            VIEW PHARMACISTS
          </Button>
        </Link>
        <Link href={"/admin/view-frontdesk"}>
          <Button className="bg-[#5f8d4e] hover:bg-[#5f8d4e]  hover:opacity-80  text-white font-light w-full">
            VIEW FRONTDESK
          </Button>
        </Link>
      </div>
    </div>
  );
};

export default ViewOperationsPage;
