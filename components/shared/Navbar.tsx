"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import React, { useState } from "react";
import Image from "next/image";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { Separator } from "@/components/ui/separator";
import { ShieldPlus } from "lucide-react";
import { useAuth } from "@/app/providers/AuthProvider";
import { Button } from "@/components/ui/button";
import logo from "@/public/logo.jpg";

const Navbar = () => {
  const { user, logout } = useAuth();
  const pathname = usePathname();
  const [isOpen, setIsOpen] = useState(false);
  const role = user?.role;
  const router = useRouter();

  const handleLogout = (event: React.MouseEvent) => {
    event.preventDefault();
    logout();
    router.push("/signin");
  };

  if (!role) return null;

  const navItems = {
    nurse: [
      { href: "/nurse", label: "Dashboard" },
      { href: "/nurse/patient-details", label: "Add Patient Details" },
    ],
    frontdesk: [
      { href: "/frontdesk", label: "Dashboard" },
      { href: "/frontdesk/add-patient", label: "Add Patient" },
      { href: "/frontdesk/search-patient", label: "Search Patient" },
      { href: "/frontdesk/view-visit", label: "View Visits" },
    ],
    admin: [
      { href: "/signup?role=doctor", label: "Add Doctor" },
      { href: "/signup?role=nurse", label: "Add Nurse" },
      { href: "/signup?role=pharmacist", label: "Add Pharmacist" },
      { href: "/signup?role=frontdesk", label: "Add Front Desk" },
    ],
    pharmacist: [
      {href: "/pharmacist", label: "Dashboard"},
      {href: "/pharmacist/inventory-management", label: "Add Medicine"},
      {href: "/pharmacist/inventory-view", label: "View Inventory"}
    ]
  };

  const currentNavItems = navItems[role as keyof typeof navItems] || [];

  return (
    <nav className="bg-white shadow-md">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
          <div className="flex">
            <Link href={`/${role}`} className="flex-shrink-0 flex items-center">
              {/* <ShieldPlus className="h-8 w-8 text-emerald-500" />
              <span className="ml-2 text-xl font-semibold text-gray-900">Ibrahim Medical</span> */}
              <Image src={logo} alt="logo" width={50} height={50} />
            </Link>
          </div>
          <div className="hidden md:flex md:items-center md:space-x-4">
            {currentNavItems.map((item) => (
              <NavLink key={item.href} href={item.href} currentPath={pathname}>
                {item.label}
              </NavLink>
            ))}
            <Button
              onClick={handleLogout}
              className="ml-4 bg-emerald-500 text-white hover:bg-emerald-600 transition-colors duration-200"
            >
              Logout
            </Button>
          </div>
          <div className="flex items-center md:hidden">
            <Sheet open={isOpen} onOpenChange={setIsOpen}>
              <SheetTrigger asChild>
                <Button variant="ghost" className="p-2">
                  <span className="sr-only">Open menu</span>
                  <svg
                    className="h-6 w-6"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                    aria-hidden="true"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M4 6h16M4 12h16M4 18h16"
                    />
                  </svg>
                </Button>
              </SheetTrigger>
              <SheetContent className="w-[300px] sm:w-[400px]">
                <div className="flex items-center mb-6">
                  {/* <ShieldPlus className="h-8 w-8 text-emerald-500" />
                  <span className="ml-2 text-xl font-semibold text-gray-900">Ibrahim Medical</span> */}
                  <Image src={logo} alt="logo" width={50} height={50} />
                </div>
                <Separator className="mb-6" />
                <div className="flex flex-col space-y-4">
                  {currentNavItems.map((item) => (
                    <NavLink
                      key={item.href}
                      href={item.href}
                      currentPath={pathname}
                    >
                      {item.label}
                    </NavLink>
                  ))}
                  <Button
                    onClick={handleLogout}
                    className="mt-4 w-full bg-emerald-500 text-white hover:bg-emerald-600 transition-colors duration-200"
                  >
                    Logout
                  </Button>
                </div>
              </SheetContent>
            </Sheet>
          </div>
        </div>
      </div>
    </nav>
  );
};

const NavLink = ({
  href,
  currentPath,
  children,
}: {
  href: string;
  currentPath: string;
  children: React.ReactNode;
}) => (
  <Link
    href={href}
    className={`px-3 py-2 rounded-md text-sm font-medium ${
      currentPath === href
        ? "text-emerald-500 bg-emerald-50"
        : "text-gray-700 hover:text-emerald-500 hover:bg-emerald-50"
    } transition-all duration-200 ease-in-out`}
  >
    {children}
  </Link>
);

export default Navbar;
