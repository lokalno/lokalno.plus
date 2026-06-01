import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET(request: Request) {
  const session = await getServerSession(authOptions);

  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const role = searchParams.get("role") || "seller";
  const userId = session.user.id;

  if (role === "buyer") {
    const offers = await prisma.priceOffer.findMany({
      where: { buyerId: userId },
      include: {
        listing: {
          select: {
            id: true,
            title: true,
            price: true,
            photos: true,
            status: true,
            sellerId: true,
            seller: { select: { name: true } },
          },
        },
      },
      orderBy: { createdAt: "desc" },
      take: 50,
    });

    return NextResponse.json(
      offers.map((offer) => ({
        ...offer,
        createdAt: offer.createdAt.toISOString(),
        respondedAt: offer.respondedAt?.toISOString() ?? null,
      }))
    );
  }

  const offers = await prisma.priceOffer.findMany({
    where: {
      listing: { sellerId: userId },
    },
    include: {
      listing: {
        select: {
          id: true,
          title: true,
          price: true,
          photos: true,
          status: true,
        },
      },
      buyer: { select: { id: true, name: true, city: true } },
    },
    orderBy: [{ status: "asc" }, { createdAt: "desc" }],
    take: 100,
  });

  return NextResponse.json(
    offers.map((offer) => ({
      ...offer,
      createdAt: offer.createdAt.toISOString(),
      respondedAt: offer.respondedAt?.toISOString() ?? null,
    }))
  );
}
