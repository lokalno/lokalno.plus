import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { assertNotBanned } from "@/lib/user-check";
import { validateOrderShipping } from "@/lib/order-shipping";
import { parseOrderQuantity } from "@/lib/order-total";

export async function GET() {
  const session = await getServerSession(authOptions);

  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const orders = await prisma.order.findMany({
    where: {
      OR: [{ buyerId: session.user.id }, { sellerId: session.user.id }],
    },
    include: {
      listing: { select: { id: true, title: true, photos: true, price: true } },
      buyer: { select: { id: true, name: true } },
      seller: { select: { id: true, name: true } },
    },
    orderBy: { createdAt: "desc" },
  });

  return NextResponse.json(orders);
}

export async function POST(request: Request) {
  const session = await getServerSession(authOptions);

  if (!session?.user?.id) {
    return NextResponse.json({ error: "Увійдіть, щоб оформити замовлення" }, { status: 401 });
  }

  const banCheck = await assertNotBanned(session.user.id);
  if (!banCheck.ok) {
    return NextResponse.json({ error: banCheck.error }, { status: 403 });
  }

  try {
    const body = await request.json();
    const { listingId, priceOfferId } = body;

    if (!listingId || typeof listingId !== "string") {
      return NextResponse.json({ error: "Невірне оголошення" }, { status: 400 });
    }

    const shippingCheck = validateOrderShipping(body);
    if (!shippingCheck.ok) {
      return NextResponse.json({ error: shippingCheck.error }, { status: 400 });
    }

    const existingPending = await prisma.order.findFirst({
      where: {
        listingId,
        buyerId: session.user.id,
        status: { in: ["PENDING", "CONFIRMED"] },
      },
    });

    if (existingPending) {
      return NextResponse.json(
        { error: "У вас уже є активне замовлення на цей товар. Перевірте розділ «Замовлення»." },
        { status: 400 }
      );
    }

    const order = await prisma.$transaction(async (tx) => {
      const listing = await tx.listing.findUnique({
        where: { id: listingId },
      });

      if (!listing || listing.status !== "ACTIVE") {
        throw new Error("UNAVAILABLE");
      }

      if (listing.sellerId === session.user!.id) {
        throw new Error("OWN_LISTING");
      }

      if (listing.stock < 1) {
        throw new Error("OUT_OF_STOCK");
      }

      const quantityCheck = parseOrderQuantity(body.quantity ?? 1, listing.stock);
      if (!quantityCheck.ok) {
        throw new Error(`QTY:${quantityCheck.error}`);
      }

      const { quantity } = quantityCheck;
      const newStock = listing.stock - quantity;

      let unitPrice: number | undefined;
      let linkedOfferId: string | undefined;

      if (typeof priceOfferId === "string" && priceOfferId.trim()) {
        const offer = await tx.priceOffer.findUnique({
          where: { id: priceOfferId.trim() },
        });

        if (
          !offer ||
          offer.listingId !== listingId ||
          offer.buyerId !== session.user!.id ||
          offer.status !== "ACCEPTED" ||
          offer.orderId
        ) {
          throw new Error("INVALID_OFFER");
        }

        unitPrice = offer.amount;
        linkedOfferId = offer.id;
      }

      await tx.listing.update({
        where: { id: listingId },
        data: {
          stock: newStock,
          ...(newStock === 0 ? { status: "SOLD" } : {}),
        },
      });

      const createdOrder = await tx.order.create({
        data: {
          listingId,
          buyerId: session.user!.id,
          sellerId: listing.sellerId,
          quantity,
          ...(unitPrice !== undefined ? { unitPrice } : {}),
          ...(linkedOfferId ? { priceOfferId: linkedOfferId } : {}),
          ...shippingCheck.data,
        },
      });

      if (linkedOfferId) {
        await tx.priceOffer.update({
          where: { id: linkedOfferId },
          data: { orderId: createdOrder.id, status: "USED" },
        });
      }

      return createdOrder;
    });

    return NextResponse.json(order, { status: 201 });
  } catch (error) {
    const message = error instanceof Error ? error.message : "";
    if (message === "OUT_OF_STOCK") {
      return NextResponse.json({ error: "Товар відсутній на складі" }, { status: 400 });
    }
    if (message === "OWN_LISTING") {
      return NextResponse.json({ error: "Не можна купити власне оголошення" }, { status: 400 });
    }
    if (message === "UNAVAILABLE") {
      return NextResponse.json({ error: "Оголошення недоступне для покупки" }, { status: 400 });
    }
    if (message.startsWith("QTY:")) {
      return NextResponse.json({ error: message.slice(4) }, { status: 400 });
    }
    if (message === "INVALID_OFFER") {
      return NextResponse.json(
        { error: "Погоджена ціна недоступна. Перевірте пропозицію на сторінці товару." },
        { status: 400 }
      );
    }
    return NextResponse.json({ error: "Не вдалося створити замовлення" }, { status: 500 });
  }
}
