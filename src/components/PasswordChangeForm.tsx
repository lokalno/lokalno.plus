"use client";

import { useState } from "react";

export default function PasswordChangeForm() {
  const [form, setForm] = useState({ current: "", next: "", confirm: "" });
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (form.next !== form.confirm) {
      setMessage("Паролі не збігаються");
      return;
    }
    setLoading(true);
    setMessage("");

    const res = await fetch("/api/profile/password", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        currentPassword: form.current,
        newPassword: form.next,
      }),
    });

    const data = await res.json();
    setLoading(false);

    if (res.ok) {
      setMessage("Пароль змінено!");
      setForm({ current: "", next: "", confirm: "" });
    } else {
      setMessage(data.error || "Помилка");
    }
  }

  return (
    <form onSubmit={handleSubmit} className="bg-white rounded-xl border p-6 space-y-3 mt-6">
      <h3 className="font-semibold">Змінити пароль</h3>
      <input
        type="password"
        placeholder="Поточний пароль"
        value={form.current}
        onChange={(e) => setForm({ ...form, current: e.target.value })}
        required
      />
      <input
        type="password"
        placeholder="Новий пароль"
        value={form.next}
        onChange={(e) => setForm({ ...form, next: e.target.value })}
        required
        minLength={6}
      />
      <input
        type="password"
        placeholder="Підтвердіть пароль"
        value={form.confirm}
        onChange={(e) => setForm({ ...form, confirm: e.target.value })}
        required
      />
      <button
        type="submit"
        disabled={loading}
        className="w-full bg-gray-800 text-white py-2 rounded-lg hover:bg-gray-900"
      >
        {loading ? "..." : "Змінити пароль"}
      </button>
      {message && (
        <p className={`text-sm text-center ${message.includes("змінено") ? "text-brand-700" : "text-red-600"}`}>
          {message}
        </p>
      )}
    </form>
  );
}
