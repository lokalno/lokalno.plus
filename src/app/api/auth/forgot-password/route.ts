import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { randomBytes } from "crypto";

export async function POST(request: Request) {
  const { email } = await request.json();
  if (!email) {
    return NextResponse.json({ error: "Введіть email" }, { status: 400 });
  }

  const normalized = email.toLowerCase().trim();
  const user = await prisma.user.findUnique({ where: { email: normalized } });

  if (!user) {
    return NextResponse.json({
      message: "Якщо email існує, інструкції надіслано",
    });
  }

  const token = randomBytes(32).toString("hex");
  const expiresAt = new Date(Date.now() + 60 * 60 * 1000);

  await prisma.passwordResetToken.deleteMany({ where: { email: normalized } });
  await prisma.passwordResetToken.create({
    data: { email: normalized, token, expiresAt },
  });

  const resetUrl = `${process.env.NEXTAUTH_URL || "http://localhost:3000"}/reset-password?token=${token}`;

  if (process.env.NODE_ENV === "development") {
    console.info("[forgot-password] reset link created for", normalized);
  }

  return NextResponse.json({
    message: "Якщо email існує, інструкції надіслано на пошту",
  });
}
