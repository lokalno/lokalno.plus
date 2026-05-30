import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions, requireAdmin } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

type Params = { params: Promise<{ id: string }> };

export async function PATCH(request: Request, { params }: Params) {
  const session = await getServerSession(authOptions);
  const { id } = await params;

  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const order = await prisma.order.findUnique({ where: { id } });

  if (!order) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const isParticipant =
    order.buyerId === session.user.id || order.sellerId === session.user.id;

  if (!isParticipant) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { status } = await request.json();

  const updated = await prisma.order.update({
    where: { id },
    data: { status },
  });

  if (status === "COMPLETED") {
    await prisma.listing.update({
      where: { id: order.listingId },
      data: { status: "SOLD" },
    });
  }

  return NextResponse.json(updated);
}
