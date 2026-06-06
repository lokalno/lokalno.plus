import { NextResponse } from "next/server";
import { randomBytes } from "crypto";
import { prisma } from "@/lib/prisma";
import { getSiteSettings } from "@/lib/site-settings";
import { sendPasswordResetEmail } from "@/lib/password-reset-email";

const GENERIC_MESSAGE =
  "Якщо email зареєстровано на сайті, ми надіслали посилання для скидання пароля.";

export async function POST(request: Request) {
  const { email } = await request.json();
  if (!email) {
    return NextResponse.json({ error: "Введіть email" }, { status: 400 });
  }

  const normalized = email.toLowerCase().trim();
  const user = await prisma.user.findUnique({ where: { email: normalized } });

  if (!user) {
    return NextResponse.json({ message: GENERIC_MESSAGE });
  }

  const token = randomBytes(32).toString("hex");
  const expiresAt = new Date(Date.now() + 60 * 60 * 1000);

  await prisma.passwordResetToken.deleteMany({ where: { email: normalized } });
  await prisma.passwordResetToken.create({
    data: { email: normalized, token, expiresAt },
  });

  const baseUrl = process.env.NEXTAUTH_URL || "http://localhost:3000";
  const resetUrl = `${baseUrl.replace(/\/$/, "")}/reset-password?token=${token}`;
  const settings = await getSiteSettings();

  const sent = await sendPasswordResetEmail({
    to: normalized,
    resetUrl,
    siteName: settings.siteName,
  });

  if (!sent.ok) {
    console.error("[forgot-password] email failed:", sent.error, "for", normalized);
    if (process.env.NODE_ENV === "development") {
      console.info("[forgot-password] reset link (dev):", resetUrl);
    }
  }

  return NextResponse.json({ message: GENERIC_MESSAGE });
}
