"use client";

import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { uploadPhotoFile } from "@/lib/upload-photo";
import { BANNER_PHOTO_MAX_BYTES, BANNER_PHOTO_MAX_WIDTH } from "@/lib/constants";

type BannerUploadProps = {
  initialBanner?: string | null;
};

export default function BannerUpload({ initialBanner }: BannerUploadProps) {
  const router = useRouter();
  const inputRef = useRef<HTMLInputElement>(null);
  const [banner, setBanner] = useState(initialBanner || "");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");

  async function uploadFile(file: File) {
    return uploadPhotoFile(file, {
      maxWidth: BANNER_PHOTO_MAX_WIDTH,
      maxBytes: BANNER_PHOTO_MAX_BYTES,
    });
  }

  async function saveBanner(url: string | null) {
    const res = await fetch("/api/profile", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ banner: url }),
    });
    if (!res.ok) throw new Error("Save failed");
  }

  async function handleChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setLoading(true);
    setMessage("");
    try {
      const url = await uploadFile(file);
      await saveBanner(url);
      setBanner(url);
      setMessage("Банер збережено!");
      router.refresh();
    } catch (err) {
      setMessage(err instanceof Error ? err.message : "Помилка завантаження");
    } finally {
      setLoading(false);
    }
  }

  async function removeBanner() {
    setLoading(true);
    setMessage("");
    try {
      await saveBanner(null);
      setBanner("");
      setMessage("Банер видалено");
      router.refresh();
    } catch {
      setMessage("Помилка");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="space-y-2">
      <label className="block text-sm font-medium">Банер сторінки продавця</label>
      <p className="text-xs text-gray-500">Показується на вашій публічній сторінці /sellers/...</p>
      <div className="relative h-28 rounded-xl overflow-hidden border border-gray-200 bg-gradient-to-r from-brand-600 to-brand-500">
        {banner ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={banner} alt="Банер" className="w-full h-full object-cover" />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-white/80 text-sm">
            Банер не завантажено
          </div>
        )}
      </div>
      <div className="flex flex-wrap gap-2">
        <button
          type="button"
          disabled={loading}
          onClick={() => inputRef.current?.click()}
          className="text-sm text-brand-700 hover:underline"
        >
          {banner ? "Змінити банер" : "Завантажити банер"}
        </button>
        {banner && (
          <button
            type="button"
            disabled={loading}
            onClick={removeBanner}
            className="text-sm text-red-600 hover:underline"
          >
            Видалити
          </button>
        )}
      </div>
      <input
        ref={inputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp,image/*"
        className="hidden"
        onChange={handleChange}
      />
      {message && <p className="text-xs text-brand-700">{message}</p>}
    </div>
  );
}
