"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { CATEGORIES, CONDITIONS, MAX_LISTING_PHOTOS } from "@/lib/constants";
import SettlementSearch from "@/components/SettlementSearch";

type ListingFormProps = {
  initial?: {
    id?: string;
    title: string;
    description: string;
    price: number;
    category: string;
    condition: string;
    city: string;
    photos: string[];
  };
};

export default function ListingForm({ initial }: ListingFormProps) {
  const router = useRouter();
  const isEdit = Boolean(initial?.id);

  const [title, setTitle] = useState(initial?.title || "");
  const [description, setDescription] = useState(initial?.description || "");
  const [price, setPrice] = useState(initial?.price?.toString() || "");
  const [category, setCategory] = useState(initial?.category || CATEGORIES[0]);
  const [condition, setCondition] = useState(initial?.condition || "GOOD");
  const [city, setCity] = useState(initial?.city || "Київ");
  const [photos, setPhotos] = useState<string[]>(initial?.photos || []);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function uploadPhoto(file: File) {
    const formData = new FormData();
    formData.append("file", file);

    const res = await fetch("/api/upload", { method: "POST", body: formData });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || "Upload failed");
    return data.url as string;
  }

  async function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const files = e.target.files;
    if (!files) return;

    setLoading(true);
    try {
      const newPhotos: string[] = [];
      for (const file of Array.from(files)) {
        if (photos.length + newPhotos.length >= MAX_LISTING_PHOTOS) break;
        const url = await uploadPhoto(file);
        newPhotos.push(url);
      }
      setPhotos([...photos, ...newPhotos]);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Помилка завантаження фото");
    } finally {
      setLoading(false);
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const payload = {
        title,
        description,
        price: Number(price),
        category,
        condition,
        city,
        photos,
      };

      const url = isEdit ? `/api/listings/${initial!.id}` : "/api/listings";
      const method = isEdit ? "PATCH" : "POST";

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Помилка");

      if (!isEdit && data.status === "PENDING") {
        router.push("/profile?pending=1");
      } else {
        router.push(`/listings/${data.id}`);
      }
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Помилка");
    } finally {
      setLoading(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4 max-w-xl">
      {error && (
        <div className="bg-red-50 text-red-700 px-4 py-3 rounded-lg text-sm">{error}</div>
      )}

      <div>
        <label className="block text-sm font-medium mb-1">Назва *</label>
        <input value={title} onChange={(e) => setTitle(e.target.value)} required maxLength={100} />
      </div>

      <div>
        <label className="block text-sm font-medium mb-1">Опис *</label>
        <textarea
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          required
          rows={5}
          maxLength={2000}
        />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium mb-1">Ціна (₴) *</label>
          <input
            type="number"
            min="1"
            value={price}
            onChange={(e) => setPrice(e.target.value)}
            required
          />
        </div>
        <SettlementSearch value={city} onChange={setCity} label="Місто / село" required />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium mb-1">Категорія *</label>
          <select value={category} onChange={(e) => setCategory(e.target.value)}>
            {CATEGORIES.map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className="block text-sm font-medium mb-1">Стан *</label>
          <select value={condition} onChange={(e) => setCondition(e.target.value)}>
            {Object.entries(CONDITIONS).map(([key, label]) => (
              <option key={key} value={key}>
                {label}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium mb-1">Фото (до {MAX_LISTING_PHOTOS})</label>
        <input type="file" accept="image/*" multiple onChange={handleFileChange} />
        {photos.length > 0 && (
          <div className="flex flex-wrap gap-2 mt-3">
            {photos.map((photo, i) => (
              <div key={i} className="relative">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={photo} alt="" className="w-20 h-20 object-cover rounded-lg" />
                <button
                  type="button"
                  onClick={() => setPhotos(photos.filter((_, idx) => idx !== i))}
                  className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full w-5 h-5 text-xs"
                >
                  ×
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      <button
        type="submit"
        disabled={loading}
        className="w-full bg-brand-600 text-white py-3 rounded-lg font-medium hover:bg-brand-700"
      >
        {loading ? "Збереження..." : isEdit ? "Зберегти зміни" : "Опублікувати"}
      </button>
    </form>
  );
}
