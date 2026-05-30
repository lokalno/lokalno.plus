import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function POST(request: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const { orderId, rating, comment } = await request.json();

    if (!orderId || !rating || rating < 1 || rating > 5) {
      return NextResponse.json({ error: "Оцінка від 1 до 5" }, { status: 400 });
    }

    const order = await prisma.order.findUnique({ where: { id: orderId } });

    if (!order || order.buyerId !== session.user.id) {
      return NextResponse.json({ error: "Замовлення не знайдено" }, { status: 404 });
    }

    if (order.status !== "COMPLETED") {
      return NextResponse.json({ error: "Оцінити можна лише завершене замовлення" }, { status: 400 });
    }

    const existing = await prisma.review.findUnique({ where: { orderId } });
    if (existing) {
      return NextResponse.json({ error: "Ви вже залишили відгук" }, { status: 400 });
    }

    const review = await prisma.review.create({
      data: {
        orderId,
        listingId: order.listingId,
        reviewerId: session.user.id,
        sellerId: order.sellerId,
        rating: Number(rating),
        comment: comment?.trim() || null,
      },
    });

    return NextResponse.json(review, { status: 201 });
  } catch {
    return NextResponse.json({ error: "Помилка" }, { status: 500 });
  }
}
