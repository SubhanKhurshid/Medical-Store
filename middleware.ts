import { NextResponse } from "next/server";
import { getToken } from "next-auth/jwt";

export async function middleware(req: any) {
  const token = await getToken({ req, secret: process.env.NEXTAUTH_SECRET });
  const { pathname } = req.nextUrl;
  if (!token) {
    if (
      pathname.startsWith("/admin") ||
      pathname.startsWith("/doctor") ||
      pathname.startsWith("/nurse") || // ye frontdesk hai
      pathname.startsWith("/pharmacist") ||
      pathname.startsWith("/frontdesk") // ye nurse hai
    ) {
      return NextResponse.redirect(new URL("/signin", req.url));
    }
  }

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
  if (pathname.startsWith("/frontdesk") && token?.role !== "frontdesk") {
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
    "/frontdesk/:path*",
  ],
};
