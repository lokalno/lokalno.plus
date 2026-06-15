import Link from "next/link";
import { formatDate } from "@/lib/utils";
import {
  formatBuyerPurchasesBlockedMessage,
  getBuyerOrderStats,
  getBuyerPurchaseBlockSnapshot,
} from "@/lib/buyer-purchase-protection";

type BuyerPurchaseStatusNoticeProps = {
  userId: string;
  listingCount?: number;
};

export default async function BuyerPurchaseStatusNotice({
  userId,
  listingCount = 0,
}: BuyerPurchaseStatusNoticeProps) {
  const [blockSnapshot, stats] = await Promise.all([
    getBuyerPurchaseBlockSnapshot(userId),
    getBuyerOrderStats(userId),
  ]);

  if (stats.notReceived === 0 && !blockSnapshot.blocked) {
    return null;
  }

  const isSeller = listingCount > 0;

  return (
    <div
      className={`rounded-xl border p-4 text-sm ${
        blockSnapshot.blocked
          ? "border-red-200 bg-red-50 text-red-900"
          : "border-amber-200 bg-amber-50 text-amber-950"
      }`}
    >
      <p className="font-semibold">Статус покупця</p>
      {isSeller && (
        <p className="mt-1 text-xs opacity-90">
          Обмеження стосується лише ролі покупця. Ваші оголошення та продажі працюють як
          раніше.
        </p>
      )}

      <div className="mt-3 grid grid-cols-2 gap-2 text-xs sm:grid-cols-4">
        <div className="rounded-lg bg-white/70 px-2 py-1.5">
          <p className="text-gray-500">Всього покупок</p>
          <p className="font-semibold">{stats.total}</p>
        </div>
        <div className="rounded-lg bg-white/70 px-2 py-1.5">
          <p className="text-gray-500">Отримано</p>
          <p className="font-semibold">{stats.completed}</p>
        </div>
        <div className="rounded-lg bg-white/70 px-2 py-1.5">
          <p className="text-gray-500">Не отримано</p>
          <p className="font-semibold">{stats.notReceived}</p>
        </div>
        <div className="rounded-lg bg-white/70 px-2 py-1.5">
          <p className="text-gray-500">Скасовано</p>
          <p className="font-semibold">{stats.cancelled}</p>
        </div>
      </div>

      {blockSnapshot.blocked ? (
        <p className="mt-3">{formatBuyerPurchasesBlockedMessage(blockSnapshot)}</p>
      ) : stats.notReceived > 0 ? (
        <p className="mt-3">
          У вас {stats.notReceived} неотриманих посилок. Якщо це повториться, оформлення нових
          покупок може бути обмежено.
        </p>
      ) : null}

      {blockSnapshot.blockedUntil && (
        <p className="mt-1 text-xs">До: {formatDate(blockSnapshot.blockedUntil)}</p>
      )}

      <Link href="/contact" className="mt-3 inline-block text-xs font-medium underline">
        Звернутися в підтримку →
      </Link>
    </div>
  );
}
