"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { formatPrice, formatDate } from "@/lib/utils";
import {
  WALLET_TRANSACTION_TYPES,
  WITHDRAWAL_STATUSES,
} from "@/lib/wallet";

type WalletData = {
  balance: number;
  payout: {
    cardHolder: string;
    cardNumber: string;
    bankName: string;
    hasCard: boolean;
  };
  transactions: Array<{
    id: string;
    amount: number;
    type: string;
    description: string;
    createdAt: string;
  }>;
  withdrawals: Array<{
    id: string;
    amount: number;
    status: string;
    cardLast4: string;
    createdAt: string;
  }>;
};

export default function WalletPanel() {
  const router = useRouter();
  const [data, setData] = useState<WalletData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [cardHolder, setCardHolder] = useState("");
  const [cardNumber, setCardNumber] = useState("");
  const [bankName, setBankName] = useState("");
  const [withdrawAmount, setWithdrawAmount] = useState("");
  const [actionMessage, setActionMessage] = useState("");

  async function loadWallet() {
    setLoading(true);
    setError("");
    try {
      const res = await fetch("/api/wallet");
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || "Помилка");
      setData(json);
      setCardHolder(json.payout.cardHolder || "");
      setBankName(json.payout.bankName || "");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Помилка завантаження");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadWallet();
  }, []);

  async function saveCard(e: React.FormEvent) {
    e.preventDefault();
    setActionMessage("");
    const res = await fetch("/api/wallet/payout", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ cardHolder, cardNumber, bankName }),
    });
    const json = await res.json();
    if (!res.ok) {
      setActionMessage(json.error || "Помилка збереження картки");
      return;
    }
    setCardNumber("");
    setActionMessage("Картку збережено");
    await loadWallet();
    router.refresh();
  }

  async function requestWithdraw(e: React.FormEvent) {
    e.preventDefault();
    setActionMessage("");
    const res = await fetch("/api/wallet/withdraw", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        amount: Number(withdrawAmount),
        cardHolder,
        cardNumber: cardNumber || undefined,
        bankName,
      }),
    });
    const json = await res.json();
    if (!res.ok) {
      setActionMessage(json.error || "Помилка виведення");
      return;
    }
    setWithdrawAmount("");
    setActionMessage("Заявку на виведення створено. Переказ протягом 1–3 робочих днів.");
    await loadWallet();
    router.refresh();
  }

  if (loading) {
    return <div className="rounded-xl border bg-white p-8 text-center text-gray-500">Завантаження...</div>;
  }

  if (error || !data) {
    return <div className="rounded-xl border bg-red-50 p-4 text-red-700">{error || "Помилка"}</div>;
  }

  return (
    <div className="space-y-6">
      <div className="rounded-2xl border bg-gradient-to-br from-brand-600 to-brand-700 text-white p-6">
        <p className="text-brand-100 text-sm">Ваш баланс</p>
        <p className="text-4xl font-bold mt-1">{formatPrice(data.balance)}</p>
        <p className="text-brand-100 text-sm mt-2">
          Кошти надходять після оплати замовлення покупцем
        </p>
      </div>

      {actionMessage && (
        <div className="rounded-lg border border-brand-200 bg-brand-50 px-4 py-3 text-sm text-brand-900">
          {actionMessage}
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <form onSubmit={saveCard} className="rounded-xl border bg-white p-5 space-y-4">
          <h2 className="font-semibold">Банківська картка</h2>
          <p className="text-sm text-gray-500">
            {data.payout.hasCard
              ? `Збережена картка: ${data.payout.cardNumber}`
              : "Додайте картку для виведення коштів"}
          </p>
          <div>
            <label className="block text-sm font-medium mb-1">Ім&apos;я на картці</label>
            <input value={cardHolder} onChange={(e) => setCardHolder(e.target.value)} required />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Номер картки</label>
            <input
              value={cardNumber}
              onChange={(e) => setCardNumber(e.target.value)}
              placeholder={data.payout.hasCard ? "Новий номер, якщо змінили" : "0000 0000 0000 0000"}
              inputMode="numeric"
              required={!data.payout.hasCard}
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Банк (необов&apos;язково)</label>
            <input value={bankName} onChange={(e) => setBankName(e.target.value)} placeholder="Monobank, PrivatBank..." />
          </div>
          <button type="submit" className="bg-brand-600 text-white px-4 py-2 rounded-lg hover:bg-brand-700">
            Зберегти картку
          </button>
        </form>

        <form onSubmit={requestWithdraw} className="rounded-xl border bg-white p-5 space-y-4">
          <h2 className="font-semibold">Вивести на картку</h2>
          <p className="text-sm text-gray-500">Мінімум 100 ₴. Заявку обробляє адміністратор сайту.</p>
          <div>
            <label className="block text-sm font-medium mb-1">Сума (₴)</label>
            <input
              type="number"
              min="100"
              max={Math.floor(data.balance)}
              value={withdrawAmount}
              onChange={(e) => setWithdrawAmount(e.target.value)}
              required
              disabled={data.balance < 100}
            />
          </div>
          <button
            type="submit"
            disabled={data.balance < 100 || !data.payout.hasCard}
            className="bg-brand-600 text-white px-4 py-2 rounded-lg hover:bg-brand-700 disabled:opacity-50"
          >
            Замовити виведення
          </button>
          {!data.payout.hasCard && (
            <p className="text-xs text-amber-700">Спочатку збережіть картку зліва</p>
          )}
        </form>
      </div>

      {data.withdrawals.length > 0 && (
        <div className="rounded-xl border bg-white p-5">
          <h2 className="font-semibold mb-3">Заявки на виведення</h2>
          <div className="space-y-2">
            {data.withdrawals.map((item) => (
              <div key={item.id} className="flex flex-wrap justify-between gap-2 text-sm border-b pb-2 last:border-0">
                <span>
                  {formatPrice(item.amount)} → *{item.cardLast4}
                </span>
                <span className="text-gray-500">
                  {WITHDRAWAL_STATUSES[item.status] || item.status} · {formatDate(item.createdAt)}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="rounded-xl border bg-white p-5">
        <h2 className="font-semibold mb-3">Історія операцій</h2>
        {data.transactions.length === 0 ? (
          <p className="text-sm text-gray-500">Операцій поки немає</p>
        ) : (
          <div className="space-y-2">
            {data.transactions.map((tx) => (
              <div key={tx.id} className="flex flex-wrap justify-between gap-2 text-sm border-b pb-2 last:border-0">
                <div>
                  <p>{tx.description}</p>
                  <p className="text-xs text-gray-400">
                    {WALLET_TRANSACTION_TYPES[tx.type] || tx.type} · {formatDate(tx.createdAt)}
                  </p>
                </div>
                <span className={tx.amount >= 0 ? "text-brand-700 font-semibold" : "text-red-600 font-semibold"}>
                  {tx.amount >= 0 ? "+" : ""}
                  {formatPrice(tx.amount)}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
