"use client";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import React, { useEffect } from "react";

const PharmacistPage = () => {
  const { data: session, status } = useSession();
  const router = useRouter();

  useEffect(() => {
    if (status === "loading") return; // Do nothing while loading
    if (!session) {
      router.push("/signin"); // Redirect to login if not authenticated
    } else if (session.user.role !== "pharmacist") {
      router.push("/unauthorized"); // Redirect if role is not authorized
    }
  }, [session, status, router]);

  if (status === "loading") {
    return <div>Loading...</div>;
  }

  if (!session || session.user.role !== "pharmacist") {
    return <div>Unauthorized</div>;
  }

  return <div>Pharmacist Content</div>;
};

export default PharmacistPage;
