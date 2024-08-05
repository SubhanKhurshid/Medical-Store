"use client";
// app/layout.tsx
import RootLayout from "./(root)/layou"; // Adjust import path as needed
import { SessionProvider } from "next-auth/react";
import "./globals.css"; // Global CSS

export default function Layout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <SessionProvider>
        <body className="antialiased">
          <RootLayout>{children}</RootLayout>
        </body>
      </SessionProvider>
    </html>
  );
}
