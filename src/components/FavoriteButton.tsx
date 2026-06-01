"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";

type FavoriteButtonProps = {
  listingId: string;
  isLoggedIn: boolean;
  initialFavorited?: boolean;
  variant?: "overlay" | "button" | "gallery";
  loginCallbackUrl?: string;
};

function HeartIcon({ filled, className = "h-5 w-5" }: { filled: boolean; className?: string }) {
  return (
    <svg
      className={`${className} ${filled ? "text-rose-500" : "text-gray-600"}`}
      viewBox="0 0 24 24"
      fill={filled ? "currentColor" : "none"}
      stroke="currentColor"
      strokeWidth={2}
      aria-hidden
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z"
      />
    </svg>
  );
}

function FavoriteSavedToast({ onClose }: { onClose: () => void }) {
  return (
    <div className="fixed bottom-6 left-1/2 z-[60] w-[min(92vw,24rem)] -translate-x-1/2 rounded-2xl border border-rose-200 bg-white px-4 py-3 shadow-lg">
      <div className="flex items-start gap-3">
        <span className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-rose-50">
          <HeartIcon filled className="h-5 w-5" />
        </span>
        <div className="min-w-0 flex-1">
          <p className="font-semibold text-gray-900">Додано в обране</p>
          <p className="mt-0.5 text-sm text-gray-600">
            Знайти збережені оголошення можна в розділі «Обране» у шапці сайту.
          </p>
          <Link
            href="/favorites"
            className="mt-2 inline-flex text-sm font-semibold text-brand-700 hover:underline"
          >
            Переглянути обране →
          </Link>
        </div>
        <button
          type="button"
          onClick={onClose}
          className="shrink-0 text-gray-400 hover:text-gray-600"
          aria-label="Закрити"
        >
          ×
        </button>
      </div>
    </div>
  );
}

export default function FavoriteButton({
  listingId,
  isLoggedIn,
  initialFavorited = false,
  variant = "button",
  loginCallbackUrl,
}: FavoriteButtonProps) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [favorited, setFavorited] = useState(initialFavorited);
  const [showSavedToast, setShowSavedToast] = useState(false);

  useEffect(() => {
    if (!showSavedToast) return;
    const timer = setTimeout(() => setShowSavedToast(false), 8000);
    return () => clearTimeout(timer);
  }, [showSavedToast]);

  async function toggle(e?: React.MouseEvent) {
    e?.preventDefault();
    e?.stopPropagation();

    if (!isLoggedIn) {
      const callback =
        loginCallbackUrl ||
        (typeof window !== "undefined" ? window.location.pathname : `/listings/${listingId}`);
      router.push(`/login?callbackUrl=${encodeURIComponent(callback)}`);
      return;
    }

    setLoading(true);
    try {
      const res = await fetch("/api/favorites", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ listingId }),
      });
      const data = await res.json();
      if (res.ok) {
        const nextFavorited = Boolean(data.favorited);
        setFavorited(nextFavorited);
        if (nextFavorited) setShowSavedToast(true);
        else setShowSavedToast(false);
        router.refresh();
      }
    } finally {
      setLoading(false);
    }
  }

  const content =
    variant === "overlay" ? (
      <button
        type="button"
        onClick={toggle}
        disabled={loading}
        aria-pressed={favorited}
        aria-label={favorited ? "Прибрати з обраного" : "Додати в обране"}
        title={favorited ? "У обраному · відкрити /favorites" : "Додати в обране"}
        className={`absolute right-3 top-3 z-10 flex h-11 w-11 items-center justify-center rounded-full border bg-white/95 shadow-md backdrop-blur-sm transition hover:scale-105 hover:bg-white disabled:opacity-60 ${
          favorited ? "border-rose-200" : "border-gray-200"
        }`}
      >
        <HeartIcon filled={favorited} />
      </button>
    ) : variant === "gallery" ? (
      <button
        type="button"
        onClick={toggle}
        disabled={loading}
        aria-pressed={favorited}
        className={`absolute right-2 top-2 z-10 flex items-center gap-1.5 rounded-full border bg-white/95 px-3 py-1.5 text-xs font-medium shadow-md backdrop-blur-sm transition hover:bg-white disabled:opacity-60 ${
          favorited ? "border-rose-200 text-rose-700" : "border-gray-200 text-gray-800"
        }`}
      >
        <HeartIcon filled={favorited} className="h-4 w-4" />
        {favorited ? "У обраному" : "Додати в обране"}
      </button>
    ) : (
      <div className="space-y-2">
        <button
          type="button"
          onClick={toggle}
          disabled={loading}
          aria-pressed={favorited}
          className={`flex w-full items-center justify-center gap-2 rounded-xl border py-2.5 text-sm font-medium transition disabled:opacity-60 ${
            favorited
              ? "border-rose-200 bg-rose-50 text-rose-700 hover:bg-rose-100"
              : "border-gray-200 bg-white text-gray-700 hover:bg-gray-50"
          }`}
        >
          <HeartIcon filled={favorited} />
          {favorited ? "У обраному" : "Додати в обране"}
        </button>
        {favorited && (
          <Link
            href="/favorites"
            className="flex items-center justify-center gap-1.5 text-sm font-medium text-brand-700 hover:underline"
          >
            Переглянути всі обрані →
          </Link>
        )}
      </div>
    );

  return (
    <>
      {content}
      {showSavedToast && <FavoriteSavedToast onClose={() => setShowSavedToast(false)} />}
    </>
  );
}

export { HeartIcon as FavoriteHeartIcon };
