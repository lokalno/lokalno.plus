import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { maskCardNumber } from "@/lib/wallet";

export async function GET() {
  const session = await getServerSession(authOptions);

  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const [user, transactions, withdrawals] = await Promise.all([
    prisma.user.findUnique({
      where: { id: session.user.id },
      select: {
        balance: true,
        payoutCardHolder: true,
        payoutCardNumber: true,
        payoutBankName: true,
      },
    }),
    prisma.walletTransaction.findMany({
      where: { userId: session.user.id },
      orderBy: { createdAt: "desc" },
      take: 30,
    }),
    prisma.withdrawal.findMany({
      where: { userId: session.user.id },
      orderBy: { createdAt: "desc" },
      take: 10,
      select: {
        id: true,
        amount: true,
        status: true,
        cardLast4: true,
        createdAt: true,
      },
    }),
  ]);

  if (!user) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  return NextResponse.json({
    balance: user.balance,
    payout: {
      cardHolder: user.payoutCardHolder || "",
      cardNumber: user.payoutCardNumber ? maskCardNumber(user.payoutCardNumber) : "",
      bankName: user.payoutBankName || "",
      hasCard: Boolean(user.payoutCardNumber),
    },
    transactions,
    withdrawals,
  });
}
