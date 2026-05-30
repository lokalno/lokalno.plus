"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

type AdminUserActionsProps = {
  userId: string;
  banned: boolean;
  isAdmin: boolean;
};

export default function AdminUserActions({ userId, banned, isAdmin }: AdminUserActionsProps) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  if (isAdmin) return null;

  async function toggleBan() {
    const reason = banned
      ? null
      : prompt("Причина блокування (необов'язково):") || "Порушення правил";

    if (!banned && reason === null) return;

    setLoading(true);
    await fetch(`/api/admin/users/${userId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        banned: !banned,
        bannedReason: banned ? null : reason,
      }),
    });
    setLoading(false);
    router.refresh();
  }

  return (
    <button
      onClick={toggleBan}
      disabled={loading}
      className={`text-sm px-3 py-1 rounded-lg ${
        banned
          ? "bg-brand-600 text-white hover:bg-brand-700"
          : "text-red-600 border border-red-200 hover:bg-red-50"
      }`}
    >
      {loading ? "..." : banned ? "Розблокувати" : "Заблокувати"}
    </button>
  );
}
