"use client";

import { LowStockReminderBanner } from "@/components/LowStockReminderBanner";

export default function PharmacistLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <>
      <LowStockReminderBanner />
      {children}
    </>
  );
}
