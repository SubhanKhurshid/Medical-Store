// app/(auth)/layout.tsx
import { AuthProvider } from "@/app/providers/AuthProvider";
import { Toaster } from "sonner";

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <AuthProvider>
      {" "}
      {/* Wrap only the Auth pages in AuthProvider */}
      <Toaster richColors /> {/* Add Toaster component here */}
      <div className="min-h-screen flex items-center justify-center">
        {children}
      </div>
    </AuthProvider>
  );
}
