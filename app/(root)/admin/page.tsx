"use client";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import React, { useEffect } from "react";
import Image from "next/image";
import plane from "@/public/paper_plane_1x-1.0s-200px-200px-removebg-preview.png";
import Link from "next/link";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";

const AdminPage = () => {
  const { data: session, status } = useSession();
  const router = useRouter();

  useEffect(() => {
    if (status === "loading") return;
    if (!session) {
      router.push("/signin");
    } else if (session.user.role !== "admin") {
      router.push("/unauthorized");
    }
  }, [session, status, router]);

  if (status === "loading") {
    return (
      <div className="flex justify-center items-center h-screen">
        <Image
          src={plane}
          alt="Loading..."
          className="w-20 h-20 animate-bounce"
        />
      </div>
    );
  }

  if (!session || session.user.role !== "admin") {
    return <div>Unauthorized</div>;
  }

  return (
    <>
      <div className="mt-10 flex flex-col items-center justify-center gap-10">
        <div className="flex flex-col items-center justify-center gap-2">
          <motion.h1
            className="mt-10 text-3xl md:text-7xl max-w-3xl text-center tracking-tighter font-bold  py-2"
            initial={{ opacity: 0, y: -50 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 1 }}
          >
            Welcome to N.S Ibrahim Medical
          </motion.h1>

          <h1 className="text-center px-10">
            Select the operation you want to perform
          </h1>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5 items-center justify-center md:gap-3">
          <Link href={"/admin/add-operations"}>
            <Button className="bg-[#5f8d4e] hover:bg-[#5f8d4e]  hover:opacity-80  text-white font-light w-full">
              ADD OPERATIONS
            </Button>
          </Link>
          <Link href={"/admin/view-operations"}>
            <Button className="bg-[#5f8d4e] hover:bg-[#5f8d4e]  hover:opacity-80  text-white font-light w-full">
              VIEW OPERATIONS
            </Button>
          </Link>
        </div>
      </div>
    </>
  );
};

export default AdminPage;
