import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

type Params = { params: Promise<{ id: string }> };

export async function POST(_request: Request, { params }: Params) {
  const { id } = await params;
  const session = await getServerSession(authOptions);

  const listing = await prisma.listing.findUnique({ where: { id } });

  if (!listing) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  if (listing.status !== "ACTIVE") {
    return NextResponse.json({ views: listing.views });
  }

  if (session?.user?.id === listing.sellerId) {
    return NextResponse.json({ views: listing.views });
  }

  const updated = await prisma.listing.update({
    where: { id },
    data: { views: { increment: 1 } },
    select: { views: true },
  });

  return NextResponse.json(updated);
}
