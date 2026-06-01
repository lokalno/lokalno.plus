import { NextResponse } from "next/server";
import { APP_VERSION } from "@/lib/app-version";

export const dynamic = "force-dynamic";

export async function GET() {
  return NextResponse.json(
    {
      ok: true,
      version: process.env.VERCEL_GIT_COMMIT_SHA?.slice(0, 7) || "local",
      upload: APP_VERSION,
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
