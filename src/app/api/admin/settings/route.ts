import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions, requireAdmin } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const settings = await prisma.siteSettings.findUnique({ where: { id: 1 } });
  return NextResponse.json(settings);
}

export async function PATCH(request: Request) {
  const session = await getServerSession(authOptions);

  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const isAdmin = await requireAdmin(session.user.id);
  if (!isAdmin) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  try {
    const body = await request.json();

    const settings = await prisma.siteSettings.upsert({
      where: { id: 1 },
      update: {
        ...(body.siteName !== undefined ? { siteName: body.siteName.trim() } : {}),
        ...(body.tagline !== undefined ? { tagline: body.tagline.trim() } : {}),
        ...(body.logoUrl !== undefined ? { logoUrl: body.logoUrl } : {}),
        ...(body.supportEmail !== undefined ? { supportEmail: body.supportEmail.trim() } : {}),
        ...(body.rulesContent !== undefined ? { rulesContent: body.rulesContent } : {}),
        ...(body.privacyContent !== undefined ? { privacyContent: body.privacyContent } : {}),
        ...(body.preModeration !== undefined ? { preModeration: Boolean(body.preModeration) } : {}),
      },
      create: {
        id: 1,
        siteName: body.siteName?.trim() || "Локально",
        tagline: body.tagline?.trim() || "",
        logoUrl: body.logoUrl || null,
        supportEmail: body.supportEmail?.trim() || "support@lokalno.ua",
      },
    });

    return NextResponse.json(settings);
  } catch {
    return NextResponse.json({ error: "Update failed" }, { status: 500 });
  }
}
