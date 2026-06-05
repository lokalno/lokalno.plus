import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions, requireAdmin } from "@/lib/auth";
import { addSupportReply } from "@/lib/support-chat";

type Params = { params: Promise<{ id: string }> };

export async function POST(request: Request, { params }: Params) {
  const session = await getServerSession(authOptions);
  const { id } = await params;

  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = await request.json();
    const content = body.content?.trim();

    if (!content || content.length < 1) {
      return NextResponse.json({ error: "Введіть повідомлення" }, { status: 400 });
    }

    if (content.length > 5000) {
      return NextResponse.json({ error: "Повідомлення занадто довге" }, { status: 400 });
    }

    const isAdmin = await requireAdmin(session.user.id);
    const reply = await addSupportReply(id, session.user.id, isAdmin, content);

    if (!reply) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }

    return NextResponse.json({ ok: true, reply });
  } catch {
    return NextResponse.json({ error: "Помилка сервера" }, { status: 500 });
  }
}
