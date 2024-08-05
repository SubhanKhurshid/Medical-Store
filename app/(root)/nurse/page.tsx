"use client";
import { useSession } from "next-auth/react";
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
    <div className="flex items-center justify-center min-h-screen text-3xl">
      Nurse Dashboard Here
    </div>
  );
};

export default NursePage;
