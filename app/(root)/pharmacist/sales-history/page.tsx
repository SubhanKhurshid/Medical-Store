"use client";
import SalesHistory from "@/components/SalesHistory";

export default function SalesHistoryPage() {
  return (
    <>
      <style jsx global>{`
        :root {
          --color-sales: hsl(var(--primary));
        }
      `}</style>
      <SalesHistory />
    </>
  );
}
