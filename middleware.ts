import { NextRequest, NextResponse } from "next/server";
import { jwtDecode } from "jwt-decode";

interface JwtPayload {
  id: string;
  user_type?: string;
  is_admin?: boolean;
  exp?: number;
}

function getTokenFromRequest(req: NextRequest): string | null {
  return req.cookies.get("token")?.value ?? null;
}

function decodeToken(token: string): JwtPayload | null {
  try {
    const payload = jwtDecode<JwtPayload>(token);
    // Reject expired tokens
    if (payload.exp && payload.exp * 1000 < Date.now()) return null;
    return payload;
  } catch {
    return null;
  }
}

export function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;
  const token = getTokenFromRequest(req);
  const payload = token ? decodeToken(token) : null;

  // Determine user type strictly from user_type field only (not legacy is_admin boolean)
  // NOTE: This is a UX redirect guard only. Real authorization is enforced by the backend API.
  const isAdmin = payload?.user_type === "admin";
  const isTeacher = payload?.user_type === "teacher" || payload?.user_type === "staff";
  const isCenter = payload?.user_type === "center" || payload?.user_type === "staff";
  const isAuthenticated = !!payload;

  // /admin/login → redirect to /admin if already logged in as admin
  if (pathname === "/admin/login") {
    if (isAdmin) return NextResponse.redirect(new URL("/admin", req.url));
    return NextResponse.next();
  }

  // /admin/* → must be admin
  if (pathname.startsWith("/admin")) {
    if (!isAuthenticated) return NextResponse.redirect(new URL("/admin/login", req.url));
    if (!isAdmin) return NextResponse.redirect(new URL("/admin/login", req.url));
    return NextResponse.next();
  }

  // /teacher/login → redirect to /teacher if already logged in as teacher or staff
  if (pathname === "/teacher/login") {
    if (isTeacher) return NextResponse.redirect(new URL("/teacher", req.url));
    return NextResponse.next();
  }

  // /teacher/* → must be teacher (or staff acting as teacher)
  if (pathname.startsWith("/teacher")) {
    if (!isAuthenticated) return NextResponse.redirect(new URL("/teacher/login", req.url));
    if (!isTeacher) return NextResponse.redirect(new URL("/teacher/login", req.url));
    return NextResponse.next();
  }

  // /center/login → redirect to /center if already logged in
  if (pathname === "/center/login") {
    if (isCenter) return NextResponse.redirect(new URL("/center", req.url));
    return NextResponse.next();
  }

  // /center/* → must be center or staff
  if (pathname.startsWith("/center")) {
    if (!isAuthenticated) return NextResponse.redirect(new URL("/center/login", req.url));
    if (!isCenter) return NextResponse.redirect(new URL("/center/login", req.url));
    return NextResponse.next();
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/admin/:path*", "/teacher/:path*", "/center/:path*"],
};
