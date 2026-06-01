import Link from "next/link";
import UserAvatar from "@/components/UserAvatar";
import NovaPoshtaMark from "@/components/NovaPoshtaMark";
import {
  formatMemberSinceFull,
  formatStars,
  formatCompletedOrdersLabel,
  getRatingLabel,
  SELLER_LEVEL_LABELS,
  type SellerLevel,
} from "@/lib/seller-stats";

type ListingSellerPanelProps = {
  seller: {
    id: string;
    name: string;
    city: string;
    avatar: string | null;
    createdAt: Date;
  };
  reviewCount: number;
  avgRating: number | null;
  positiveReviewPercent: number | null;
  responseTimeLabel: string;
  completedOrdersCount: number;
  sellerLevel: SellerLevel;
  otherListingsCount: number;
};

function TrustStat({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-start justify-between gap-3 border-b border-gray-200/80 pb-2 last:border-b-0 last:pb-0">
      <dt className="text-xs text-gray-500">{label}</dt>
      <dd className="text-right text-xs font-semibold text-gray-900">{value}</dd>
    </div>
  );
}

export default function ListingSellerPanel({
  seller,
  reviewCount,
  avgRating,
  positiveReviewPercent,
  responseTimeLabel,
  completedOrdersCount,
  sellerLevel,
  otherListingsCount,
}: ListingSellerPanelProps) {
  return (
    <aside className="h-fit w-full rounded-2xl border border-gray-200 bg-white p-4 shadow-sm lg:sticky lg:top-24">
      <p className="mb-3 text-xs font-semibold uppercase tracking-wide text-gray-500">Продавець</p>

      <Link href={`/sellers/${seller.id}`} className="group flex items-start gap-3">
        <UserAvatar name={seller.name} avatar={seller.avatar} size="md" />
        <div className="min-w-0">
          <p className="truncate font-semibold text-gray-900 group-hover:text-brand-700">
            {seller.name}
          </p>
          {avgRating !== null ? (
            <>
              <p className="mt-1 text-sm leading-none text-yellow-500">{formatStars(avgRating)}</p>
              <p className="mt-1 text-xs text-gray-600">
                {avgRating.toFixed(1)} · {getRatingLabel(reviewCount)}
              </p>
            </>
          ) : (
            <p className="mt-1 text-xs text-gray-500">{getRatingLabel(reviewCount)}</p>
          )}
        </div>
      </Link>

      <div className="mt-4 rounded-xl bg-gray-50 p-3">
        <p className="text-xs font-semibold uppercase tracking-wide text-gray-500">
          Довіра до продавця
        </p>
        {positiveReviewPercent !== null ? (
          <p className="mt-1 text-2xl font-bold text-emerald-600">{positiveReviewPercent}%</p>
        ) : (
          <p className="mt-1 text-sm font-medium text-gray-600">Ще формується</p>
        )}
        {positiveReviewPercent !== null && (
          <p className="text-[11px] text-gray-500">позитивних відгуків</p>
        )}

        <dl className="mt-3 space-y-2.5">
          <TrustStat
            label="Рейтинг"
            value={avgRating !== null ? avgRating.toFixed(1) : "—"}
          />
          <TrustStat label="Відгуки" value={getRatingLabel(reviewCount)} />
          <TrustStat label="Час відповіді" value={responseTimeLabel} />
          <TrustStat
            label="Дата реєстрації"
            value={formatMemberSinceFull(seller.createdAt)}
          />
          <TrustStat
            label="Виконано замовлень"
            value={formatCompletedOrdersLabel(completedOrdersCount)}
          />
        </dl>

        <p className="mt-3 border-t border-gray-200 pt-2 text-[11px] text-gray-500">
          {SELLER_LEVEL_LABELS[sellerLevel]}
        </p>
      </div>

      <Link
        href={`/sellers/${seller.id}?tab=listings`}
        className="mt-4 flex w-full items-center justify-center rounded-lg border border-brand-600 bg-brand-50 px-3 py-2 text-sm font-semibold text-brand-800 transition hover:bg-brand-100"
      >
        {otherListingsCount > 0
          ? `Інші оголошення (${otherListingsCount})`
          : "Інші оголошення продавця"}
      </Link>

      <div className="mt-3 rounded-xl border border-red-100 bg-gradient-to-br from-red-50/80 to-white p-3 shadow-sm">
        <div className="flex items-center gap-3">
          <NovaPoshtaMark />
          <div>
            <p className="text-sm font-semibold leading-tight text-gray-900">Доставка</p>
            <p className="text-sm font-bold leading-tight text-[#ED1C24]">Nova Poshta</p>
          </div>
        </div>
        <p className="mt-2.5 border-t border-red-100 pt-2 text-xs text-gray-600">
          Орієнтовна доставка 2–3 дні
        </p>
      </div>
    </aside>
  );
}
