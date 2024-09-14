"use client";

import { useAuth } from "@/app/providers/AuthProvider";
import { useRouter } from "next/navigation";
import React, { useEffect } from "react";
import Unauthorized from "../unauthorized/page";

const DoctorPage = () => {
  const { user } = useAuth();
  if (user?.role !== "doctor") {
    return <Unauthorized />;
  }
  return <div>Doctor Content</div>;
};

export default DoctorPage;
