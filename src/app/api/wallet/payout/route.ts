import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { validatePayoutCard } from "@/lib/wallet";

export async function PATCH(request: Request) {
  const session = await getServerSession(authOptions);

  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = await request.json();
    const cardCheck = validatePayoutCard(body.cardHolder, body.cardNumber);

    if (!cardCheck.ok) {
      return NextResponse.json({ error: cardCheck.error }, { status: 400 });
    }

    const bankName =
      typeof body.bankName === "string" ? body.bankName.trim().slice(0, 100) : "";

    const user = await prisma.user.update({
      where: { id: session.user.id },
      data: {
        payoutCardHolder: cardCheck.cardHolder,
        payoutCardNumber: cardCheck.cardNumber,
        payoutBankName: bankName || null,
      },
      select: {
        payoutCardHolder: true,
        payoutBankName: true,
      },
    });

    return NextResponse.json({
      ok: true,
      payout: {
        cardHolder: user.payoutCardHolder,
        cardLast4: cardCheck.cardLast4,
        bankName: user.payoutBankName || "",
      },
    });
  } catch {
    return NextResponse.json({ error: "Не вдалося зберегти картку" }, { status: 500 });
  }
}
