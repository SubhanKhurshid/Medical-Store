"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import type React from "react";
import Image from "next/image";
import { useAuth } from "@/app/providers/AuthProvider";
import { useInventory } from "@/app/context/InventoryContext";
import { LOW_STOCK_INVALIDATED_EVENT } from "@/lib/low-stock-events";
import { EXPIRING_INVALIDATED_EVENT } from "@/lib/expiring-events";
import { Button } from "@/components/ui/button";
import { useEffect, useState } from "react";
import logo from "@/public/Ibrahim Clinic.png";
import { Separator } from "@/components/ui/separator";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Menu } from "lucide-react";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTrigger,
} from "@/components/ui/sheet";

const Sidebar = () => {
  const { user, logout } = useAuth();
  const pathname = usePathname();
  const role = user?.role;
  const router = useRouter();
  const { getLowStockItems, getExpiringItems } = useInventory();
  const [lowStockCount, setLowStockCount] = useState(0);
  const [expiringCount, setExpiringCount] = useState(0);

  useEffect(() => {
    if (role !== "pharmacist") return;
    const refreshLow = () => getLowStockItems().then((items) => setLowStockCount(items.length));
    const refreshExpiring = () => getExpiringItems().then((items) => setExpiringCount(items.length));
    const refresh = () => {
      refreshLow();
      refreshExpiring();
    };
    refresh();
    window.addEventListener(LOW_STOCK_INVALIDATED_EVENT, refreshLow);
    window.addEventListener(EXPIRING_INVALIDATED_EVENT, refreshExpiring);
    return () => {
      window.removeEventListener(LOW_STOCK_INVALIDATED_EVENT, refreshLow);
      window.removeEventListener(EXPIRING_INVALIDATED_EVENT, refreshExpiring);
    };
  }, [role, pathname, getLowStockItems, getExpiringItems]);

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
      { href: "/pharmacist/customers", label: "Customers" },
      { href: "/pharmacist/inventory-management", label: "Add Medicine" },
      { href: "/pharmacist/manufacturer-working", label: "Manufacturer" },
      { href: "/pharmacist/inventory-view", label: "View Inventory" },
      {
        href: "/pharmacist/purchase-orders/create",
        label: "Create Purchase Orders",
      },
      {
        href: "/pharmacist/purchase-orders/view",
        label: "View Purchase Orders",
      },
      {
        href: "/pharmacist/purchase-invoices",
        label: "Purchase Invoices",
      },
      {
        href: "/pharmacist/supplier-payments",
        label: "Supplier Payments",
      },
      { href: "/pharmacist/sales", label: "Sales" },
      { href: "/pharmacist/sales-history", label: "Sales History" },
      { href: "/pharmacist/history", label: "View Sales" },
      { href: "/pharmacist/reports", label: "Reports & Accounts" },
    ],
  };

  const currentNavItems = navItems[role as keyof typeof navItems] || [];

  const SidebarContent = () => (
    <div className="flex flex-col h-full overflow-hidden">
      <div className="flex shrink-0 items-center justify-center p-6 bg-white shadow-md">
        <Link href={`/${role}`}>
          <Image
            src={logo || "/placeholder.svg"}
            alt="logo"
            width={200}
            height={200}
            className="object-contain"
          />
        </Link>
      </div>
      <div className="flex min-h-0 flex-1 flex-col overflow-hidden bg-gradient-to-b from-red-600 to-red-800 pt-6 text-white">
        <Separator className="mb-4 shrink-0 bg-red-400" />
        <ScrollArea className="flex-1 px-4">
          <div className="space-y-2">
            {currentNavItems.map((item) => {
              const attentionCount = lowStockCount + expiringCount;
              const showBadge =
                role === "pharmacist" &&
                attentionCount > 0 &&
                (item.href === "/pharmacist" ||
                  item.href === "/pharmacist/purchase-orders/create");
              return (
                <NavLink
                  key={item.href}
                  href={item.href}
                  currentPath={pathname}
                  {...(showBadge ? { badge: attentionCount } : {})}
                >
                  {item.label}
                </NavLink>
              );
            })}
          </div>
        </ScrollArea>
      </div>
    </div>
  );

  return (
    <>
      <aside className="fixed inset-y-0 left-0 z-50 hidden h-screen flex-col overflow-hidden lg:flex lg:w-64">
        <SidebarContent />
      </aside>
      <div className="lg:hidden ">
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
  badge,
}: {
  href: string;
  currentPath: string;
  children: React.ReactNode;
  badge?: number;
}) => (
  <Link
    href={href}
    className={`flex items-center justify-between px-4 py-2 rounded-md text-sm font-medium ${currentPath === href
      ? "text-red-800 bg-white"
      : "text-white hover:text-red-800 hover:bg-red-100"
      } transition-all duration-200 ease-in-out`}
  >
    <span>{children}</span>
    {badge !== undefined && badge > 0 && (
      <span className="flex h-5 min-w-[20px] items-center justify-center rounded-full bg-red-500 px-1.5 text-xs font-bold text-white animate-pulse">
        {badge}
      </span>
    )}
  </Link>
);

export default Sidebar;
