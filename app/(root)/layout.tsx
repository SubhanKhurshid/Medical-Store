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
          {/* Sidebar */}
          <div className="fixed inset-y-0 z-50 w-64 lg:w-80"> {/* Added width for responsiveness */}
            <Sidebar />
          </div>
          {/* Main content area */}
          <div className="flex-1 flex flex-col lg:pl-64">
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