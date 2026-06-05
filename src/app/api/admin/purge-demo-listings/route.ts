import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions, requireAdmin } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { purgeDemoListings } from "@/lib/purge-demo-listings";

export async function POST() {
  const session = await getServerSession(authOptions);

  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const isAdmin = await requireAdmin(session.user.id);
  if (!isAdmin) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  try {
    const result = await purgeDemoListings(prisma);
    return NextResponse.json({ ok: true, ...result });
  } catch (error) {
    console.error("Purge demo listings failed:", error);
    return NextResponse.json({ error: "Помилка видалення" }, { status: 500 });
  }
}
