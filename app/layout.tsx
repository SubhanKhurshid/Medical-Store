// app/layout.tsx
import "./globals.css";

export default function Layout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className="antialiased">
        <div id="app-root">{children}</div>
      </body>
    </html>
  );
}
