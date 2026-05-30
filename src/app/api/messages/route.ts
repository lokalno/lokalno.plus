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
  const listingId = searchParams.get("listingId");
  const partnerId = searchParams.get("partnerId");
  const userId = session.user.id;
  const inThread = Boolean(listingId && partnerId);

  if (inThread) {
    await prisma.message.updateMany({
      where: {
        receiverId: userId,
        senderId: partnerId!,
        listingId: listingId!,
        read: false,
      },
      data: { read: true },
    });
  }

  const messages = await prisma.message.findMany({
    where: {
      AND: [
        { OR: [{ senderId: userId }, { receiverId: userId }] },
        ...(listingId ? [{ listingId }] : []),
        ...(inThread
          ? [
              {
                OR: [
                  { senderId: userId, receiverId: partnerId! },
                  { senderId: partnerId!, receiverId: userId },
                ],
              },
            ]
          : []),
      ],
    },
    include: {
      sender: { select: { id: true, name: true } },
      receiver: { select: { id: true, name: true } },
      listing: { select: { id: true, title: true } },
    },
    orderBy: { createdAt: "asc" },
  });

  return NextResponse.json(
    messages.map((m) => ({
      ...m,
      createdAt: m.createdAt.toISOString(),
    }))
  );
}

export async function POST(request: Request) {
  const session = await getServerSession(authOptions);

  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const { listingId, receiverId, content } = await request.json();

    if (!listingId || !receiverId || !content?.trim()) {
      return NextResponse.json({ error: "Missing fields" }, { status: 400 });
    }

    if (receiverId === session.user.id) {
      return NextResponse.json({ error: "Cannot message yourself" }, { status: 400 });
    }

    const listing = await prisma.listing.findUnique({
      where: { id: listingId },
      select: { sellerId: true, title: true },
    });

    if (!listing) {
      return NextResponse.json({ error: "Listing not found" }, { status: 404 });
    }

    const isSeller = session.user.id === listing.sellerId;
    const receiverIsSeller = receiverId === listing.sellerId;

    if (!isSeller && !receiverIsSeller) {
      return NextResponse.json({ error: "Invalid recipient" }, { status: 400 });
    }

    const message = await prisma.message.create({
      data: {
        listingId,
        senderId: session.user.id,
        receiverId,
        content: content.trim(),
      },
      include: {
        sender: { select: { id: true, name: true } },
        receiver: { select: { id: true, name: true } },
      },
    });

    return NextResponse.json(
      {
        ...message,
        createdAt: message.createdAt.toISOString(),
        listing: { id: listingId, title: listing.title },
      },
      { status: 201 }
    );
  } catch {
    return NextResponse.json({ error: "Send failed" }, { status: 500 });
  }
}
