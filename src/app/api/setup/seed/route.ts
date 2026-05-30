import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { seedDatabase } from "@/lib/seed-database";

export async function POST(request: Request) {
  const key = request.headers.get("x-setup-key");
  const secret = process.env.NEXTAUTH_SECRET;

  if (!secret || key !== secret) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  try {
    const existing = await prisma.listing.count();
    if (existing > 0) {
      return NextResponse.json({
        ok: true,
        message: "Already seeded",
        listings: existing,
      });
    }

    const result = await seedDatabase(prisma);
    return NextResponse.json({ ok: true, ...result });
  } catch (error) {
    console.error("Seed failed:", error);
    return NextResponse.json({ error: "Seed failed" }, { status: 500 });
  }
}
