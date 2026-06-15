import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { assertNotBanned } from "@/lib/user-check";
import {
  cancelPromImportSession,
  getActivePromImportSession,
} from "@/lib/prom-import-session";
import { PROM_IMPORT_BATCH_SIZE } from "@/lib/prom-import";

export async function GET() {
  const session = await getServerSession(authOptions);

  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const activeSession = await getActivePromImportSession(session.user.id);

  return NextResponse.json({
    session: activeSession,
    limitPerBatch: PROM_IMPORT_BATCH_SIZE,
  });
}

export async function DELETE(request: Request) {
  const session = await getServerSession(authOptions);

  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const sessionId = searchParams.get("id");

  if (!sessionId) {
    return NextResponse.json({ error: "Вкажіть id сесії" }, { status: 400 });
  }

  const cancelled = await cancelPromImportSession(session.user.id, sessionId);
  if (!cancelled) {
    return NextResponse.json({ error: "Сесію не знайдено" }, { status: 404 });
  }

  return NextResponse.json({ ok: true });
}
