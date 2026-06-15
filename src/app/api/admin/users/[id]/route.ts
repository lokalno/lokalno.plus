import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions, requireAdmin } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { deleteUserAccount } from "@/lib/admin-delete-user";

type Params = { params: Promise<{ id: string }> };

export async function DELETE(_request: Request, { params }: Params) {
  const session = await getServerSession(authOptions);
  const { id } = await params;

  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const isAdmin = await requireAdmin(session.user.id);
  if (!isAdmin) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  if (id === session.user.id) {
    return NextResponse.json({ error: "Не можна видалити власний профіль" }, { status: 400 });
  }

  try {
    const target = await prisma.user.findUnique({ where: { id } });

    if (!target) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }

    if (target.role === "ADMIN") {
      return NextResponse.json({ error: "Не можна видалити адміністратора" }, { status: 400 });
    }

    await deleteUserAccount(id);

    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ error: "Delete failed" }, { status: 500 });
  }
}

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
    const target = await prisma.user.findUnique({ where: { id } });

    if (!target) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }

    if (target.role === "ADMIN") {
      return NextResponse.json({ error: "Не можна блокувати адміна" }, { status: 400 });
    }

    if (body.action === "block_purchases") {
      const user = await prisma.user.update({
        where: { id },
        data: {
          buyerPurchasesBlocked: true,
          buyerPurchasesBlockedReason:
            typeof body.buyerPurchasesBlockedReason === "string" &&
            body.buyerPurchasesBlockedReason.trim()
              ? body.buyerPurchasesBlockedReason.trim()
              : "Обмежено адміністратором",
        },
        select: {
          id: true,
          buyerPurchasesBlocked: true,
          buyerPurchasesBlockedUntil: true,
          buyerPurchasesBlockedReason: true,
        },
      });
      return NextResponse.json(user);
    }

    if (body.action === "unblock_purchases") {
      const user = await prisma.user.update({
        where: { id },
        data: {
          buyerPurchasesBlocked: false,
          buyerPurchasesBlockedUntil: null,
          buyerPurchasesBlockedReason: null,
        },
        select: {
          id: true,
          buyerPurchasesBlocked: true,
          buyerPurchasesBlockedUntil: true,
          buyerPurchasesBlockedReason: true,
        },
      });
      return NextResponse.json(user);
    }

    const user = await prisma.user.update({
      where: { id },
      data: {
        ...(body.banned !== undefined ? { banned: Boolean(body.banned) } : {}),
        ...(body.bannedReason !== undefined
          ? { bannedReason: body.bannedReason?.trim() || null }
          : {}),
      },
      select: {
        id: true,
        email: true,
        name: true,
        banned: true,
        bannedReason: true,
      },
    });

    return NextResponse.json(user);
  } catch {
    return NextResponse.json({ error: "Update failed" }, { status: 500 });
  }
}
