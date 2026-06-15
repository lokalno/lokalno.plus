import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

const PRIVATE_ROUTE_PREFIXES = [
  "/admin",
  "/profile",
  "/orders",
  "/messages",
  "/login",
  "/register",
  "/forgot-password",
  "/reset-password",
  "/contact/tickets",
];

function withNoCache(response: NextResponse) {
  response.headers.set("Cache-Control", "no-store, no-cache, must-revalidate, proxy-revalidate");
  response.headers.set("Pragma", "no-cache");
  response.headers.set("Expires", "0");
  response.headers.set("Surrogate-Control", "no-store");
  return response;
}

function withPublicPageCache(response: NextResponse) {
  response.headers.set(
    "Cache-Control",
    "public, s-maxage=60, stale-while-revalidate=300"
  );
  return response;
}

function isPrivateRoute(pathname: string): boolean {
  if (pathname.startsWith("/api/")) return true;
  if (pathname === "/listings/new") return true;
  if (/^\/listings\/[^/]+\/edit$/.test(pathname)) return true;

  return PRIVATE_ROUTE_PREFIXES.some(
    (prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`)
  );
}

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  if (pathname === "/profile/orders") {
    const url = request.nextUrl.clone();
    url.pathname = "/orders";
    return withNoCache(NextResponse.redirect(url, 308));
  }

  if (pathname === "/profile/support") {
    const url = request.nextUrl.clone();
    url.pathname = "/contact";
    return withNoCache(NextResponse.redirect(url, 308));
  }

  if (isPrivateRoute(pathname)) {
    return withNoCache(NextResponse.next());
  }

  return withPublicPageCache(NextResponse.next());
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|robots.txt|sitemap.xml|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico)$).*)",
  ],
};
