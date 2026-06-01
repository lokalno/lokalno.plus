import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { creditSellerForPaidOrder } from "@/lib/wallet-credit";

type Params = { params: Promise<{ id: string }> };

export async function POST(_request: Request, { params }: Params) {
  const session = await getServerSession(authOptions);
  const { id } = await params;

  if (!session?.user?.id) {
    return NextResponse.json({ error: "Увійдіть, щоб оплатити" }, { status: 401 });
  }

  const order = await prisma.order.findUnique({
    where: { id },
    include: { listing: { select: { price: true, title: true } } },
  });

  if (!order) {
    return NextResponse.json({ error: "Замовлення не знайдено" }, { status: 404 });
  }

  if (order.buyerId !== session.user.id) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  if (order.paymentStatus === "PAID") {
    return NextResponse.json({ error: "Замовлення вже оплачено" }, { status: 400 });
  }

  if (order.status === "CANCELLED") {
    return NextResponse.json({ error: "Замовлення скасовано" }, { status: 400 });
  }

  if (process.env.NODE_ENV === "production" && process.env.ENABLE_MOCK_PAYMENT !== "true") {
    return NextResponse.json(
      { error: "Оплата тимчасово недоступна. Зверніться до продавця." },
      { status: 503 }
    );
  }

  try {
    await prisma.$transaction(async (tx) => {
      await creditSellerForPaidOrder(tx, id);
    });

    return NextResponse.json({ ok: true, paymentStatus: "PAID" });
  } catch (error) {
    const message = error instanceof Error ? error.message : "";
    if (message === "ALREADY_PAID") {
      return NextResponse.json({ error: "Замовлення вже оплачено" }, { status: 400 });
    }
    return NextResponse.json({ error: "Не вдалося оплатити замовлення" }, { status: 500 });
  }
}
