"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

type AdminSettingsFormProps = {
  initial: {
    siteName: string;
    tagline: string;
    logoUrl: string | null;
    supportEmail: string;
    rulesContent: string;
    privacyContent: string;
    preModeration: boolean;
  };
};

export default function AdminSettingsForm({ initial }: AdminSettingsFormProps) {
  const router = useRouter();
  const [form, setForm] = useState({
    siteName: initial.siteName,
    tagline: initial.tagline,
    logoUrl: initial.logoUrl || "",
    supportEmail: initial.supportEmail,
    rulesContent: initial.rulesContent,
    privacyContent: initial.privacyContent,
    preModeration: initial.preModeration,
  });
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setMessage("");

    const res = await fetch("/api/admin/settings", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        ...form,
        logoUrl: form.logoUrl || null,
      }),
    });

    setLoading(false);

    if (res.ok) {
      setMessage("Налаштування збережено!");
      router.refresh();
    } else {
      setMessage("Помилка збереження");
    }
  }

  return (
    <form onSubmit={handleSubmit} className="bg-white rounded-xl border p-6 space-y-4 max-w-2xl">
      <h2 className="font-semibold text-gray-900">Основне</h2>

      <div>
        <label className="block text-sm font-medium mb-1">Назва сайту *</label>
        <input
          value={form.siteName}
          onChange={(e) => setForm({ ...form, siteName: e.target.value })}
          required
        />
      </div>

      <div>
        <label className="block text-sm font-medium mb-1">Слоган</label>
        <input
          value={form.tagline}
          onChange={(e) => setForm({ ...form, tagline: e.target.value })}
        />
      </div>

      <div>
        <label className="block text-sm font-medium mb-1">URL логотипу</label>
        <input
          value={form.logoUrl}
          onChange={(e) => setForm({ ...form, logoUrl: e.target.value })}
        />
      </div>

      <div>
        <label className="block text-sm font-medium mb-1">Email підтримки</label>
        <input
          type="email"
          value={form.supportEmail}
          onChange={(e) => setForm({ ...form, supportEmail: e.target.value })}
        />
      </div>

      <label className="flex items-center gap-2 text-sm">
        <input
          type="checkbox"
          checked={form.preModeration}
          onChange={(e) => setForm({ ...form, preModeration: e.target.checked })}
          className="w-4 h-4"
        />
        Модерація перед публікацією (нові оголошення — «На модерації»)
      </label>

      <hr />

      <h2 className="font-semibold text-gray-900">Правила (/rules)</h2>
      <textarea
        value={form.rulesContent}
        onChange={(e) => setForm({ ...form, rulesContent: e.target.value })}
        rows={12}
        className="font-mono text-sm"
      />

      <h2 className="font-semibold text-gray-900">Конфіденційність (/privacy)</h2>
      <textarea
        value={form.privacyContent}
        onChange={(e) => setForm({ ...form, privacyContent: e.target.value })}
        rows={8}
        className="font-mono text-sm"
      />

      <button
        type="submit"
        disabled={loading}
        className="w-full bg-brand-600 text-white py-3 rounded-lg font-medium hover:bg-brand-700"
      >
        {loading ? "Збереження..." : "Зберегти все"}
      </button>

      {message && (
        <p className="text-sm text-center text-brand-700 bg-brand-50 py-2 rounded-lg">{message}</p>
      )}
    </form>
  );
}
