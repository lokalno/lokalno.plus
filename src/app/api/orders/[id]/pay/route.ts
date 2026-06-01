import { NextResponse } from "next/server";

type Params = { params: Promise<{ id: string }> };

/** Оплата на сайті вимкнена — лише Nova Poshta при отриманні. */
export async function POST(_request: Request, { params }: Params) {
  await params;
  return NextResponse.json(
    {
      error:
        "Оплата на сайті не використовується. Оплатіть товар на відділенні Nova Poshta при отриманні посилки.",
    },
    { status: 410 }
  );
}
