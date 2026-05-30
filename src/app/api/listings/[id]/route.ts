import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions, requireAdmin } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { validateListingPhotos, hasListingPhotos } from "@/lib/listing-photos";
import { parsePhotos } from "@/lib/utils";

type Params = { params: Promise<{ id: string }> };

export async function GET(_request: Request, { params }: Params) {
  const { id } = await params;

  const listing = await prisma.listing.findUnique({
    where: { id },
    include: {
      seller: {
        select: { id: true, name: true, city: true, avatar: true, createdAt: true },
      },
    },
  });

  if (!listing) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  return NextResponse.json(listing);
}

export async function PATCH(request: Request, { params }: Params) {
  const session = await getServerSession(authOptions);
  const { id } = await params;

  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const listing = await prisma.listing.findUnique({ where: { id } });

  if (!listing) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const isAdmin = await requireAdmin(session.user.id);
  if (listing.sellerId !== session.user.id && !isAdmin) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  try {
    const body = await request.json();

    if (body.photos !== undefined) {
      const photosCheck = validateListingPhotos(body.photos);
      if (!photosCheck.ok) {
        return NextResponse.json({ error: photosCheck.error }, { status: 400 });
      }
      body.photos = photosCheck.photos;
    }

    if (body.status !== undefined) {
      const nextStatus = body.status;
      if (nextStatus === "ACTIVE" && !hasListingPhotos(listing.photos)) {
        const updatedPhotos =
          body.photos !== undefined ? body.photos : parsePhotos(listing.photos);
        if (!Array.isArray(updatedPhotos) || updatedPhotos.length === 0) {
          return NextResponse.json(
            { error: "Неможливо опублікувати оголошення без фото" },
            { status: 400 }
          );
        }
      }
    }

    const updated = await prisma.listing.update({
      where: { id },
      data: {
        ...(body.title !== undefined ? { title: body.title.trim() } : {}),
        ...(body.description !== undefined ? { description: body.description.trim() } : {}),
        ...(body.price !== undefined ? { price: Number(body.price) } : {}),
        ...(body.category !== undefined ? { category: body.category } : {}),
        ...(body.condition !== undefined ? { condition: body.condition } : {}),
        ...(body.city !== undefined ? { city: body.city } : {}),
        ...(body.status !== undefined ? { status: body.status } : {}),
        ...(body.photos !== undefined ? { photos: JSON.stringify(body.photos) } : {}),
      },
    });

    return NextResponse.json(updated);
  } catch {
    return NextResponse.json({ error: "Update failed" }, { status: 500 });
  }
}

export async function DELETE(_request: Request, { params }: Params) {
  const session = await getServerSession(authOptions);
  const { id } = await params;

  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const listing = await prisma.listing.findUnique({ where: { id } });

  if (!listing) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const isAdmin = await requireAdmin(session.user.id);
  if (listing.sellerId !== session.user.id && !isAdmin) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  await prisma.listing.delete({ where: { id } });
  return NextResponse.json({ success: true });
}
