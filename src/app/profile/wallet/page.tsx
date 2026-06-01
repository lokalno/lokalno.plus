import { redirect } from "next/navigation";
import Link from "next/link";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import WalletPanel from "@/components/WalletPanel";
import { SELLER_NP_COD_NOTICE } from "@/lib/order-payment";

export default async function WalletPage() {
  const session = await getServerSession(authOptions);

  if (!session?.user?.id) {
    redirect("/login");
  }

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      <div className="flex flex-wrap items-center justify-between gap-3 mb-6">
        <h1 className="text-2xl font-bold">Оплата та кошти</h1>
        <Link href="/profile" className="text-sm text-brand-700 hover:underline">
          ← Мій профіль
        </Link>
      </div>

      <div className="mb-6 rounded-xl border border-blue-200 bg-blue-50 p-4 text-sm text-blue-950">
        <p className="font-semibold">Оплата через Nova Poshta</p>
        <p className="mt-2">{SELLER_NP_COD_NOTICE}</p>
        <p className="mt-2 text-blue-900/80">
          На сайті lokalno.plus гроші не приймаються і не зберігаються для нових замовлень.
        </p>
        <Link href="/orders" className="mt-3 inline-block font-medium text-brand-700 hover:underline">
          Перейти до замовлень →
        </Link>
      </div>

      <WalletPanel legacyOnly />
    </div>
  );
}
