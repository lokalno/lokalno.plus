"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { formatPrice } from "@/lib/utils";

type OrderPayButtonProps = {
  orderId: string;
  price: number;
  paymentStatus: string;
};

export default function OrderPayButton({ orderId, price, paymentStatus }: OrderPayButtonProps) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  if (paymentStatus === "PAID") {
    return (
      <p className="text-sm text-brand-700 font-medium mt-2">
        ✓ Оплачено · {formatPrice(price)} зараховано продавцю
      </p>
    );
  }

  if (paymentStatus === "REFUNDED") {
    return <p className="text-sm text-gray-500 mt-2">Оплату повернено</p>;
  }

  async function handlePay() {
    setLoading(true);
    setError("");

    try {
      const res = await fetch(`/api/orders/${orderId}/pay`, { method: "POST" });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Помилка оплати");
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Помилка оплати");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="mt-3">
      <button
        type="button"
        onClick={handlePay}
        disabled={loading}
        className="w-full sm:w-auto bg-brand-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-brand-700 disabled:opacity-50"
      >
        {loading ? "Оплата..." : `Оплатити ${formatPrice(price)}`}
      </button>
      <p className="text-xs text-gray-500 mt-1">
        Після оплати кошти надійдуть на баланс продавця
      </p>
      {error && <p className="text-xs text-red-600 mt-1">{error}</p>}
    </div>
  );
}
