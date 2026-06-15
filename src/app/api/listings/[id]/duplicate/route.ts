import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { assertNotBanned, getInitialListingStatus } from "@/lib/user-check";
import { buildDuplicateListingData } from "@/lib/duplicate-listing";

type Params = { params: Promise<{ id: string }> };

export async function POST(_request: Request, { params }: Params) {
  const session = await getServerSession(authOptions);
  const { id } = await params;

  if (!session?.user?.id) {
    return NextResponse.json({ error: "Увійдіть, щоб дублювати оголошення" }, { status: 401 });
  }

  const banCheck = await assertNotBanned(session.user.id);
  if (!banCheck.ok) {
    return NextResponse.json({ error: banCheck.error }, { status: 403 });
  }

  const listing = await prisma.listing.findUnique({ where: { id } });

  if (!listing) {
    return NextResponse.json({ error: "Оголошення не знайдено" }, { status: 404 });
  }

  if (listing.sellerId !== session.user.id) {
    return NextResponse.json({ error: "Можна дублювати лише власні оголошення" }, { status: 403 });
  }

  try {
    const initialStatus = await getInitialListingStatus();
    const duplicate = await prisma.listing.create({
      data: buildDuplicateListingData(listing, session.user.id, initialStatus),
      select: { id: true },
    });

    return NextResponse.json({ id: duplicate.id }, { status: 201 });
  } catch {
    return NextResponse.json({ error: "Не вдалося створити копію оголошення" }, { status: 500 });
  }
}
