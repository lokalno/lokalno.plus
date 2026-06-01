"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import SettlementSearch from "@/components/SettlementSearch";
import { formatPrice } from "@/lib/utils";
import { BUYER_NP_COD_NOTICE } from "@/lib/order-payment";
import { formatListingStock, getOrderQuantityHint, getStockAvailabilityLevel } from "@/lib/listing-stock";

type Settlement = {
  name: string;
  region: string;
  district: string;
  type: string;
  full: string;
};

type OrderCheckoutFormProps = {
  listingId: string;
  maxStock: number;
  unitPrice: number;
  priceOfferId?: string;
  buyLabel?: string;
  compact?: boolean;
};

export default function OrderCheckoutForm({
  listingId,
  maxStock,
  unitPrice,
  priceOfferId,
  buyLabel,
  compact = false,
}: OrderCheckoutFormProps) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [quantity, setQuantity] = useState(1);

  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [phone, setPhone] = useState("");
  const [oblast, setOblast] = useState("");
  const [raion, setRaion] = useState("");
  const [city, setCity] = useState("");
  const [warehouse, setWarehouse] = useState("");

  useEffect(() => {
    fetch("/api/profile")
      .then((res) => (res.ok ? res.json() : null))
      .then((user) => {
        if (!user) return;
        const parts = String(user.name || "")
          .trim()
          .split(/\s+/)
          .filter(Boolean);
        if (parts.length >= 2) {
          setFirstName(parts[0]);
          setLastName(parts.slice(1).join(" "));
        } else if (parts.length === 1) {
          setFirstName(parts[0]);
        }
        if (user.phone) setPhone(user.phone);
        if (user.city) setCity(user.city);
      })
      .catch(() => {});
  }, []);

  function handleSettlementSelect(settlement: Settlement) {
    setCity(settlement.full || settlement.name);
    if (settlement.region) setOblast(settlement.region);
    if (settlement.district) setRaion(settlement.district);
  }

  function changeQuantity(next: number) {
    setQuantity(Math.min(maxStock, Math.max(1, next)));
  }

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    setLoading(true);
    setError("");

    try {
      const res = await fetch("/api/orders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          listingId,
          quantity,
          ...(priceOfferId ? { priceOfferId } : {}),
          recipientFirstName: firstName,
          recipientLastName: lastName,
          recipientPhone: phone,
          deliveryOblast: oblast,
          deliveryRaion: raion,
          deliveryCity: city,
          deliveryWarehouse: warehouse,
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Помилка замовлення");

      setOpen(false);
      setQuantity(1);
      router.push("/orders?view=buyer&placed=1");
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Помилка замовлення");
    } finally {
      setLoading(false);
    }
  }

  if (!open) {
    return (
      <div>
        <button
          type="button"
          onClick={() => {
            setQuantity(1);
            setOpen(true);
          }}
          className={`w-full rounded-lg bg-brand-600 font-semibold text-white transition hover:bg-brand-700 ${
            compact ? "max-w-sm py-2 text-sm" : "py-3.5 text-base"
          }`}
        >
          {buyLabel || "Купити з доставкою"}
        </button>
      </div>
    );
  }

  const totalPrice = unitPrice * quantity;
  const stockLevel = getStockAvailabilityLevel(maxStock);
  const quantityHint = getOrderQuantityHint(maxStock, quantity);
  const isLastItem = maxStock === 1;

  return (
    <form
      onSubmit={handleSubmit}
      className="max-w-md space-y-4 rounded-xl border border-brand-200 bg-brand-50/40 p-4"
    >
      <div>
        <h3 className="font-semibold text-brand-900">Доставка Nova Poshta</h3>
        <p className="mt-1 text-xs text-gray-600">
          Заповніть дані отримувача. Продавець побачить їх у розділі «Замовлення».
        </p>
        <p className="mt-2 rounded-lg border border-blue-200 bg-blue-50 px-3 py-2 text-xs text-blue-950">
          💳 {BUYER_NP_COD_NOTICE}
        </p>
      </div>

      {error && (
        <div className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">{error}</div>
      )}

      <div>
        <label htmlFor="order-quantity" className="mb-1 block text-sm font-medium">
          Скільки штук замовити? *
        </label>

        {isLastItem ? (
          <div className="rounded-lg border border-amber-200 bg-amber-50 px-3 py-3">
            <p className="text-sm font-semibold text-amber-900">Остання штука на складі</p>
            <p className="mt-1 text-sm text-amber-800">{quantityHint}</p>
            <p className="mt-2 text-sm font-medium text-gray-900">Кількість: 1 штука</p>
          </div>
        ) : (
          <>
            <div className="flex flex-wrap items-center gap-2">
              <button
                type="button"
                onClick={() => changeQuantity(quantity - 1)}
                disabled={quantity <= 1}
                className="flex h-9 w-9 items-center justify-center rounded-lg border bg-white text-lg disabled:opacity-40"
                aria-label="Менше"
              >
                −
              </button>
              <input
                id="order-quantity"
                type="number"
                min={1}
                max={maxStock}
                value={quantity}
                onChange={(e) => changeQuantity(Number(e.target.value))}
                className="w-20 text-center"
                required
              />
              <button
                type="button"
                onClick={() => changeQuantity(quantity + 1)}
                disabled={quantity >= maxStock}
                className="flex h-9 w-9 items-center justify-center rounded-lg border bg-white text-lg disabled:opacity-40"
                aria-label="Більше"
              >
                +
              </button>
              <span className="text-sm font-medium text-gray-700">
                з {formatListingStock(maxStock)} на складі
              </span>
            </div>
            <p
              className={`mt-2 rounded-lg px-3 py-2 text-sm ${
                stockLevel === "low" || quantity >= maxStock
                  ? "border border-amber-200 bg-amber-50 text-amber-900"
                  : "border border-gray-200 bg-white text-gray-700"
              }`}
            >
              {quantityHint}
            </p>
          </>
        )}

        <p className="mt-2 text-sm font-semibold text-brand-800">
          Разом: {formatPrice(totalPrice)}
          {!isLastItem && quantity > 1 && (
            <span className="ml-1 font-normal text-gray-600">
              ({formatListingStock(quantity)} × {formatPrice(unitPrice)})
            </span>
          )}
        </p>
      </div>

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        <div>
          <label className="mb-1 block text-sm font-medium">Ім&apos;я *</label>
          <input value={firstName} onChange={(e) => setFirstName(e.target.value)} required />
        </div>
        <div>
          <label className="mb-1 block text-sm font-medium">Прізвище *</label>
          <input value={lastName} onChange={(e) => setLastName(e.target.value)} required />
        </div>
      </div>

      <div>
        <label className="mb-1 block text-sm font-medium">Телефон *</label>
        <input
          value={phone}
          onChange={(e) => setPhone(e.target.value)}
          required
          placeholder="0671234567"
          inputMode="tel"
        />
      </div>

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        <div>
          <label className="mb-1 block text-sm font-medium">Область *</label>
          <input
            value={oblast}
            onChange={(e) => setOblast(e.target.value)}
            required
            placeholder="Одеська"
          />
        </div>
        <div>
          <label className="mb-1 block text-sm font-medium">Район *</label>
          <input
            value={raion}
            onChange={(e) => setRaion(e.target.value)}
            required
            placeholder="Білгород-Дністровський"
          />
        </div>
      </div>

      <SettlementSearch
        value={city}
        onChange={setCity}
        onSelectSettlement={handleSettlementSelect}
        label="Місто / село *"
        required
        placeholder="Почніть вводити назву населеного пункту"
      />

      <div>
        <label className="mb-1 block text-sm font-medium">Відділення Nova Poshta *</label>
        <input
          value={warehouse}
          onChange={(e) => setWarehouse(e.target.value)}
          required
          placeholder="№ 1, вул. Грушевського 12 або поштомат № 12345"
        />
        <p className="mt-1 text-[11px] text-gray-500">Номер відділення, адреса або поштомат</p>
      </div>

      <div className="flex flex-col gap-2 sm:flex-row">
        <button
          type="submit"
          disabled={loading}
          className="flex-1 rounded-lg bg-brand-600 py-2.5 font-medium text-white hover:bg-brand-700 disabled:opacity-50"
        >
          {loading ? "Оформлення..." : `Замовити · ${formatPrice(totalPrice)}`}
        </button>
        <button
          type="button"
          onClick={() => setOpen(false)}
          disabled={loading}
          className="rounded-lg border bg-white px-4 py-2.5 hover:bg-gray-50 sm:w-auto"
        >
          Скасувати
        </button>
      </div>
    </form>
  );
}
