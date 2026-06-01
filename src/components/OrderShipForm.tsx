"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { getNovaPoshtaTrackingUrl } from "@/lib/order-shipping";

type OrderShipFormProps = {
  orderId: string;
  deliveryLines: string[];
  showDeliveryAddress?: boolean;
};

export default function OrderShipForm({
  orderId,
  deliveryLines,
  showDeliveryAddress = true,
}: OrderShipFormProps) {
  const router = useRouter();
  const [ttn, setTtn] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    setLoading(true);
    setError("");

    try {
      const res = await fetch(`/api/orders/${orderId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "ship", novaPoshtaTtn: ttn }),
      });
      const data = (await res.json().catch(() => null)) as { error?: string } | null;

      if (!res.ok) {
        throw new Error(data?.error || "Не вдалося відправити замовлення");
      }

      setTtn("");
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Не вдалося відправити замовлення");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="mt-3 rounded-xl border border-violet-200 bg-violet-50/70 p-3">
      <p className="text-sm font-semibold text-violet-950">Відправити Nova Poshta</p>
      <p className="mt-1 text-xs text-violet-900/80">
        Оформіть посилку на{" "}
        <a
          href="https://novaposhta.ua/for-business/"
          target="_blank"
          rel="noopener noreferrer"
          className="font-medium underline"
        >
          novaposhta.ua
        </a>{" "}
        за адресою покупця {showDeliveryAddress ? "нижче" : "вище"}, потім вкажіть номер ТТН — покупець
        одразу отримає сповіщення.
      </p>

      {showDeliveryAddress && deliveryLines.length > 0 && (
        <div className="mt-3 rounded-lg border border-violet-100 bg-white p-3 text-xs text-gray-700">
          <p className="mb-1 font-medium text-gray-900">Адреса доставки покупця</p>
          {deliveryLines.map((line) => (
            <p key={line}>{line}</p>
          ))}
        </div>
      )}

      <form onSubmit={handleSubmit} className="mt-3 space-y-2">
        <div>
          <label htmlFor={`ttn-${orderId}`} className="mb-1 block text-xs font-medium text-gray-700">
            Номер ТТН Nova Poshta *
          </label>
          <input
            id={`ttn-${orderId}`}
            value={ttn}
            onChange={(e) => setTtn(e.target.value)}
            placeholder="20450123456789"
            inputMode="numeric"
            required
            className="text-sm"
          />
        </div>

        {error && <p className="text-xs text-red-700">{error}</p>}

        <button
          type="submit"
          disabled={loading}
          className="w-full rounded-lg bg-violet-700 px-3 py-2 text-sm font-semibold text-white hover:bg-violet-800 disabled:opacity-50 sm:w-auto"
        >
          {loading ? "Відправляємо..." : "Відправити замовлення покупцю"}
        </button>
      </form>
    </div>
  );
}

type OrderTrackingInfoProps = {
  ttn: string;
};

export function OrderTrackingInfo({ ttn }: OrderTrackingInfoProps) {
  const trackingUrl = getNovaPoshtaTrackingUrl(ttn);

  return (
    <div className="mt-3 rounded-lg border border-violet-200 bg-violet-50/80 p-3 text-sm text-violet-950">
      <p className="font-semibold">📦 Nova Poshta — посилка в дорозі</p>
      <p className="mt-1">
        ТТН: <span className="font-mono font-semibold">{ttn}</span>
      </p>
      <a
        href={trackingUrl}
        target="_blank"
        rel="noopener noreferrer"
        className="mt-2 inline-flex text-sm font-medium text-violet-800 underline hover:text-violet-950"
      >
        Відстежити на novaposhta.ua →
      </a>
    </div>
  );
}
