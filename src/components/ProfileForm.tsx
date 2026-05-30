"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import UserAvatar from "./UserAvatar";
import SettlementSearch from "./SettlementSearch";
import BannerUpload from "./BannerUpload";
import { formatDate } from "@/lib/utils";
import { formatStars, getRatingLabel, getFollowerLabel } from "@/lib/seller-stats";

type ProfileFormProps = {
  initial: {
    name: string;
    city: string;
    phone: string;
    email: string;
    avatar?: string | null;
    banner?: string | null;
    createdAt: string;
    avgRating?: number | null;
    reviewCount?: number;
    followerCount?: number;
    userId: string;
  };
};

export default function ProfileForm({ initial }: ProfileFormProps) {
  const router = useRouter();
  const [form, setForm] = useState({
    name: initial.name,
    city: initial.city,
    phone: initial.phone,
    avatar: initial.avatar || "",
  });
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);

  async function uploadAvatar(file: File) {
    const formData = new FormData();
    formData.append("file", file);
    const res = await fetch("/api/upload", { method: "POST", body: formData });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || "Upload failed");
    return data.url as string;
  }

  async function handleAvatarChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setLoading(true);
    try {
      const url = await uploadAvatar(file);
      setForm({ ...form, avatar: url });
      await fetch("/api/profile", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ avatar: url }),
      });
      router.refresh();
    } catch {
      setMessage("Помилка завантаження фото");
    } finally {
      setLoading(false);
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setMessage("");

    const res = await fetch("/api/profile", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name: form.name,
        city: form.city,
        phone: form.phone,
        avatar: form.avatar || null,
      }),
    });

    setLoading(false);

    if (res.ok) {
      setMessage("Збережено!");
      router.refresh();
    } else {
      setMessage("Помилка збереження");
    }
  }

  return (
    <form onSubmit={handleSubmit} className="bg-white rounded-xl border border-gray-200 p-6 space-y-4">
      <div className="flex flex-col items-center text-center pb-4 border-b">
        <UserAvatar name={form.name} avatar={form.avatar || null} size="lg" />
        <label className="mt-3 text-sm text-brand-700 cursor-pointer hover:underline">
          Змінити фото
          <input type="file" accept="image/*" className="hidden" onChange={handleAvatarChange} />
        </label>
        <p className="text-xs text-gray-400 mt-2">
          На сайті з {formatDate(initial.createdAt)}
        </p>
        {initial.avgRating != null && initial.reviewCount != null && initial.reviewCount > 0 && (
          <div className="mt-2">
            <p className="text-yellow-500 text-sm">{formatStars(initial.avgRating)}</p>
            <p className="text-sm text-brand-800">
              {initial.avgRating.toFixed(1)} · {getRatingLabel(initial.reviewCount)}
            </p>
          </div>
        )}
        {initial.followerCount != null && (
          <p className="text-sm text-gray-600 mt-2">{getFollowerLabel(initial.followerCount)}</p>
        )}
      </div>

      <BannerUpload initialBanner={initial.banner} />

      <div>
        <label className="block text-sm font-medium mb-1">Email</label>
        <input value={initial.email} disabled className="bg-gray-50" />
      </div>

      <div>
        <label className="block text-sm font-medium mb-1">Ім&apos;я</label>
        <input
          value={form.name}
          onChange={(e) => setForm({ ...form, name: e.target.value })}
          required
        />
      </div>

      <SettlementSearch
        value={form.city}
        onChange={(city) => setForm({ ...form, city })}
        label="Місто / село"
      />

      <div>
        <label className="block text-sm font-medium mb-1">Телефон</label>
        <input
          type="tel"
          value={form.phone}
          onChange={(e) => setForm({ ...form, phone: e.target.value })}
          placeholder="+380..."
        />
      </div>

      <button
        type="submit"
        disabled={loading}
        className="w-full bg-brand-600 text-white py-2 rounded-lg hover:bg-brand-700"
      >
        {loading ? "Збереження..." : "Зберегти"}
      </button>

      {message && <p className="text-sm text-center text-brand-700">{message}</p>}
    </form>
  );
}
