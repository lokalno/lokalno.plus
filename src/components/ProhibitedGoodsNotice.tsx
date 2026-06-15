import Link from "next/link";
import { PROHIBITED_SALE_CATEGORIES } from "@/lib/moderation";

export default function ProhibitedGoodsNotice() {
  return (
    <div className="rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-950">
      <p className="font-medium">Заборонено продавати:</p>
      <ul className="mt-2 list-inside list-disc space-y-0.5 text-xs leading-relaxed">
        {PROHIBITED_SALE_CATEGORIES.map((item) => (
          <li key={item}>{item}</li>
        ))}
      </ul>
      <Link href="/rules" className="mt-2 inline-block text-xs font-medium text-brand-700 hover:underline">
        Детальніше в правилах
      </Link>
    </div>
  );
}
