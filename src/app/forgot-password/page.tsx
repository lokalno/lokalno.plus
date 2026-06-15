"use client";

import Link from "next/link";
import { useState } from "react";

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setMessage("");

    const res = await fetch("/api/auth/forgot-password", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email }),
    });

      const data = await res.json();
      setLoading(false);
      if (!res.ok) {
        setMessage(data.error || data.message || "Помилка");
        return;
      }
      setMessage(data.message || data.error);
  }

  return (
    <div className="max-w-md mx-auto px-4 py-12">
      <h1 className="text-2xl font-bold mb-6 text-center">Забули пароль?</h1>

      <form onSubmit={handleSubmit} className="bg-white rounded-xl border p-6 space-y-4">
        <p className="text-sm text-gray-600">
          Введіть email, яким ви реєструвались. На пошту прийде посилання для встановлення нового
          пароля (діє 1 годину).
        </p>
        <input
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
          placeholder="your@email.com"
        />
        <button
          type="submit"
          disabled={loading}
          className="w-full bg-brand-600 text-white py-3 rounded-lg hover:bg-brand-700"
        >
          {loading ? "..." : "Надіслати"}
        </button>
        {message && (
          <p className="text-sm text-center text-gray-700 bg-gray-50 rounded-lg px-3 py-2">{message}</p>
        )}
      </form>

      <p className="text-center text-sm mt-4">
        <Link href="/login" className="text-brand-700 hover:underline">
          ← Назад до входу
        </Link>
      </p>
    </div>
  );
}
