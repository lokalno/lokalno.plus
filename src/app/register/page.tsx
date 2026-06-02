"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { signIn } from "next-auth/react";
import { UKRAINIAN_CITIES } from "@/lib/constants";

export default function RegisterPage() {
  const router = useRouter();
  const [form, setForm] = useState({
    name: "",
    email: "",
    password: "",
    city: "Київ",
    phone: "",
  });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const res = await fetch("/api/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || "Помилка реєстрації");
        return;
      }

      await signIn("credentials", {
        email: form.email,
        password: form.password,
        redirect: false,
      });

      router.push("/listings/new");
      router.refresh();
    } catch {
      setError("Помилка з'єднання");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="max-w-md mx-auto px-4 py-12">
      <h1 className="text-2xl font-bold mb-2 text-center">Реєстрація</h1>
      <p className="text-center text-gray-600 mb-6 text-sm">
        Створіть акаунт і почніть продавати за хвилину
      </p>

      <form onSubmit={handleSubmit} className="bg-white rounded-xl border border-gray-200 p-6 space-y-4">
        {error && (
          <div className="bg-red-50 text-red-700 px-4 py-3 rounded-lg text-sm">{error}</div>
        )}

        <div>
          <label className="block text-sm font-medium mb-1">Ім&apos;я *</label>
          <input
            value={form.name}
            onChange={(e) => setForm({ ...form, name: e.target.value })}
            required
          />
        </div>

        <div>
          <label className="block text-sm font-medium mb-1">Email *</label>
          <input
            type="email"
            value={form.email}
            onChange={(e) => setForm({ ...form, email: e.target.value })}
            required
          />
        </div>

        <div>
          <label className="block text-sm font-medium mb-1">Пароль * (мін. 6 символів)</label>
          <input
            type="password"
            value={form.password}
            onChange={(e) => setForm({ ...form, password: e.target.value })}
            required
            minLength={6}
          />
        </div>

        <div>
          <label className="block text-sm font-medium mb-1">Місто</label>
          <select
            value={form.city}
            onChange={(e) => setForm({ ...form, city: e.target.value })}
          >
            {UKRAINIAN_CITIES.map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium mb-1">Телефон (необов&apos;язково)</label>
          <input
            type="tel"
            placeholder="+380..."
            value={form.phone}
            onChange={(e) => setForm({ ...form, phone: e.target.value })}
          />
        </div>

        <button
          type="submit"
          disabled={loading}
          className="w-full bg-brand-600 text-white py-3 rounded-lg font-medium hover:bg-brand-700"
        >
          {loading ? "Реєстрація..." : "Зареєструватися"}
        </button>
      </form>

      <p className="text-center text-sm text-gray-600 mt-4">
        Реєструючись, ви погоджуєтесь з{" "}
        <Link href="/rules" className="text-brand-700 hover:underline">
          правилами
        </Link>{" "}
        та{" "}
        <Link href="/privacy" className="text-brand-700 hover:underline">
          політикою конфіденційності
        </Link>
        . Вже є акаунт?{" "}
        <Link href="/login" className="text-brand-700 hover:underline">
          Увійти
        </Link>
      </p>
    </div>
  );
}
