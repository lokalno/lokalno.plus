import { NextResponse } from "next/server";
import { searchSettlements } from "@/lib/settlements";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const q = searchParams.get("q") || "";
  const limit = Math.min(Number(searchParams.get("limit") || 25), 50);

  try {
    const results = searchSettlements(q, limit);
    return NextResponse.json(results);
  } catch {
    return NextResponse.json({ error: "Не вдалося завантажити населені пункти" }, { status: 500 });
  }
}
