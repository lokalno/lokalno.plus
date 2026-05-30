"use client";

import { signIn } from "next-auth/react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useState } from "react";

function safeCallbackUrl(url: string | null): string {
  if (!url || !url.startsWith("/") || url.startsWith("//")) return "/";
  return url;
}

export default function LoginPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const callbackUrl = safeCallbackUrl(searchParams.get("callbackUrl"));
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);

    const result = await signIn("credentials", {
      email,
      password,
      redirect: false,
    });

    setLoading(false);

    if (result?.error) {
      setError(
        result.error.includes("BANNED")
          ? "Ваш акаунт заблоковано адміністратором"
          : "Невірний email або пароль"
      );
    } else {
      router.push(callbackUrl);
      router.refresh();
    }
  }

  return (
    <div className="max-w-md mx-auto px-4 py-12">
      <h1 className="text-2xl font-bold mb-6 text-center">Увійти</h1>

      <form onSubmit={handleSubmit} className="bg-white rounded-xl border border-gray-200 p-6 space-y-4">
        {error && (
          <div className="bg-red-50 text-red-700 px-4 py-3 rounded-lg text-sm">{error}</div>
        )}

        <div>
          <label className="block text-sm font-medium mb-1">Email</label>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            autoComplete="email"
          />
        </div>

        <div>
          <label className="block text-sm font-medium mb-1">Пароль</label>
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            autoComplete="current-password"
          />
        </div>

        <button
          type="submit"
          disabled={loading}
          className="w-full bg-brand-600 text-white py-3 rounded-lg font-medium hover:bg-brand-700"
        >
          {loading ? "Вхід..." : "Увійти"}
        </button>
      </form>

      <p className="text-center text-sm text-gray-600 mt-4">
        <Link href="/forgot-password" className="text-brand-700 hover:underline">
          Забули пароль?
        </Link>
        <br />
        Немає акаунту?{" "}
        <Link href="/register" className="text-brand-700 hover:underline">
          Зареєструватися
        </Link>
      </p>
    </div>
  );
}
