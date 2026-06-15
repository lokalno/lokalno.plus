import { NextResponse } from "next/server";
import { APP_VERSION } from "@/lib/app-version";
import { getEmailConfigStatus } from "@/lib/email-config";

export const dynamic = "force-dynamic";

export async function GET() {
  const email = getEmailConfigStatus();

  return NextResponse.json(
    {
      ok: true,
      version: process.env.VERCEL_GIT_COMMIT_SHA?.slice(0, 7) || "local",
      upload: APP_VERSION,
      email: {
        configured: email.configured,
        from: email.from,
      },
    },
    {
      headers: {
        "Cache-Control": "no-store, no-cache, must-revalidate, proxy-revalidate",
        Pragma: "no-cache",
        Expires: "0",
      },
    }
  );
}
