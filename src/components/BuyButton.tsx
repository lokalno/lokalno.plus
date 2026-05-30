"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

type BuyButtonProps = {
  listingId: string;
};

export default function BuyButton({ listingId }: BuyButtonProps) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");

  async function handleBuy() {
    setLoading(true);
    setMessage("");

    try {
      const res = await fetch("/api/orders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ listingId }),
      });

      const data = await res.json();

      if (res.ok) {
        setMessage("Замовлення створено! Перейдіть у розділ «Замовлення».");
        router.refresh();
      } else {
        setMessage(data.error || "Помилка");
      }
    } finally {
      setLoading(false);
    }
  }

  return (
    <div>
      <button
        onClick={handleBuy}
        disabled={loading}
        className="w-full bg-brand-600 text-white py-3 rounded-lg font-medium hover:bg-brand-700 text-lg"
      >
        {loading ? "Обробка..." : "Купити"}
      </button>
      {message && <p className="text-sm text-gray-600 mt-2">{message}</p>}
    </div>
  );
}
