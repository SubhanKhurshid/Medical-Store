"use client";

import Link from "next/link";
import { useSession } from "next-auth/react";
import { usePathname, useRouter } from "next/navigation";
import React, { useEffect, useState } from "react";
import Image from "next/image";
import { Sheet, SheetContent, SheetTrigger } from "../ui/sheet";
import { Separator } from "../ui/separator";
import menu from "@/public/icons8-menu-50.png";
import logo from "@/public/WhatsApp Image 2024-08-02 at 23.45.33_0ac66f5d.jpg";
import { ShieldPlus } from "lucide-react";

const Navbar = () => {
  const pathname = usePathname();
  const router = useRouter();
  const { data: session, status } = useSession();
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    if (status === "loading") return;
    if (!session) {
      router.push("/signin");
    }
  }, [session, status, router]);

  if (
    status === "loading" ||
    pathname === "/signin" ||
    pathname === "/signup"
  ) {
    return null;
  }

  return (
    <div className="max-w-7xl mx-auto w-full px-6 py-4 bg-[#285430] text-white shadow-lg rounded-b-lg">
      {/* Navbar for Nurse */}
      {session?.user.role === "nurse" && (
        <>
          <div className="hidden md:flex items-center justify-between">
            <Link href={"/nurse"} className="flex items-center gap-2">
              <ShieldPlus className="text-white h-6 w-6" />
              <span className="text-xl font-semibold">Ibrahim Medical</span>
            </Link>
            <div className="flex items-center space-x-8">
              <NavLink href="/nurse" currentPath={pathname}>
                Dashboard
              </NavLink>
              <NavLink href="/nurse/add-patient" currentPath={pathname}>
                Add Patient
              </NavLink>
              <NavLink href="/nurse/search-patient" currentPath={pathname}>
                Search Patient
              </NavLink>
              <NavLink href="/nurse/view-visit" currentPath={pathname}>
                View Visits
              </NavLink>
            </div>
          </div>
          <div className="md:hidden flex items-center justify-between">
            <Link href={"/nurse"} className="flex items-center gap-2">
              <ShieldPlus className="text-white h-6 w-6" />
              <span className="text-xl font-semibold">Ibrahim Medical</span>
            </Link>
            <Sheet open={isOpen} onOpenChange={setIsOpen}>
              <SheetTrigger className="align-middle">
                <Image
                  src={menu}
                  alt="menu"
                  width={24}
                  height={24}
                  className="cursor-pointer"
                />{" "}
              </SheetTrigger>
              <SheetContent className="flex flex-col gap-6 bg-[#285430] text-white md:hidden">
                <div className="flex items-center gap-2">
                  <ShieldPlus className="text-white h-6 w-6" />
                  <span className="text-xl font-semibold">Ibrahim Medical</span>
                </div>
                <Separator className="border border-gray-50" />
                <div className="flex flex-col space-y-4">
                  <NavLink href="/nurse" currentPath={pathname}>
                    Dashboard
                  </NavLink>
                  <NavLink href="/nurse/add-patient" currentPath={pathname}>
                    Add Patient
                  </NavLink>
                  <NavLink href="/nurse/search-patient" currentPath={pathname}>
                    Search Patient
                  </NavLink>
                  <NavLink href="/nurse/view-visit" currentPath={pathname}>
                    View Visits
                  </NavLink>
                </div>
              </SheetContent>
            </Sheet>
          </div>
        </>
      )}

      {/* Navbar for Admin */}
      {session?.user.role === "admin" && (
        <>
          <div className="hidden md:flex items-center justify-between">
            <Link href={"/admin"} className="flex items-center gap-2">
              <ShieldPlus className="text-white h-6 w-6" />
              <span className="text-xl font-semibold">Ibrahim Medical</span>
            </Link>
            <div className="flex items-center space-x-8">
              <NavLink href="/signup" currentPath={pathname}>
                Add Doctor
              </NavLink>
              <NavLink href="/signup" currentPath={pathname}>
                Add Nurse
              </NavLink>
              <NavLink href="/signup" currentPath={pathname}>
                Add Pharmacist
              </NavLink>
              <NavLink href="/signup" currentPath={pathname}>
                Front Desk
              </NavLink>
            </div>
          </div>
          <div className="md:hidden flex items-center justify-between">
            <Link href={"/admin"} className="flex items-center gap-2">
              <ShieldPlus className="text-white h-6 w-6" />
            </Link>
            <Sheet open={isOpen} onOpenChange={setIsOpen}>
              <SheetTrigger className="align-middle">
                <Image
                  src={menu}
                  alt="menu"
                  width={24}
                  height={24}
                  className="cursor-pointer"
                />
              </SheetTrigger>
              <SheetContent className="flex flex-col gap-6 bg-[#285430] text-white md:hidden">
                <div className="flex items-center gap-2">
                  <ShieldPlus className="text-white h-6 w-6" />
                  <span className="text-xl font-semibold">Ibrahim Medical</span>
                </div>
                <Separator className="border border-gray-50" />
                <div className="flex flex-col space-y-4">
                  <NavLink href="/signup" currentPath={pathname}>
                    Add Doctor
                  </NavLink>
                  <NavLink href="/signup" currentPath={pathname}>
                    Add Nurse
                  </NavLink>
                  <NavLink href="/signup" currentPath={pathname}>
                    Add Pharmacist
                  </NavLink>
                  <NavLink href="/signup" currentPath={pathname}>
                    Front Desk
                  </NavLink>
                </div>
              </SheetContent>
            </Sheet>
          </div>
        </>
      )}
    </div>
  );
};

// NavLink component to avoid repetition and improve readability
const NavLink = ({ href, currentPath, children }: any) => (
  <Link
    href={href}
    className={`${
      currentPath === href
        ? "bg-white text-[#285430] font-semibold rounded-full"
        : "text-white hover:text-gray-300 transition duration-150 ease-in-out"
    } px-4 py-2`}
  >
    {children}
  </Link>
);

export default Navbar;
