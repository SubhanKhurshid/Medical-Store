"use client";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import React, { useEffect } from "react";

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
    return <div>Loading...</div>;
  }

  if (!session || session.user.role !== "admin") {
    return <div>Unauthorized</div>;
  }

  return <div>Admin Content</div>;
};

export default AdminPage;
