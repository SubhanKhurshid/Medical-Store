import { Link } from "lucide-react";
import React from "react";

const Footer = () => {
  return (
    <footer className="flex flex-col gap-2 sm:flex-row py-6 w-full shrink-0 items-center px-4 md:px-6  text-[#E7E7E4] mt-20">
      <p className="text-xs">
        &copy; 2024 Ibrahim Medical. All rights reserved.
      </p>
      <nav className="sm:ml-auto flex gap-4 sm:gap-6">
        <Link
          href="#"
          className="text-xs hover:underline underline-offset-4"
          
        >
          Terms of Service
        </Link>
        <Link
          href="#"
          className="text-xs hover:underline underline-offset-4"
          
        >
          Privacy
        </Link>
      </nav>
    </footer>
  );
};

export default Footer;
