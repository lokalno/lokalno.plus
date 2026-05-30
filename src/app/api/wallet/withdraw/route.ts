import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { validatePayoutCard, validateWithdrawalAmount } from "@/lib/wallet";

export async function POST(request: Request) {
  const session = await getServerSession(authOptions);

  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = await request.json();
    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: {
        balance: true,
        payoutCardHolder: true,
        payoutCardNumber: true,
        payoutBankName: true,
      },
    });

    if (!user) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }

    const amountCheck = validateWithdrawalAmount(user.balance, body.amount);
    if (!amountCheck.ok) {
      return NextResponse.json({ error: amountCheck.error }, { status: 400 });
    }

    let cardHolder = user.payoutCardHolder || "";
    let cardNumber = user.payoutCardNumber || "";
    let bankName = user.payoutBankName || "";

    if (body.cardHolder && body.cardNumber) {
      const cardCheck = validatePayoutCard(body.cardHolder, body.cardNumber);
      if (!cardCheck.ok) {
        return NextResponse.json({ error: cardCheck.error }, { status: 400 });
      }
      cardHolder = cardCheck.cardHolder;
      cardNumber = cardCheck.cardNumber;
      bankName =
        typeof body.bankName === "string" ? body.bankName.trim().slice(0, 100) : bankName;
    }

    if (!cardNumber) {
      return NextResponse.json(
        { error: "Додайте банківську картку для виведення коштів" },
        { status: 400 }
      );
    }

    const cardLast4 = cardNumber.slice(-4);

    const withdrawal = await prisma.$transaction(async (tx) => {
      const freshUser = await tx.user.findUnique({
        where: { id: session.user!.id },
        select: { balance: true },
      });

      if (!freshUser || freshUser.balance < amountCheck.amount) {
        throw new Error("INSUFFICIENT");
      }

      await tx.user.update({
        where: { id: session.user!.id },
        data: {
          balance: { decrement: amountCheck.amount },
          payoutCardHolder: cardHolder,
          payoutCardNumber: cardNumber,
          payoutBankName: bankName || null,
        },
      });

      const created = await tx.withdrawal.create({
        data: {
          userId: session.user!.id,
          amount: amountCheck.amount,
          cardHolder,
          cardLast4,
          cardNumber,
          bankName: bankName || null,
        },
      });

      await tx.walletTransaction.create({
        data: {
          userId: session.user!.id,
          amount: -amountCheck.amount,
          type: "WITHDRAWAL",
          description: `Заявка на виведення на картку *${cardLast4}`,
          withdrawalId: created.id,
        },
      });

      return created;
    });

    return NextResponse.json(withdrawal, { status: 201 });
  } catch (error) {
    if (error instanceof Error && error.message === "INSUFFICIENT") {
      return NextResponse.json({ error: "Недостатньо коштів на балансі" }, { status: 400 });
    }
    return NextResponse.json({ error: "Не вдалося створити заявку" }, { status: 500 });
  }
}
