import NextAuth from "next-auth";
import { authConfig } from "@/lib/auth.config";
import { NextResponse } from "next/server";

export const { auth } = NextAuth(authConfig);

export default auth((req) => {
  const { nextUrl } = req;
  const isLoggedIn = !!req.auth;
  const userRole = (req.auth?.user as any)?.role;

  const isAuthPage =
    nextUrl.pathname.startsWith("/login") ||
    nextUrl.pathname.startsWith("/register") ||
    nextUrl.pathname.startsWith("/forgot-password");

  const isAdminPage = nextUrl.pathname.startsWith("/admin");
  const isAdminLoginPage = nextUrl.pathname === "/admin/login";
  const isProtectedPage =
    nextUrl.pathname.startsWith("/dashboard") ||
    nextUrl.pathname.startsWith("/get-coverage");

  // Admin login page: redirect to admin dashboard if already logged in as admin
  if (isAdminLoginPage) {
    if (isLoggedIn && userRole === "ADMIN") {
      const url = new URL("/admin", req.url);
      url.search = nextUrl.search;
      return NextResponse.redirect(url);
    }
    return NextResponse.next();
  }

  // Admin pages: require ADMIN role
  if (isAdminPage) {
    if (!isLoggedIn) {
      const url = new URL("/admin/login", req.url);
      url.search = nextUrl.search;
      return NextResponse.redirect(url);
    }
    if (userRole !== "ADMIN") {
      const url = new URL("/login", req.url);
      url.search = nextUrl.search;
      return NextResponse.redirect(url);
    }
    return NextResponse.next();
  }

  // Auth pages: redirect to dashboard if already logged in
  if (isAuthPage && isLoggedIn) {
    const url = new URL("/dashboard", req.url);
    url.search = nextUrl.search;
    return NextResponse.redirect(url);
  }

  // Protected pages: require login
  if (isProtectedPage && !isLoggedIn) {
    const url = new URL("/login", req.url);
    url.search = nextUrl.search;
    return NextResponse.redirect(url);
  }

  return NextResponse.next();
});

export const config = {
  matcher: [
    "/((?!api|_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
