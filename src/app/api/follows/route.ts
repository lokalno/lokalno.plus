import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const follows = await prisma.sellerFollow.findMany({
    where: { followerId: session.user.id },
    include: {
      seller: {
        select: {
          id: true,
          name: true,
          city: true,
          avatar: true,
          _count: { select: { followers: true, listings: { where: { status: "ACTIVE" } } } },
        },
      },
    },
    orderBy: { createdAt: "desc" },
  });

  return NextResponse.json(
    follows.map((f) => ({
      ...f.seller,
      followerCount: f.seller._count.followers,
      activeListings: f.seller._count.listings,
    }))
  );
}

export async function POST(request: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { sellerId } = await request.json();
  if (!sellerId) {
    return NextResponse.json({ error: "Missing sellerId" }, { status: 400 });
  }

  if (sellerId === session.user.id) {
    return NextResponse.json({ error: "Cannot follow yourself" }, { status: 400 });
  }

  const seller = await prisma.user.findUnique({ where: { id: sellerId } });
  if (!seller || seller.banned) {
    return NextResponse.json({ error: "Seller not found" }, { status: 404 });
  }

  const existing = await prisma.sellerFollow.findUnique({
    where: { followerId_sellerId: { followerId: session.user.id, sellerId } },
  });

  if (existing) {
    await prisma.sellerFollow.delete({ where: { id: existing.id } });
    const followerCount = await prisma.sellerFollow.count({ where: { sellerId } });
    return NextResponse.json({ following: false, followerCount });
  }

  await prisma.sellerFollow.create({
    data: { followerId: session.user.id, sellerId },
  });

  const followerCount = await prisma.sellerFollow.count({ where: { sellerId } });
  return NextResponse.json({ following: true, followerCount });
}
