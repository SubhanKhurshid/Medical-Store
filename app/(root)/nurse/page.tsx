"use client";
import { Button } from "@/components/ui/button";
import { Plus, ScanSearch, Search } from "lucide-react";
import { useSession } from "next-auth/react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import React, { useEffect } from "react";

const NursePage = () => {
  const { data: session, status } = useSession();
  const router = useRouter();

  useEffect(() => {
    if (status === "loading") return;
    if (!session) {
      router.push("/signin");
    } else if (session.user.role !== "nurse") {
      router.push("/unauthorized");
    }
  }, [session, status, router]);

  if (status === "loading") {
    return <div>Loading...</div>;
  }

  if (!session || session.user.role !== "nurse") {
    return <div>Unauthorized</div>;
  }

  return (
    <div className="flex flex-col gap-10 items-center justify-center min-h-screen">
      <div className="relative w-full flex items-center justify-center">
        <div className="absolute inset-0 flex items-center">
          <div className="w-full border-t border-gray-300"></div>
        </div>
        <div className="relative px-5 bg-white tracking-tighter text-xl font-bold text-gray-800">
          CHOOSE THE ACTION YOU WANT TO PERFORM
        </div>
      </div>

      <div className="grid grid-cols-2 gap-10 w-full max-w-md">
        <Link href={"/nurse/add-patient"}>
          <Button className="bg-[#223442] hover:bg-[#223442] hover:opacity-80 gap-3 px-10 py-20 w-full transform transition duration-300 hover:scale-105">
            <Plus className="w-4 h-4" />
            Add Patient
          </Button>
        </Link>
        <Link href={"/nurse/search-patient"}>
          <Button className="bg-[#223442] hover:bg-[#223442] hover:opacity-80 gap-3 px-10 py-20 w-full transform transition duration-300 hover:scale-105">
            <Search className="w-4 h-4" />
            Search Patient
          </Button>
        </Link>
        <Link href={"/nurse/view-visit"}>
          <Button className="bg-[#223442] hover:bg-[#223442] hover:opacity-80 gap-3 px-10 py-20 w-full transform transition duration-300 hover:scale-105">
            <ScanSearch className="w-4 h-4" />
            View Visits
          </Button>
        </Link>
        <Link href={"/nurse/add-patient"}>
          <Button className="bg-[#223442] hover:bg-[#223442] hover:opacity-80 gap-3 px-10 py-20 w-full transform transition duration-300 hover:scale-105">
            <Plus className="w-4 h-4" />
            Add Patient
          </Button>
        </Link>
      </div>
    </div>
  );
};

export default NursePage;
