"use client";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import React, { useEffect } from "react";
import Image from "next/image";
import plane from "@/public/paper_plane_1x-1.0s-200px-200px-removebg-preview.png";

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

  return <div>Admin Content</div>;
};

export default AdminPage;
