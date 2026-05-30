import { redirect } from "next/navigation";
import Link from "next/link";
import { getServerSession } from "next-auth";
import { authOptions, requireAdmin } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { formatPrice, formatDate } from "@/lib/utils";
import { WITHDRAWAL_STATUSES, maskCardNumber } from "@/lib/wallet";
import AdminWithdrawalActions from "@/components/AdminWithdrawalActions";

export default async function AdminWithdrawalsPage() {
  const session = await getServerSession(authOptions);

  if (!session?.user?.id) redirect("/login");

  const isAdmin = await requireAdmin(session.user.id);
  if (!isAdmin) redirect("/");

  const withdrawals = await prisma.withdrawal.findMany({
    include: {
      user: { select: { name: true, email: true } },
    },
    orderBy: { createdAt: "desc" },
  });

  const pendingCount = withdrawals.filter((w) => w.status === "PENDING").length;

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      <Link href="/admin" className="text-sm text-gray-500 hover:text-brand-700 mb-4 inline-block">
        ← Назад до адмінки
      </Link>

      <h1 className="text-2xl font-bold mb-2">Виведення коштів</h1>
      {pendingCount > 0 && (
        <p className="text-amber-700 mb-6">{pendingCount} заявок очікують переказу</p>
      )}

      {withdrawals.length === 0 ? (
        <div className="bg-white rounded-xl border p-8 text-center text-gray-500">
          Заявок на виведення поки немає
        </div>
      ) : (
        <div className="space-y-3">
          {withdrawals.map((item) => (
            <div
              key={item.id}
              className={`bg-white rounded-xl border p-4 ${
                item.status === "PENDING" ? "border-amber-300 bg-amber-50/40" : ""
              }`}
            >
              <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
                <div>
                  <p className="font-semibold text-lg">{formatPrice(item.amount)}</p>
                  <p className="text-sm text-gray-600 mt-1">
                    {item.user.name} · {item.user.email}
                  </p>
                  <p className="text-sm text-gray-500 mt-1">
                    {item.cardHolder} · {maskCardNumber(item.cardNumber)}
                    {item.bankName ? ` · ${item.bankName}` : ""}
                  </p>
                  <p className="text-xs text-gray-400 mt-1">
                    {WITHDRAWAL_STATUSES[item.status] || item.status} · {formatDate(item.createdAt)}
                  </p>
                  {item.adminNote && (
                    <p className="text-xs text-gray-500 mt-1">Примітка: {item.adminNote}</p>
                  )}
                </div>
                {item.status === "PENDING" && <AdminWithdrawalActions withdrawalId={item.id} />}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
