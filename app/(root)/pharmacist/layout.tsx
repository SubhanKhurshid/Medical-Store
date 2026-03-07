"use client";

import { LowStockReminderBanner } from "@/components/LowStockReminderBanner";
import { ExpiringSoonBanner } from "@/components/ExpiringSoonBanner";

export default function PharmacistLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <>
      <LowStockReminderBanner />
      <ExpiringSoonBanner />
      {children}
    </>
  );
}
