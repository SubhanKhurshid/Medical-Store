"use client";

import { LowStockReminderBanner } from "@/components/LowStockReminderBanner";
import { ExpiringSoonBanner } from "@/components/ExpiringSoonBanner";
import { usePathname } from "next/navigation";

export default function PharmacistLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const showDashBanners = pathname === "/pharmacist";

  return (
    <>
      {showDashBanners && (
        <>
          <LowStockReminderBanner />
          <ExpiringSoonBanner />
        </>
      )}
      {children}
    </>
  );
}
