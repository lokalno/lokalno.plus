import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

export async function GET() {
  return NextResponse.json({
    ok: true,
    version: process.env.VERCEL_GIT_COMMIT_SHA?.slice(0, 7) || "local",
    upload: "v12-favorite-count",
  });
}
