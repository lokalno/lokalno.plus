"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

type FavoriteButtonProps = {
  listingId: string;
  isLoggedIn: boolean;
  initialFavorited?: boolean;
};

export default function FavoriteButton({
  listingId,
  isLoggedIn,
  initialFavorited = false,
}: FavoriteButtonProps) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [favorited, setFavorited] = useState(initialFavorited);

  async function toggle() {
    if (!isLoggedIn) {
      router.push("/login");
      return;
    }
    setLoading(true);
    const res = await fetch("/api/favorites", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ listingId }),
    });
    const data = await res.json();
    if (res.ok) setFavorited(data.favorited);
    setLoading(false);
    router.refresh();
  }

  return (
    <button
      type="button"
      onClick={toggle}
      disabled={loading}
      className="w-full text-sm border border-gray-200 py-2 rounded-lg hover:bg-gray-50"
    >
      {favorited ? "❤️ У обраному" : "🤍 Додати в обране"}
    </button>
  );
}
