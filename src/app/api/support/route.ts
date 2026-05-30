import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { SUPPORT_SUBJECTS } from "@/lib/constants";

export async function POST(request: Request) {
  const session = await getServerSession(authOptions);

  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = await request.json();
    const subject = body.subject?.trim();
    const message = body.message?.trim();
    const phone = body.phone?.trim() || null;

    if (!subject || !message) {
      return NextResponse.json({ error: "Заповніть тему та повідомлення" }, { status: 400 });
    }

    if (!(SUPPORT_SUBJECTS as readonly string[]).includes(subject)) {
      return NextResponse.json({ error: "Невірна тема" }, { status: 400 });
    }

    if (message.length < 10) {
      return NextResponse.json({ error: "Повідомлення занадто коротке" }, { status: 400 });
    }

    const ticket = await prisma.supportTicket.create({
      data: {
        userId: session.user.id,
        subject,
        message,
        phone,
      },
    });

    return NextResponse.json({ ok: true, id: ticket.id });
  } catch {
    return NextResponse.json({ error: "Помилка сервера" }, { status: 500 });
  }
}
