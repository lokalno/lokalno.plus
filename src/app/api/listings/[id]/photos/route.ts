import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions, requireAdmin } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { countBrokenPhotos } from "@/lib/listing-photos";
import { parsePhotos } from "@/lib/utils";

type Params = { params: Promise<{ id: string }> };

export async function GET(_request: Request, { params }: Params) {
  const session = await getServerSession(authOptions);
  const { id } = await params;

  const listing = await prisma.listing.findUnique({
    where: { id },
    select: { photos: true, sellerId: true, status: true },
  });

  if (!listing) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const isOwner = session?.user?.id === listing.sellerId;
  const isAdmin = session?.user?.id ? await requireAdmin(session.user.id) : false;

  if (listing.status === "PENDING" && !isOwner && !isAdmin) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const photos = parsePhotos(listing.photos);

  return NextResponse.json({
    photos,
    count: photos.length,
    brokenCount: countBrokenPhotos(photos),
  });
}
