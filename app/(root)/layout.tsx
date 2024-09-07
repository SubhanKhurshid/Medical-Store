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
      <div className="flex h-screen flex-col">
        <Navbar /> {/* Navbar is rendered only once here */}
        <main className="flex-1">
          {children}
          <Toaster />
        </main>
        <Footer />
      </div>
    </AuthProvider>
  );
}
