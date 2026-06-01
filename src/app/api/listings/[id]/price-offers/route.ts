import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { assertNotBanned } from "@/lib/user-check";
import {
  formatPriceOfferMessage,
  validatePriceOfferAmount,
  canSubmitNewPriceOffer,
} from "@/lib/price-offers";

type Params = { params: Promise<{ id: string }> };

export async function POST(request: Request, { params }: Params) {
  const session = await getServerSession(authOptions);
  const { id: listingId } = await params;

  if (!session?.user?.id) {
    return NextResponse.json({ error: "Увійдіть, щоб надіслати пропозицію" }, { status: 401 });
  }

  const banCheck = await assertNotBanned(session.user.id);
  if (!banCheck.ok) {
    return NextResponse.json({ error: banCheck.error }, { status: 403 });
  }

  const listing = await prisma.listing.findUnique({
    where: { id: listingId },
    select: {
      id: true,
      sellerId: true,
      price: true,
      status: true,
      stock: true,
      allowPriceOffers: true,
    },
  });

  if (!listing) {
    return NextResponse.json({ error: "Оголошення не знайдено" }, { status: 404 });
  }

  if (listing.sellerId === session.user.id) {
    return NextResponse.json({ error: "Не можна надіслати пропозицію на власне оголошення" }, { status: 400 });
  }

  if (!listing.allowPriceOffers) {
    return NextResponse.json(
      { error: "Продавець не приймає пропозиції ціни для цього товару" },
      { status: 403 }
    );
  }

  if (listing.status !== "ACTIVE" || listing.stock <= 0) {
    return NextResponse.json({ error: "Товар зараз недоступний для пропозицій" }, { status: 400 });
  }

  try {
    const body = await request.json();
    const amountCheck = validatePriceOfferAmount(body.amount, listing.price);
    if (!amountCheck.ok) {
      return NextResponse.json({ error: amountCheck.error }, { status: 400 });
    }

    const comment =
      typeof body.comment === "string" && body.comment.trim()
        ? body.comment.trim().slice(0, 500)
        : null;

    const existingOffer = await prisma.priceOffer.findFirst({
      where: {
        listingId,
        buyerId: session.user.id,
      },
      orderBy: { createdAt: "desc" },
      include: {
        order: { select: { status: true } },
      },
    });

    if (
      existingOffer &&
      !canSubmitNewPriceOffer({
        id: existingOffer.id,
        amount: existingOffer.amount,
        status: existingOffer.status,
        orderId: existingOffer.orderId,
        orderStatus: existingOffer.order?.status ?? null,
      })
    ) {
      return NextResponse.json(
        { error: "У вас уже є активна пропозиція. Зачекайте відповіді продавця або напишіть у чат." },
        { status: 409 }
      );
    }

    const messageText = formatPriceOfferMessage(amountCheck.amount, listing.price, comment);

    const [offer] = await prisma.$transaction([
      prisma.priceOffer.create({
        data: {
          listingId,
          buyerId: session.user.id,
          amount: amountCheck.amount,
          comment,
        },
      }),
      prisma.message.create({
        data: {
          listingId,
          senderId: session.user.id,
          receiverId: listing.sellerId,
          content: messageText,
        },
      }),
    ]);

    return NextResponse.json(
      {
        id: offer.id,
        amount: offer.amount,
        status: offer.status,
        message: "Пропозицію надіслано продавцю",
      },
      { status: 201 }
    );
  } catch {
    return NextResponse.json({ error: "Не вдалося надіслати пропозицію" }, { status: 500 });
  }
}
