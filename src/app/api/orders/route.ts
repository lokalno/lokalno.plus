import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { validateOrderShipping } from "@/lib/order-shipping";

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

  try {
    const body = await request.json();
    const { listingId } = body;

    if (!listingId || typeof listingId !== "string") {
      return NextResponse.json({ error: "Невірне оголошення" }, { status: 400 });
    }

    const shippingCheck = validateOrderShipping(body);
    if (!shippingCheck.ok) {
      return NextResponse.json({ error: shippingCheck.error }, { status: 400 });
    }

    const listing = await prisma.listing.findUnique({
      where: { id: listingId },
    });

    if (!listing || listing.status !== "ACTIVE") {
      return NextResponse.json({ error: "Оголошення недоступне для покупки" }, { status: 400 });
    }

    if (listing.sellerId === session.user.id) {
      return NextResponse.json({ error: "Не можна купити власне оголошення" }, { status: 400 });
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

    const order = await prisma.order.create({
      data: {
        listingId,
        buyerId: session.user.id,
        sellerId: listing.sellerId,
        ...shippingCheck.data,
      },
    });

    return NextResponse.json(order, { status: 201 });
  } catch {
    return NextResponse.json({ error: "Не вдалося створити замовлення" }, { status: 500 });
  }
}
