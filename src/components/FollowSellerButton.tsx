"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

type FollowSellerButtonProps = {
  sellerId: string;
  isLoggedIn: boolean;
  isOwner: boolean;
  initialFollowing: boolean;
  initialFollowerCount: number;
  compact?: boolean;
  onDark?: boolean;
  variant?: "default" | "hero" | "bannerPremium";
  hideFollowerCount?: boolean;
};

export default function FollowSellerButton({
  sellerId,
  isLoggedIn,
  isOwner,
  initialFollowing,
  initialFollowerCount,
  compact = false,
  onDark = false,
  variant = "default",
  hideFollowerCount = false,
}: FollowSellerButtonProps) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [following, setFollowing] = useState(initialFollowing);
  const [followerCount, setFollowerCount] = useState(initialFollowerCount);

  if (isOwner) return null;

  async function toggle() {
    if (!isLoggedIn) {
      router.push("/login");
      return;
    }
    setLoading(true);
    const res = await fetch("/api/follows", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ sellerId }),
    });
    const data = await res.json();
    if (res.ok) {
      setFollowing(data.following);
      setFollowerCount(data.followerCount);
    }
    setLoading(false);
    router.refresh();
  }

  const heroClass = following
    ? "border-brand-200 bg-brand-50 text-brand-800 hover:bg-brand-100"
    : "border-brand-600 bg-brand-600 text-white hover:bg-brand-700 shadow-md";

  const buttonClass =
    variant === "bannerPremium"
      ? `inline-flex items-center justify-center gap-1.5 rounded-lg px-2.5 py-1.5 text-xs font-semibold transition disabled:opacity-60 md:rounded-xl md:px-3.5 md:py-2 md:text-sm ${
          following
            ? "border border-white/30 bg-white/15 text-white backdrop-blur-md hover:bg-white/25"
            : "bg-brand-600 text-white shadow-md hover:bg-brand-700"
        }`
      : variant === "hero"
      ? `inline-flex items-center justify-center gap-2 rounded-xl border px-5 py-2.5 text-sm font-semibold transition disabled:opacity-60 ${heroClass}`
      : compact
        ? `text-xs px-3 py-1.5 rounded-lg border font-medium ${
            onDark
              ? following
                ? "border-white/40 bg-white/15 text-white"
                : "border-white/30 bg-white/10 text-white hover:bg-white/20"
              : following
                ? "border-brand-200 bg-brand-50 text-brand-800"
                : "border-brand-600 bg-brand-600 text-white hover:bg-brand-700"
          }`
        : `text-sm px-4 py-2 rounded-lg border font-medium ${
            onDark
              ? following
                ? "border-white/40 bg-white/15 text-white hover:bg-white/20"
                : "border-white/30 bg-white/10 text-white hover:bg-white/20"
              : following
                ? "border-brand-200 bg-brand-50 text-brand-800 hover:bg-brand-100"
                : "border-brand-600 bg-brand-600 text-white hover:bg-brand-700"
          }`;

  return (
    <div className={variant === "hero" || variant === "bannerPremium" ? "" : compact ? "mt-2" : onDark ? "mt-0" : "mt-3"}>
      <button type="button" onClick={toggle} disabled={loading} className={buttonClass}>
        {variant === "bannerPremium" ? (
          <>{following ? "✓ Підписано" : "+ Підписатися"}</>
        ) : onDark ? (
          <>{following ? "✓ Підписано" : "Підписатися"}</>
        ) : (
          <>{following ? "✓ Підписано" : "📌 Підписатися"}</>
        )}
      </button>
      {!hideFollowerCount && (
        <p
          className={`${onDark ? "text-white/70" : "text-gray-500"} ${compact ? "text-xs mt-1" : "text-sm mt-1.5"}`}
        >
          {followerCount}{" "}
          {followerCount === 1
            ? "підписник"
            : followerCount >= 2 && followerCount <= 4
              ? "підписники"
              : "підписників"}
        </p>
      )}
    </div>
  );
}
