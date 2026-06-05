import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { autoCancelStaleOrders } from "@/lib/order-cancel-service";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const authHeader = request.headers.get("authorization");
  const cronSecret = process.env.CRON_SECRET;

  if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const cancelled = await autoCancelStaleOrders(prisma);

  return NextResponse.json({ ok: true, cancelled });
}
