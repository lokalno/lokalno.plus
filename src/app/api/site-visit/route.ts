import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { prisma } from "@/lib/prisma";
import {
  VISITOR_COOKIE,
  VISITOR_COOKIE_MAX_AGE,
  createVisitorId,
  isLikelyBot,
  normalizeVisitorId,
  recordSiteVisit,
  shouldTrackSiteTraffic,
} from "@/lib/site-traffic";

export async function POST(request: Request) {
  if (!shouldTrackSiteTraffic()) {
    return NextResponse.json({ ok: true, skipped: true });
  }

  const userAgent = request.headers.get("user-agent");
  if (isLikelyBot(userAgent)) {
    return NextResponse.json({ ok: true, skipped: true });
  }

  try {
    const cookieStore = await cookies();
    let visitorId = normalizeVisitorId(cookieStore.get(VISITOR_COOKIE)?.value);
    if (!visitorId) {
      visitorId = createVisitorId();
    }

    const stats = await recordSiteVisit(prisma, visitorId);

    const response = NextResponse.json({ ok: true, ...stats });
    response.cookies.set(VISITOR_COOKIE, visitorId, {
      maxAge: VISITOR_COOKIE_MAX_AGE,
      path: "/",
      sameSite: "lax",
      secure: true,
      httpOnly: true,
    });
    return response;
  } catch {
    return NextResponse.json({ ok: false }, { status: 503 });
  }
}
