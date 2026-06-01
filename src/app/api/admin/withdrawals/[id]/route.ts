import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions, requireAdmin } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { maskCardNumber } from "@/lib/wallet";

type Params = { params: Promise<{ id: string }> };

function sanitizeWithdrawal<T extends { cardNumber: string }>(row: T) {
  const { cardNumber, ...rest } = row;
  return { ...rest, cardLast4: cardNumber.slice(-4), cardMasked: maskCardNumber(cardNumber) };
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

  const withdrawal = await prisma.withdrawal.findUnique({ where: { id } });
  if (!withdrawal) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  if (withdrawal.status !== "PENDING") {
    return NextResponse.json({ error: "Заявку вже оброблено" }, { status: 400 });
  }

  const body = await request.json();
  const nextStatus = body.status;
  const adminNote = typeof body.adminNote === "string" ? body.adminNote.trim() : "";

  if (nextStatus !== "COMPLETED" && nextStatus !== "REJECTED") {
    return NextResponse.json({ error: "Невірний статус" }, { status: 400 });
  }

  if (nextStatus === "REJECTED") {
    const updated = await prisma.$transaction(async (tx) => {
      const result = await tx.withdrawal.update({
        where: { id },
        data: {
          status: "REJECTED",
          adminNote: adminNote || "Відхилено адміністратором",
          processedAt: new Date(),
        },
      });

      await tx.user.update({
        where: { id: withdrawal.userId },
        data: { balance: { increment: withdrawal.amount } },
      });

      await tx.walletTransaction.create({
        data: {
          userId: withdrawal.userId,
          amount: withdrawal.amount,
          type: "WITHDRAWAL_REFUND",
          description: `Повернення на баланс (виведення відхилено)`,
          withdrawalId: withdrawal.id,
        },
      });

      return result;
    });

    return NextResponse.json(sanitizeWithdrawal(updated));
  }

  const updated = await prisma.withdrawal.update({
    where: { id },
    data: {
      status: "COMPLETED",
      adminNote: adminNote || "Переказ виконано",
      processedAt: new Date(),
    },
  });

  return NextResponse.json(sanitizeWithdrawal(updated));
}