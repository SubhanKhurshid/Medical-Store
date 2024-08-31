"use client";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import React, { useEffect } from "react";
import Image from "next/image";
import plane from "@/public/paper_plane_1x-1.0s-200px-200px-removebg-preview.png";
import Link from "next/link";

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
      <div className="mt-32 flex flex-col items-center justify-center gap-10">
        <div className="flex flex-col items-center justify-center gap-2">
          <h1 className="text-3xl md:text-5xl max-w-3xl font-bold tracking-tighter">
            Welcome to Ibrahim Medical
          </h1>

          <h1>Select the operation you want to perform</h1>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5 items-center justify-center md:gap-3">
          <Link href={"/admin/add-operations"}>
            <div className="bg-blue-950  font-bold tracking-tighter px-10 py-3 cursor-pointer hover:opacity-80 hover:bg-blue-950 rounded-md">
              <h1>ADD OPERATIONS</h1>
            </div>
          </Link>
          <Link href={"/admin/view-operations"}>
            <div className="bg-blue-950 font-bold tracking-tighter px-10 py-3 cursor-pointer hover:opacity-80  hover:bg-blue-950 rounded-md">
              <h1>VIEW OPERATIONS</h1>
            </div>
          </Link>
        </div>
      </div>
    </>
  );
};

export default AdminPage;
