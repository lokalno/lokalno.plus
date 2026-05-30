"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Suspense, useState } from "react";

function ResetForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const token = searchParams.get("token") || "";

  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (password !== confirm) {
      setMessage("Паролі не збігаються");
      return;
    }
    setLoading(true);

    const res = await fetch("/api/auth/reset-password", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ token, password }),
    });

    const data = await res.json();
    setLoading(false);

    if (res.ok) {
      router.push("/login");
    } else {
      setMessage(data.error || "Помилка");
    }
  }

  if (!token) {
    return <p className="text-red-600 text-center">Невірне посилання</p>;
  }

  return (
    <form onSubmit={handleSubmit} className="bg-white rounded-xl border p-6 space-y-4">
      <input
        type="password"
        placeholder="Новий пароль"
        value={password}
        onChange={(e) => setPassword(e.target.value)}
        required
        minLength={6}
      />
      <input
        type="password"
        placeholder="Підтвердіть пароль"
        value={confirm}
        onChange={(e) => setConfirm(e.target.value)}
        required
      />
      <button
        type="submit"
        disabled={loading}
        className="w-full bg-brand-600 text-white py-3 rounded-lg hover:bg-brand-700"
      >
        {loading ? "..." : "Змінити пароль"}
      </button>
      {message && <p className="text-sm text-red-600 text-center">{message}</p>}
    </form>
  );
}

export default function ResetPasswordPage() {
  return (
    <div className="max-w-md mx-auto px-4 py-12">
      <h1 className="text-2xl font-bold mb-6 text-center">Новий пароль</h1>
      <Suspense fallback={<div className="text-center">Завантаження...</div>}>
        <ResetForm />
      </Suspense>
      <p className="text-center text-sm mt-4">
        <Link href="/login" className="text-brand-700 hover:underline">← Увійти</Link>
      </p>
    </div>
  );
}
