"use client";
import { useAuth } from "@/app/providers/AuthProvider";
import { useRouter } from "next/navigation";
import React, { useEffect } from "react";
import Unauthorized from "../unauthorized/page";

const PharmacistPage = () => {
  const { user } = useAuth();
  if (user?.role !== "pharmacist") {
    return <Unauthorized />;
  }
  return <div>Pharmacist Content</div>;
};

export default PharmacistPage;
