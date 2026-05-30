import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions, requireAdmin } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

type Params = { params: Promise<{ id: string }> };

export async function PATCH(request: Request, { params }: Params) {
  const session = await getServerSession(authOptions);
  const { id } = await params;

  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const isAdmin = await requireAdmin(session.user.id);
  if (!isAdmin) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { status, hideListing } = await request.json();

  const report = await prisma.report.update({
    where: { id },
    data: { status: status || "RESOLVED" },
    include: { listing: true },
  });

  if (hideListing) {
    await prisma.listing.update({
      where: { id: report.listingId },
      data: { status: "HIDDEN" },
    });
  }

  return NextResponse.json(report);
}
