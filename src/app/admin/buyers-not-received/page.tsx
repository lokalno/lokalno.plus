import Link from "next/link";
import { redirect } from "next/navigation";
import { getServerSession } from "next-auth";
import { authOptions, requireAdmin } from "@/lib/auth";
import { formatDate } from "@/lib/utils";
import AdminBuyerPurchaseActions from "@/components/AdminBuyerPurchaseActions";
import { getAdminBuyersNotReceivedRows } from "@/lib/admin-buyers-not-received";

export const dynamic = "force-dynamic";

export default async function AdminBuyersNotReceivedPage() {
  const session = await getServerSession(authOptions);

  if (!session?.user?.id) redirect("/login");

  const isAdmin = await requireAdmin(session.user.id);
  if (!isAdmin) redirect("/");

  const buyers = await getAdminBuyersNotReceivedRows();

  return (
    <div className="mx-auto max-w-5xl px-4 py-8">
      <Link href="/admin" className="mb-4 inline-block text-sm text-gray-500 hover:text-brand-700">
        ← Назад до адмінки
      </Link>

      <h1 className="mb-2 text-2xl font-bold">Покупці з неотриманими замовленнями</h1>
      <p className="mb-6 text-sm text-gray-500">
        Статистика замовлень, попередження для продавців і обмеження нових покупок без блокування
        акаунта. Правила однакові для всіх покупців, включно з продавцями, які самі купують
        товари.
      </p>

      {buyers.length === 0 ? (
        <div className="rounded-xl border border-dashed border-gray-300 bg-white p-10 text-center text-gray-500">
          Покупців з неотриманими замовленнями поки немає.
        </div>
      ) : (
        <div className="space-y-4">
          {buyers.map((buyer) => (
            <div
              key={buyer.id}
              className={`rounded-xl border bg-white p-4 ${
                buyer.purchasesBlockedNow ? "border-red-200 bg-red-50/20" : "border-gray-200"
              }`}
            >
              <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                <div className="min-w-0 flex-1">
                  <p className="font-medium text-gray-900">{buyer.name}</p>
                  <p className="text-sm text-gray-500">
                    {buyer.email} · {buyer.city}
                    {buyer.listingCount > 0 && (
                      <span className="ml-2 rounded bg-violet-100 px-1.5 py-0.5 text-xs text-violet-800">
                        Продавець · {buyer.listingCount} оголош.
                      </span>
                    )}
                  </p>

                  <div className="mt-3 grid grid-cols-2 gap-2 text-sm sm:grid-cols-4">
                    <div className="rounded-lg bg-gray-50 px-3 py-2">
                      <p className="text-xs text-gray-500">Всього замовлень</p>
                      <p className="font-semibold text-gray-900">{buyer.stats.total}</p>
                    </div>
                    <div className="rounded-lg bg-emerald-50 px-3 py-2">
                      <p className="text-xs text-emerald-700">Отримано</p>
                      <p className="font-semibold text-emerald-900">{buyer.stats.completed}</p>
                    </div>
                    <div className="rounded-lg bg-amber-50 px-3 py-2">
                      <p className="text-xs text-amber-700">Не отримано</p>
                      <p className="font-semibold text-amber-900">{buyer.stats.notReceived}</p>
                    </div>
                    <div className="rounded-lg bg-gray-50 px-3 py-2">
                      <p className="text-xs text-gray-500">Скасовано</p>
                      <p className="font-semibold text-gray-900">{buyer.stats.cancelled}</p>
                    </div>
                  </div>

                  <p className="mt-3 text-sm text-gray-700">
                    Неотримані (лічильник):{" "}
                    <span className="font-semibold">{buyer.buyerNotReceivedCount}</span>
                  </p>

                  {buyer.purchasesBlockedNow && (
                    <div className="mt-2 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-800">
                      <p className="font-medium">Покупки обмежено</p>
                      {buyer.buyerPurchasesBlockedUntil && (
                        <p className="mt-1">
                          До: {formatDate(buyer.buyerPurchasesBlockedUntil)}
                        </p>
                      )}
                      {buyer.buyerPurchasesBlockedReason && (
                        <p className="mt-1">{buyer.buyerPurchasesBlockedReason}</p>
                      )}
                    </div>
                  )}
                </div>

                <AdminBuyerPurchaseActions
                  userId={buyer.id}
                  purchasesBlocked={buyer.purchasesBlockedNow}
                />
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
