"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { formatPrice } from "@/lib/utils";
import {
  canAcceptPriceOffers,
  getMaxPriceOfferAmount,
  getBuyerOfferUiState,
  validatePriceOfferAmount,
  type BuyerOfferView,
} from "@/lib/price-offers";

type BuyerOfferState = BuyerOfferView;

type ListingPriceOfferFormProps = {
  listingId: string;
  sellerId: string;
  listingPrice: number;
  isLoggedIn: boolean;
  allowPriceOffers: boolean;
  buyerOffer?: BuyerOfferState | null;
  compact?: boolean;
};

export default function ListingPriceOfferForm({
  listingId,
  sellerId,
  listingPrice,
  isLoggedIn,
  allowPriceOffers,
  buyerOffer,
  compact,
}: ListingPriceOfferFormProps) {
  const router = useRouter();
  const [amount, setAmount] = useState("");
  const [comment, setComment] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const boxClass = compact ? "max-w-sm" : "";
  const offerState = getBuyerOfferUiState(buyerOffer ?? null);

  if (!allowPriceOffers) {
    return (
      <div className={`rounded-xl border border-gray-200 bg-gray-50 p-3 ${boxClass}`}>
        <p className="text-sm font-semibold text-gray-800">Запропонувати свою ціну</p>
        <p className="mt-1 text-xs leading-relaxed text-gray-600">
          Продавець не приймає пропозиції для цього товару — ціна фіксована{" "}
          {formatPrice(listingPrice)}. Можна лише купити за цією ціною або написати в чат.
        </p>
      </div>
    );
  }

  if (!canAcceptPriceOffers(listingPrice)) {
    return (
      <div className={`rounded-xl border border-gray-200 bg-gray-50 p-3 ${boxClass}`}>
        <p className="text-sm font-semibold text-gray-800">Запропонувати свою ціну</p>
        <p className="mt-1 text-xs leading-relaxed text-gray-600">
          Для цього товару торг недоступний — ціна в оголошенні занадто низька для пропозиції.
        </p>
      </div>
    );
  }

  if (!isLoggedIn) {
    return (
      <Link
        href={`/login?callbackUrl=${encodeURIComponent(`/listings/${listingId}`)}`}
        className={`flex w-full items-center justify-center rounded-lg border border-amber-300 bg-amber-50 px-3 py-2 text-sm font-medium text-amber-900 transition hover:bg-amber-100 ${boxClass}`}
      >
        Увійти, щоб запропонувати ціну
      </Link>
    );
  }

  if (offerState === "used") {
    return (
      <div className={`rounded-xl border border-gray-200 bg-gray-50 p-3 ${boxClass}`}>
        <p className="text-sm font-semibold text-gray-800">Замовлення за погодженою ціною оформлено</p>
        <p className="mt-1 text-xs text-gray-600">
          Ви вже оформили покупку за {formatPrice(buyerOffer!.amount)}. Деталі — у розділі «Замовлення».
        </p>
      </div>
    );
  }

  if (offerState === "pending") {
    return (
      <div className={`rounded-xl border border-amber-200 bg-amber-50 p-3 ${boxClass}`}>
        <p className="text-sm font-semibold text-amber-950">Ваша пропозиція надіслана</p>
        <p className="mt-1 text-sm text-amber-900">
          {formatPrice(buyerOffer!.amount)} — очікує відповіді продавця.
        </p>
        <p className="mt-2 text-xs text-amber-800">
          Коли продавець погодиться або відхилить, ви отримаєте повідомлення в{" "}
          <Link href={`/messages?listingId=${listingId}&partnerId=${sellerId}`} className="underline">
            чаті
          </Link>
          .
        </p>
      </div>
    );
  }

  if (offerState === "accepted") {
    return (
      <div className={`rounded-xl border border-emerald-200 bg-emerald-50 p-3 ${boxClass}`}>
        <p className="text-sm font-semibold text-emerald-950">✅ Продавець погодився!</p>
        <p className="mt-1 text-sm text-emerald-900">
          Ваша ціна {formatPrice(buyerOffer!.amount)} підтверджена. Оформіть замовлення кнопкою вище
          за погодженою ціною.
        </p>
      </div>
    );
  }

  if (offerState === "rejected") {
    return (
      <div className={`rounded-xl border border-gray-200 bg-gray-50 p-3 ${boxClass}`}>
        <p className="text-sm font-semibold text-gray-900">❌ Продавець відхилив вашу пропозицію</p>
        <p className="mt-1 text-xs text-gray-600">
          Пропозиція {formatPrice(buyerOffer!.amount)} не прийнята. Можете запропонувати іншу суму
          нижче.
        </p>
        <OfferForm
          amount={amount}
          comment={comment}
          loading={loading}
          error={error}
          success={success}
          listingPrice={listingPrice}
          listingId={listingId}
          sellerId={sellerId}
          onAmountChange={setAmount}
          onCommentChange={setComment}
          onSubmit={async (e) => {
            e.preventDefault();
            setError("");
            setSuccess("");
            const amountCheck = validatePriceOfferAmount(amount, listingPrice);
            if (!amountCheck.ok) {
              setError(amountCheck.error);
              return;
            }
            setLoading(true);
            try {
              const res = await fetch(`/api/listings/${listingId}/price-offers`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                  amount: amountCheck.amount,
                  comment: comment.trim() || undefined,
                }),
              });
              const data = await res.json();
              if (!res.ok) throw new Error(data.error || "Помилка");
              setSuccess(data.message || "Пропозицію надіслано");
              setAmount("");
              setComment("");
              router.refresh();
            } catch (err) {
              setError(err instanceof Error ? err.message : "Помилка");
            } finally {
              setLoading(false);
            }
          }}
        />
      </div>
    );
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setSuccess("");

    const amountCheck = validatePriceOfferAmount(amount, listingPrice);
    if (!amountCheck.ok) {
      setError(amountCheck.error);
      return;
    }

    setLoading(true);

    try {
      const res = await fetch(`/api/listings/${listingId}/price-offers`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          amount: amountCheck.amount,
          comment: comment.trim() || undefined,
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Помилка");

      setSuccess(data.message || "Пропозицію надіслано");
      setAmount("");
      setComment("");
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Помилка");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className={`rounded-xl border border-amber-200 bg-amber-50/80 p-3 ${boxClass}`}>
      <OfferForm
        amount={amount}
        comment={comment}
        loading={loading}
        error={error}
        success={success}
        listingPrice={listingPrice}
        listingId={listingId}
        sellerId={sellerId}
        onAmountChange={setAmount}
        onCommentChange={setComment}
        onSubmit={handleSubmit}
      />
    </div>
  );
}

function OfferForm({
  amount,
  comment,
  loading,
  error,
  success,
  listingPrice,
  listingId,
  sellerId,
  onAmountChange,
  onCommentChange,
  onSubmit,
}: {
  amount: string;
  comment: string;
  loading: boolean;
  error: string;
  success: string;
  listingPrice: number;
  listingId: string;
  sellerId: string;
  onAmountChange: (value: string) => void;
  onCommentChange: (value: string) => void;
  onSubmit: (e: React.FormEvent) => void;
}) {
  const maxOffer = getMaxPriceOfferAmount(listingPrice);

  return (
    <>
      <div className="mb-2">
        <p className="text-sm font-semibold text-amber-950">Запропонувати свою ціну</p>
        <p className="mt-0.5 text-xs text-amber-800">
          Продавець приймає пропозиції. Оголошена ціна: {formatPrice(listingPrice)}. Ваша сума
          має бути <strong>нижчою</strong> (можна з копійками).
        </p>
      </div>

      <form onSubmit={onSubmit} className="space-y-2">
        <div>
          <label className="mb-1 block text-xs font-medium text-amber-950">
            Ваша пропозиція (₴)
          </label>
          <input
            type="number"
            min="0.01"
            max={maxOffer}
            step="0.01"
            value={amount}
            onChange={(e) => onAmountChange(e.target.value)}
            required
            placeholder={`До ${maxOffer.toFixed(2)}`}
            className="w-full rounded-lg border-amber-200 bg-white text-sm"
          />
        </div>

        <div>
          <label className="mb-1 block text-xs font-medium text-amber-950">
            Коментар (необов&apos;язково)
          </label>
          <input
            type="text"
            value={comment}
            onChange={(e) => onCommentChange(e.target.value)}
            maxLength={500}
            placeholder="Чому саме така ціна?"
            className="w-full rounded-lg border-amber-200 bg-white text-sm"
          />
        </div>

        {error && <p className="text-xs text-red-700">{error}</p>}
        {success && <p className="text-xs text-emerald-700">{success}</p>}

        <button
          type="submit"
          disabled={loading || !amount}
          className="w-full rounded-lg bg-amber-600 py-2 text-sm font-semibold text-white hover:bg-amber-700 disabled:opacity-50"
        >
          {loading ? "Надсилання..." : "Надіслати пропозицію"}
        </button>

        <p className="text-center text-[11px] text-amber-800/80">
          Продавець побачить її в розділі «Пропозиції цін» і отримає повідомлення в{" "}
          <Link href={`/messages?listingId=${listingId}&partnerId=${sellerId}`} className="underline">
            чаті
          </Link>
        </p>
      </form>
    </>
  );
}
