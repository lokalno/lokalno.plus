"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { formatPrice, formatDate, parsePhotos } from "@/lib/utils";
import { PRICE_OFFER_STATUS_LABELS } from "@/lib/price-offers";
import { dispatchNotificationRefresh } from "@/components/HeaderNotifications";

export type SellerPriceOfferItem = {
  id: string;
  amount: number;
  comment: string | null;
  status: string;
  createdAt: string;
  respondedAt: string | null;
  listing: {
    id: string;
    title: string;
    price: number;
    photos: string;
    status: string;
  };
  buyer: {
    id: string;
    name: string;
    city: string;
  };
};

type SellerPriceOffersPanelProps = {
  initialOffers: SellerPriceOfferItem[];
};

export default function SellerPriceOffersPanel({ initialOffers }: SellerPriceOffersPanelProps) {
  const router = useRouter();
  const [offers, setOffers] = useState(initialOffers);
  const [loadingId, setLoadingId] = useState<string | null>(null);
  const [error, setError] = useState("");

  const pending = offers.filter((offer) => offer.status === "PENDING");

  async function respond(offerId: string, action: "accept" | "reject") {
    setLoadingId(offerId);
    setError("");

    try {
      const res = await fetch(`/api/price-offers/${offerId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Помилка");

      setOffers((current) =>
        current.map((offer) =>
          offer.id === offerId
            ? {
                ...offer,
                status: action === "accept" ? "ACCEPTED" : "REJECTED",
                respondedAt: new Date().toISOString(),
              }
            : offer
        )
      );
      router.refresh();
      dispatchNotificationRefresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Помилка");
    } finally {
      setLoadingId(null);
    }
  }

  return (
    <div className="space-y-6">
      {error && (
        <div className="rounded-xl bg-red-50 px-4 py-3 text-sm text-red-700">{error}</div>
      )}

      {pending.length > 0 && (
        <section className="rounded-2xl border border-amber-200 bg-amber-50/60 p-5">
          <h2 className="text-lg font-bold text-amber-950">
            Нові пропозиції ({pending.length})
          </h2>
          <p className="mt-1 text-sm text-amber-900">
            Клієнт запропонував свою ціну — погодьте або відхиліть. Покупець отримає повідомлення.
          </p>
          <div className="mt-4 space-y-3">
            {pending.map((offer) => (
              <OfferCard
                key={offer.id}
                offer={offer}
                loading={loadingId === offer.id}
                onAccept={() => respond(offer.id, "accept")}
                onReject={() => respond(offer.id, "reject")}
              />
            ))}
          </div>
        </section>
      )}

      <section>
        <h2 className="mb-3 text-lg font-bold text-gray-900">Історія пропозицій</h2>
        {offers.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-gray-200 bg-gray-50 p-10 text-center text-gray-500">
            Пропозицій цін поки немає. Увімкніть галочку «Дозволити покупцям пропонувати свою
            ціну» в оголошенні.
          </div>
        ) : (
          <div className="space-y-3">
            {offers
              .filter((offer) => offer.status !== "PENDING")
              .map((offer) => (
                <OfferCard key={offer.id} offer={offer} />
              ))}
            {offers.filter((offer) => offer.status !== "PENDING").length === 0 && pending.length > 0 && (
              <p className="text-sm text-gray-500">Оброблені пропозиції з&apos;являться тут.</p>
            )}
          </div>
        )}
      </section>
    </div>
  );
}

function OfferCard({
  offer,
  loading,
  onAccept,
  onReject,
}: {
  offer: SellerPriceOfferItem;
  loading?: boolean;
  onAccept?: () => void;
  onReject?: () => void;
}) {
  const photos = parsePhotos(offer.listing.photos);
  const statusLabel = PRICE_OFFER_STATUS_LABELS[offer.status] || offer.status;

  return (
    <div className="flex flex-col gap-4 rounded-xl border bg-white p-4 sm:flex-row">
      <div className="h-20 w-20 shrink-0 overflow-hidden rounded-lg bg-gray-100">
        {photos[0] ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={photos[0]} alt="" className="h-full w-full object-cover" />
        ) : (
          <div className="flex h-full w-full items-center justify-center text-2xl">📦</div>
        )}
      </div>

      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-start justify-between gap-2">
          <div>
            <Link
              href={`/listings/${offer.listing.id}`}
              className="font-semibold text-gray-900 hover:text-brand-700"
            >
              {offer.listing.title}
            </Link>
            <p className="mt-1 text-sm text-gray-600">
              {offer.buyer.name}
              {offer.buyer.city ? ` · ${offer.buyer.city}` : ""}
            </p>
          </div>
          <span
            className={`rounded-full px-2.5 py-0.5 text-xs font-semibold ${
              offer.status === "PENDING"
                ? "bg-amber-100 text-amber-800"
                : offer.status === "ACCEPTED" || offer.status === "USED"
                  ? "bg-emerald-100 text-emerald-800"
                  : "bg-gray-100 text-gray-700"
            }`}
          >
            {statusLabel}
          </span>
        </div>

        <div className="mt-3 flex flex-wrap items-end gap-3">
          <div>
            <p className="text-xs text-gray-500">Пропозиція клієнта</p>
            <p className="text-xl font-bold text-brand-700">{formatPrice(offer.amount)}</p>
          </div>
          <div>
            <p className="text-xs text-gray-500">Ціна в оголошенні</p>
            <p className="text-sm font-medium text-gray-700">{formatPrice(offer.listing.price)}</p>
          </div>
        </div>

        {offer.comment && (
          <p className="mt-2 rounded-lg bg-gray-50 px-3 py-2 text-sm text-gray-700">
            «{offer.comment}»
          </p>
        )}

        <p className="mt-2 text-xs text-gray-400">
          {formatDate(offer.createdAt)}
          {offer.respondedAt ? ` · відповідь ${formatDate(offer.respondedAt)}` : ""}
        </p>

        {offer.status === "PENDING" && onAccept && onReject && (
          <div className="mt-4 flex flex-wrap gap-2">
            <button
              type="button"
              disabled={loading}
              onClick={onAccept}
              className="rounded-lg bg-emerald-600 px-4 py-2 text-sm font-semibold text-white hover:bg-emerald-700 disabled:opacity-50"
            >
              {loading ? "..." : "Погодити ціну"}
            </button>
            <button
              type="button"
              disabled={loading}
              onClick={onReject}
              className="rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50"
            >
              Відхилити
            </button>
            <Link
              href={`/messages?listingId=${offer.listing.id}&partnerId=${offer.buyer.id}`}
              className="rounded-lg border border-brand-200 px-4 py-2 text-sm font-medium text-brand-700 hover:bg-brand-50"
            >
              Написати клієнту
            </Link>
          </div>
        )}
      </div>
    </div>
  );
}
