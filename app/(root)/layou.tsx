// app/root/layout.tsx
import Footer from "@/components/shared/Footer";
import Navbar from "@/components/shared/Navbar";
import { Toaster } from "sonner";
export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex h-screen flex-col">
      <Navbar />
      <main className="flex-1">
        {children}
        <Toaster />
      </main>
      <Footer />
    </div>
  );
}
