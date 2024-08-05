import { NextResponse } from "next/server";
import { getToken } from "next-auth/jwt";

export async function middleware(req: any) {
  const token = await getToken({ req, secret: process.env.NEXTAUTH_SECRET });
  const { pathname } = req.nextUrl;

  // Redirect if the user doesn't have a token and is trying to access a protected route
  if (!token) {
    if (
      pathname.startsWith("/admin") ||
      pathname.startsWith("/doctor") ||
      pathname.startsWith("/nurse") ||
      pathname.startsWith("/pharmacist")
    ) {
      return NextResponse.redirect(new URL("/signin", req.url));
    }
  }

  // Check if the user has the correct role
  if (pathname.startsWith("/admin") && token?.role !== "admin") {
    return NextResponse.redirect(new URL("/unauthorized", req.url));
  }
  if (pathname.startsWith("/doctor") && token?.role !== "doctor") {
    return NextResponse.redirect(new URL("/unauthorized", req.url));
  }
  if (pathname.startsWith("/nurse") && token?.role !== "nurse") {
    return NextResponse.redirect(new URL("/unauthorized", req.url));
  }
  if (pathname.startsWith("/pharmacist") && token?.role !== "pharmacist") {
    return NextResponse.redirect(new URL("/unauthorized", req.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    "/admin/:path*",
    "/doctor/:path*",
    "/nurse/:path*",
    "/pharmacist/:path*",
  ],
};
