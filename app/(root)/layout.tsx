"use client"
import Footer from "@/components/shared/Footer";
import { Toaster } from "sonner";
import { AuthProvider } from "@/app/providers/AuthProvider";
import { InventoryProvider } from "../context/InventoryContext";
import Sidebar from "@/components/Sidebar";
import Navbar from "@/components/shared/Navbar";

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <AuthProvider>
      <InventoryProvider>
        <Toaster richColors />
        <div className="flex min-h-screen bg-gray-50">
          {/* Sidebar: zero width on mobile so the fixed bar doesn't block touches on the left; hamburger opens sheet */}
          <div className="fixed inset-y-0 left-0 z-50 w-0 lg:w-64">
            <Sidebar />
          </div>
          {/* Main content area */}
          <div className="flex-1 flex flex-col min-w-0 lg:pl-64">
            {/* Navbar */}
            <Navbar />
            <main className="flex-1 p-6">{children}</main>
            <Footer />
          </div>
        </div>
      </InventoryProvider>
    </AuthProvider>
  );
}