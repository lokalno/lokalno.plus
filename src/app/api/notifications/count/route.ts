import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { getNotificationCounts } from "@/lib/notifications";

export async function GET() {
  const session = await getServerSession(authOptions);

  if (!session?.user?.id) {
    return NextResponse.json({
      unreadMessages: 0,
      unreadPriceOffers: 0,
      total: 0,
    });
  }

  const counts = await getNotificationCounts(session.user.id);
  return NextResponse.json(counts);
}
