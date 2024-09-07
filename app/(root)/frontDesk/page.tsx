"use client";
import { Button } from "@/components/ui/button";
import { Plus, ScanSearch, Search } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import React, { useEffect } from "react";

const FrontDeskPage = () => {
  return (
    <div className="flex flex-col gap-10 items-center justify-center min-h-screen">
      <h1 className="text-3xl md:text-5xl tracking-tighter font-bold border-b-2 border-green-500 py-2">
        Choose Your Relevant Operation
      </h1>

      <div className="grid grid-cols-2 gap-10 w-full max-w-md">
        <Link href={"/nurse/add-patient"}>
          <Button className="bg-green-600 hover:bg-green-600 hover:opacity-80 gap-3 px-10 py-20 w-full transform transition duration-300 hover:scale-105">
            <Plus className="w-4 h-4" />
            Add Patient
          </Button>
        </Link>
        <Link href={"/nurse/search-patient"}>
          <Button className="bg-green-600 hover:bg-green-600 hover:opacity-80 gap-3 px-10 py-20 w-full transform transition duration-300 hover:scale-105">
            <Search className="w-4 h-4" />
            Search Patient
          </Button>
        </Link>
        <Link href={"/nurse/view-visit"}>
          <Button className="bg-green-600 hover:bg-green-600 hover:opacity-80 gap-3 px-10 py-20 w-full transform transition duration-300 hover:scale-105">
            <ScanSearch className="w-4 h-4" />
            View Visits
          </Button>
        </Link>
        <Link href={"/nurse/add-patient"}>
          <Button className="bg-green-600 hover:bg-green-600 hover:opacity-80 gap-3 px-10 py-20 w-full transform transition duration-300 hover:scale-105">
            <Plus className="w-4 h-4" />
            Add Patient
          </Button>
        </Link>
      </div>
    </div>
  );
};

export default FrontDeskPage;
