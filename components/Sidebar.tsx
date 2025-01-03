"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import React from "react";
import Image from "next/image";
import { useAuth } from "@/app/providers/AuthProvider";
import { Button } from "@/components/ui/button";
import logo from "@/public/Ibrahim Clinic.png";
import { Separator } from "@/components/ui/separator";
import { ScrollArea } from "@/components/ui/scroll-area";
import { LogOut, Menu } from "lucide-react";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";

const Sidebar = () => {
  const { user, logout } = useAuth();
  const pathname = usePathname();
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
      { href: "/pharmacist", label: "Dashboard" },
      { href: "/pharmacist/inventory-management", label: "Add Medicine" },
      { href: "/pharmacist/inventory-view", label: "View Inventory" },
      { href: "/pharmacist/sales", label: "Sales" },
      { href: "/pharmacist/sales-history", label: "Sales History" },
    ],
  };

  const currentNavItems = navItems[role as keyof typeof navItems] || [];

  const SidebarContent = () => (
    <div className="flex flex-col h-full">
      <div className="flex items-center justify-center p-6 bg-white shadow-md">
        <Link href={`/${role}`}>
          <Image
            src={logo}
            alt="logo"
            width={200}
            height={200}
            className="object-contain"
          />
        </Link>
      </div>
      <div className="flex-grow bg-gradient-to-b from-red-600 to-red-800 text-white pt-6">
        <Separator className="mb-4 bg-red-400" />
        <ScrollArea className="px-4 h-[calc(100vh-200px)]">
          <div className="space-y-2">
            {currentNavItems.map((item) => (
              <NavLink key={item.href} href={item.href} currentPath={pathname}>
                {item.label}
              </NavLink>
            ))}
          </div>
        </ScrollArea>
        {/* <Separator className="mt-4 bg-red-400" />
        <div className="p-4">
          <Button
            onClick={handleLogout}
            className="w-full bg-white text-red-600 hover:bg-red-100 transition-colors duration-200"
          >
            <LogOut className="mr-2 h-4 w-4" /> Logout
          </Button>
        </div> */}
      </div>
    </div>
  );

  return (
    <>
      <aside className="hidden lg:flex lg:flex-col lg:w-64 lg:fixed lg:inset-y-0">
        <SidebarContent />
      </aside>
      <div className="lg:hidden">
        <Sheet>
          <SheetTrigger asChild>
            <Button
              variant="outline"
              size="icon"
              className="fixed top-4 left-4 z-40 bg-white text-red-600 border-red-600 hover:bg-red-100"
            >
              <Menu className="h-6 w-6" />
            </Button>
          </SheetTrigger>
          <SheetContent side="left" className="w-64 p-0">
            <SheetHeader className="px-6 py-4 bg-white"></SheetHeader>
            <SidebarContent />
          </SheetContent>
        </Sheet>
      </div>
    </>
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
    className={`block px-4 py-2 rounded-md text-sm font-medium ${
      currentPath === href
        ? "text-red-800 bg-white"
        : "text-white hover:text-red-800 hover:bg-red-100"
    } transition-all duration-200 ease-in-out`}
  >
    {children}
  </Link>
);

export default Sidebar;
