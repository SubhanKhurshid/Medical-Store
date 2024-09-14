import Footer from "@/components/shared/Footer";
import Navbar from "@/components/shared/Navbar";
import { Toaster } from "sonner";
import { AuthProvider } from "@/app/providers/AuthProvider"; // Import AuthProvider

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <AuthProvider> {/* Wrap everything inside AuthProvider */}
      <Toaster richColors /> {/* Add Toaster component here */}
      <div className="flex h-screen flex-col">
        <Navbar />
        <main className="flex-1">
          {children}
        </main>
        <Footer />
      </div>
    </AuthProvider>
  );
}
