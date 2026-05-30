"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import SettlementSearch from "@/components/SettlementSearch";

type Settlement = {
  name: string;
  region: string;
  district: string;
  type: string;
  full: string;
};

type OrderCheckoutFormProps = {
  listingId: string;
};

export default function OrderCheckoutForm({ listingId }: OrderCheckoutFormProps) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

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

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    setLoading(true);
    setError("");
    setSuccess("");

    try {
      const res = await fetch("/api/orders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          listingId,
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

      setSuccess("Замовлення створено! Перейдіть у розділ «Замовлення».");
      setOpen(false);
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
          onClick={() => setOpen(true)}
          className="w-full bg-brand-600 text-white py-3 rounded-lg font-medium hover:bg-brand-700 text-lg"
        >
          Купити з доставкою Nova Poshta
        </button>
        {success && <p className="text-sm text-brand-700 mt-2">{success}</p>}
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="rounded-xl border border-brand-200 bg-brand-50/40 p-4 space-y-4">
      <div>
        <h3 className="font-semibold text-brand-900">Доставка Nova Poshta</h3>
        <p className="text-xs text-gray-600 mt-1">
          Заповніть дані отримувача. Продавець побачить їх у розділі «Замовлення».
        </p>
      </div>

      {error && (
        <div className="rounded-lg bg-red-50 text-red-700 px-3 py-2 text-sm">{error}</div>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <div>
          <label className="block text-sm font-medium mb-1">Ім&apos;я *</label>
          <input value={firstName} onChange={(e) => setFirstName(e.target.value)} required />
        </div>
        <div>
          <label className="block text-sm font-medium mb-1">Прізвище *</label>
          <input value={lastName} onChange={(e) => setLastName(e.target.value)} required />
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium mb-1">Телефон *</label>
        <input
          value={phone}
          onChange={(e) => setPhone(e.target.value)}
          required
          placeholder="0671234567"
          inputMode="tel"
        />
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <div>
          <label className="block text-sm font-medium mb-1">Область *</label>
          <input
            value={oblast}
            onChange={(e) => setOblast(e.target.value)}
            required
            placeholder="Одеська"
          />
        </div>
        <div>
          <label className="block text-sm font-medium mb-1">Район *</label>
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
        <label className="block text-sm font-medium mb-1">Відділення Nova Poshta *</label>
        <input
          value={warehouse}
          onChange={(e) => setWarehouse(e.target.value)}
          required
          placeholder="№ 1, вул. Грушевського 12 або поштомат № 12345"
        />
        <p className="text-[11px] text-gray-500 mt-1">Номер відділення, адреса або поштомат</p>
      </div>

      <div className="flex flex-col sm:flex-row gap-2">
        <button
          type="submit"
          disabled={loading}
          className="flex-1 bg-brand-600 text-white py-3 rounded-lg font-medium hover:bg-brand-700 disabled:opacity-50"
        >
          {loading ? "Оформлення..." : "Підтвердити замовлення"}
        </button>
        <button
          type="button"
          onClick={() => setOpen(false)}
          disabled={loading}
          className="sm:w-auto px-4 py-3 rounded-lg border bg-white hover:bg-gray-50"
        >
          Скасувати
        </button>
      </div>
    </form>
  );
}
