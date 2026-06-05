"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { SUPPORT_SUBJECTS } from "@/lib/constants";

type SupportFormProps = {
  userName: string;
  userEmail: string;
  userPhone?: string | null;
};

export default function SupportForm({ userName, userEmail, userPhone }: SupportFormProps) {
  const router = useRouter();
  const [subject, setSubject] = useState<string>(SUPPORT_SUBJECTS[0]);
  const [message, setMessage] = useState("");
  const [phone, setPhone] = useState(userPhone || "");
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);
  const [ticketId, setTicketId] = useState<string | null>(null);
  const [error, setError] = useState("");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError("");

    const res = await fetch("/api/support", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ subject, message, phone: phone.trim() || null }),
    });

    const data = await res.json();
    setLoading(false);

    if (!res.ok) {
      setError(data.error || "Помилка відправки");
      return;
    }

    setDone(true);
    setTicketId(data.id || null);
    setMessage("");
    router.refresh();
  }

  if (done) {
    return (
      <div className="rounded-xl border border-brand-200 bg-brand-50 p-6 text-center">
        <p className="font-semibold text-brand-800">Повідомлення надіслано!</p>
        <p className="text-sm text-brand-700 mt-2">
          Адміністратор відповість у цьому діалозі. Ви отримаєте сповіщення тут на сторінці підтримки.
        </p>
        {ticketId && (
          <Link
            href={`/contact/tickets/${ticketId}`}
            className="mt-4 inline-block bg-brand-600 text-white px-4 py-2 rounded-xl hover:bg-brand-700 font-medium"
          >
            Відкрити діалог
          </Link>
        )}
        <button
          type="button"
          onClick={() => {
            setDone(false);
            setTicketId(null);
          }}
          className="mt-3 block w-full text-sm text-brand-700 underline"
        >
          Надіслати ще одне
        </button>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="bg-white rounded-xl border p-6 space-y-4">
      <p className="text-sm text-gray-600">
        Ви увійшли як <strong>{userName}</strong> ({userEmail}). Повідомлення надійде адміністратору на сайті.
      </p>

      <div>
        <label className="block text-sm font-medium mb-1">Тема</label>
        <select value={subject} onChange={(e) => setSubject(e.target.value)} className="w-full">
          {SUPPORT_SUBJECTS.map((s) => (
            <option key={s} value={s}>
              {s}
            </option>
          ))}
        </select>
      </div>

      <div>
        <label className="block text-sm font-medium mb-1">Повідомлення *</label>
        <textarea
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          rows={5}
          required
          minLength={10}
          placeholder="Опишіть ваше питання або проблему..."
          className="w-full"
        />
      </div>

      <div>
        <label className="block text-sm font-medium mb-1">Телефон (необов&apos;язково)</label>
        <input
          type="tel"
          value={phone}
          onChange={(e) => setPhone(e.target.value)}
          placeholder="+380..."
          className="w-full"
        />
        <p className="text-xs text-gray-500 mt-1">Щоб адмін міг зв&apos;язатися з вами</p>
      </div>

      {error && <p className="text-sm text-red-600">{error}</p>}

      <button
        type="submit"
        disabled={loading}
        className="w-full bg-brand-600 text-white py-3 rounded-xl font-medium hover:bg-brand-700 disabled:opacity-50"
      >
        {loading ? "Надсилання..." : "Надіслати в підтримку"}
      </button>
    </form>
  );
}
