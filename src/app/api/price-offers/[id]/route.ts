import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import {
  formatPriceOfferAcceptedMessage,
  formatPriceOfferRejectedMessage,
} from "@/lib/price-offers";

type Params = { params: Promise<{ id: string }> };

export async function PATCH(request: Request, { params }: Params) {
  const session = await getServerSession(authOptions);
  const { id } = await params;

  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = await request.json();
    const action = body.action;

    if (action !== "accept" && action !== "reject") {
      return NextResponse.json({ error: "Невірна дія" }, { status: 400 });
    }

    const offer = await prisma.priceOffer.findUnique({
      where: { id },
      include: {
        listing: { select: { id: true, title: true, sellerId: true, status: true, stock: true } },
        buyer: { select: { id: true, name: true } },
      },
    });

    if (!offer) {
      return NextResponse.json({ error: "Пропозицію не знайдено" }, { status: 404 });
    }

    if (offer.listing.sellerId !== session.user.id) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    if (offer.status !== "PENDING") {
      return NextResponse.json({ error: "На цю пропозицію вже дано відповідь" }, { status: 400 });
    }

    if (offer.listing.status !== "ACTIVE" || offer.listing.stock < 1) {
      return NextResponse.json({ error: "Товар зараз недоступний" }, { status: 400 });
    }

    const nextStatus = action === "accept" ? "ACCEPTED" : "REJECTED";
    const messageText =
      action === "accept"
        ? formatPriceOfferAcceptedMessage(offer.amount, offer.listing.title)
        : formatPriceOfferRejectedMessage(offer.amount, offer.listing.title);

    const updated = await prisma.$transaction(async (tx) => {
      if (action === "accept") {
        await tx.priceOffer.updateMany({
          where: {
            listingId: offer.listingId,
            buyerId: offer.buyerId,
            status: "ACCEPTED",
            orderId: null,
            id: { not: offer.id },
          },
          data: {
            status: "REJECTED",
            respondedAt: new Date(),
          },
        });
      }

      const saved = await tx.priceOffer.update({
        where: { id },
        data: {
          status: nextStatus,
          respondedAt: new Date(),
          sellerRead: true,
          buyerStatusRead: false,
        },
      });

      await tx.message.create({
        data: {
          listingId: offer.listingId,
          senderId: session.user!.id,
          receiverId: offer.buyerId,
          content: messageText,
        },
      });

      return saved;
    });

    return NextResponse.json({
      ...updated,
      createdAt: updated.createdAt.toISOString(),
      respondedAt: updated.respondedAt?.toISOString() ?? null,
      message:
        action === "accept"
          ? "Пропозицію погоджено. Покупець отримає повідомлення."
          : "Пропозицію відхилено. Покупець отримає повідомлення.",
    });
  } catch {
    return NextResponse.json({ error: "Не вдалося оновити пропозицію" }, { status: 500 });
  }
}
