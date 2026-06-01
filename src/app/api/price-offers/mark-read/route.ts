import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import {
  markBuyerPriceOfferStatusRead,
  markSellerPriceOffersRead,
} from "@/lib/notifications";

export async function PATCH(request: Request) {
  const session = await getServerSession(authOptions);

  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json().catch(() => ({}));
  const scope = body.scope === "buyer" ? "buyer" : "seller";
  const listingId = typeof body.listingId === "string" ? body.listingId : undefined;

  if (scope === "buyer") {
    await markBuyerPriceOfferStatusRead(session.user.id, listingId);
  } else {
    await markSellerPriceOffersRead(session.user.id);
  }

  return NextResponse.json({ success: true });
}
