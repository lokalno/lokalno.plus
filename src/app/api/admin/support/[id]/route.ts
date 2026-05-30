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

  try {
    const body = await request.json();
    const status = body.status?.trim();
    const adminNote = body.adminNote?.trim();

    const data: { status?: string; adminNote?: string } = {};
    if (status === "OPEN" || status === "RESOLVED") data.status = status;
    if (adminNote !== undefined) data.adminNote = adminNote || null;

    await prisma.supportTicket.update({
      where: { id },
      data,
    });

    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }
}
