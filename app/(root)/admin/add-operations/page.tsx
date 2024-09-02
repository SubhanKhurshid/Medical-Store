"use client";
import { Button } from "@/components/ui/button";
import { motion } from "framer-motion";
import Link from "next/link";
import React, { useState } from "react";

const AddOpeationsPage = () => {
  const [role, setRole] = useState("");
  console.log(role);
  return (
    <div className="flex flex-col items-center justify-center mt-20 gap-10">
      <div className="flex flex-col items-center justify-center gap-4">
        <motion.h1
          className="text-3xl md:text-7xl max-w-3xl text-center tracking-tighter font-bold"
          initial={{ opacity: 0, y: -50 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 1 }}
        >
          Perform your add operations
        </motion.h1>

        <h1 className="text-center">
          Select the operation you want to perform
        </h1>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5 items-center justify-center md:gap-3">
        <Link href={{ pathname: "/signup", query: { role: "doctor" } }}>
          <Button
            className="bg-[#5f8d4e] hover:bg-[#5f8d4e]  hover:opacity-80  text-white font-light w-full"
            onClick={() => setRole("doctor")}
          >
            ADD DOCTOR
          </Button>
        </Link>
        <Link href={{ pathname: "/signup", query: { role: "nurse" } }}>
          <Button
            className="bg-[#5f8d4e] hover:bg-[#5f8d4e] hover:opacity-80 text-white font-light w-full"
            onClick={() => setRole("nurse")}
          >
            ADD NURSE
          </Button>
        </Link>
        <Link href={{ pathname: "/signup", query: { role: "pharmacist" } }}>
          <Button
            className="bg-[#5f8d4e] hover:bg-[#5f8d4e] hover:opacity-80 text-white font-light w-full"
            onClick={() => setRole("pharmacist")}
          >
            ADD PHARMACIST
          </Button>
        </Link>
        <Link href={{ pathname: "/signup", query: { role: "frontdesk" } }}>
          <Button
            className="bg-[#5f8d4e] hover:bg-[#5f8d4e] hover:opacity-80 text-white font-light w-full"
            onClick={() => setRole("frontdesk")}
          >
            ADD FRONTDESK
          </Button>
        </Link>
      </div>
    </div>
  );
};

export default AddOpeationsPage;
