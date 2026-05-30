import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
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

  if (status === "CANCELLED" && order.status !== "CANCELLED" && order.status !== "COMPLETED") {
    const updated = await prisma.$transaction(async (tx) => {
      const currentOrder = await tx.order.update({
        where: { id },
        data: { status: "CANCELLED" },
      });

      const listing = await tx.listing.findUnique({ where: { id: order.listingId } });
      if (listing) {
        const newStock = listing.stock + 1;
        await tx.listing.update({
          where: { id: order.listingId },
          data: {
            stock: newStock,
            ...(listing.status === "SOLD" ? { status: "ACTIVE" } : {}),
          },
        });
      }

      return currentOrder;
    });

    return NextResponse.json(updated);
  }

  const updated = await prisma.order.update({
    where: { id },
    data: { status },
  });

  return NextResponse.json(updated);
}
