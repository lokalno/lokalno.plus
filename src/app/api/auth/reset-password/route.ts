import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import bcrypt from "bcryptjs";

export async function POST(request: Request) {
  const { token, password } = await request.json();

  if (!token || !password || password.length < 6) {
    return NextResponse.json({ error: "Пароль — мінімум 6 символів" }, { status: 400 });
  }

  const reset = await prisma.passwordResetToken.findUnique({ where: { token } });

  if (!reset || reset.expiresAt < new Date()) {
    return NextResponse.json({ error: "Посилання недійсне або прострочене" }, { status: 400 });
  }

  const passwordHash = await bcrypt.hash(password, 12);

  await prisma.user.update({
    where: { email: reset.email },
    data: { passwordHash },
  });

  await prisma.passwordResetToken.delete({ where: { token } });

  return NextResponse.json({ success: true });
}
