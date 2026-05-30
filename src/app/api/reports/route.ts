import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { REPORT_REASONS } from "@/lib/constants";

export async function POST(request: Request) {
  const session = await getServerSession(authOptions);

  if (!session?.user?.id) {
    return NextResponse.json({ error: "Увійдіть, щоб поскаржитися" }, { status: 401 });
  }

  try {
    const { listingId, reason, comment } = await request.json();

    if (!listingId || !reason) {
      return NextResponse.json({ error: "Заповніть обов'язкові поля" }, { status: 400 });
    }

    if (!(REPORT_REASONS as readonly string[]).includes(reason)) {
      return NextResponse.json({ error: "Невірна причина" }, { status: 400 });
    }

    const listing = await prisma.listing.findUnique({ where: { id: listingId } });

    if (!listing) {
      return NextResponse.json({ error: "Оголошення не знайдено" }, { status: 404 });
    }

    if (listing.sellerId === session.user.id) {
      return NextResponse.json({ error: "Не можна скаржитися на своє оголошення" }, { status: 400 });
    }

    const existing = await prisma.report.findFirst({
      where: {
        listingId,
        reporterId: session.user.id,
        status: "PENDING",
      },
    });

    if (existing) {
      return NextResponse.json({ error: "Ви вже надіслали скаргу на це оголошення" }, { status: 400 });
    }

    const report = await prisma.report.create({
      data: {
        listingId,
        reporterId: session.user.id,
        reason,
        comment: comment?.trim() || null,
      },
    });

    return NextResponse.json(report, { status: 201 });
  } catch {
    return NextResponse.json({ error: "Помилка надсилання" }, { status: 500 });
  }
}
