import Signup from "@/components/Signup";
import React from "react";
import { Suspense } from "react";
const page = () => {
  return (
    <div>
      <Suspense>
        <Signup />
      </Suspense>
    </div>
  );
};

export default page;
