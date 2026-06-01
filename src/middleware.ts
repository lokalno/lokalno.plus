import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

function withNoCache(response: NextResponse) {
  response.headers.set("Cache-Control", "no-store, no-cache, must-revalidate, proxy-revalidate");
  response.headers.set("Pragma", "no-cache");
  response.headers.set("Expires", "0");
  response.headers.set("Surrogate-Control", "no-store");
  return response;
}

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  if (pathname === "/profile/orders") {
    const url = request.nextUrl.clone();
    url.pathname = "/orders";
    return withNoCache(NextResponse.redirect(url, 308));
  }

  return withNoCache(NextResponse.next());
}
export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|robots.txt|sitemap.xml|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico)$).*)",
  ],
};
