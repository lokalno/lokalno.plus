"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

type AdminUserActionsProps = {
  userId: string;
  userName: string;
  banned: boolean;
  isAdmin: boolean;
};

export default function AdminUserActions({
  userId,
  userName,
  banned,
  isAdmin,
}: AdminUserActionsProps) {
  const router = useRouter();
  const [loading, setLoading] = useState<"ban" | "delete" | null>(null);

  if (isAdmin) return null;

  async function toggleBan() {
    const reason = banned
      ? null
      : prompt("Причина блокування (необов'язково):") || "Порушення правил";

    if (!banned && reason === null) return;

    setLoading("ban");
    await fetch(`/api/admin/users/${userId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        banned: !banned,
        bannedReason: banned ? null : reason,
      }),
    });
    setLoading(null);
    router.refresh();
  }

  async function deleteProfile() {
    const confirmed = confirm(
      `Видалити профіль «${userName}» назавжди?\n\nБудуть видалені оголошення, замовлення, повідомлення та відгуки цього користувача. Цю дію не можна скасувати.`
    );
    if (!confirmed) return;

    setLoading("delete");
    const res = await fetch(`/api/admin/users/${userId}`, { method: "DELETE" });
    setLoading(null);

    if (!res.ok) {
      const data = (await res.json().catch(() => null)) as { error?: string } | null;
      alert(data?.error || "Не вдалося видалити профіль");
      return;
    }

    router.refresh();
  }

  return (
    <div className="flex flex-wrap items-center gap-2">
      <button
        type="button"
        onClick={toggleBan}
        disabled={loading !== null}
        className={`text-sm px-3 py-1 rounded-lg ${
          banned
            ? "bg-brand-600 text-white hover:bg-brand-700"
            : "text-red-600 border border-red-200 hover:bg-red-50"
        }`}
      >
        {loading === "ban" ? "..." : banned ? "Розблокувати" : "Заблокувати"}
      </button>
      <button
        type="button"
        onClick={deleteProfile}
        disabled={loading !== null}
        className="text-sm px-3 py-1 rounded-lg border border-red-300 bg-red-600 text-white hover:bg-red-700"
      >
        {loading === "delete" ? "..." : "Видалити профіль"}
      </button>
    </div>
  );
}
