"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { CATEGORIES, CONDITIONS, MAX_LISTING_PHOTOS, LISTING_PHOTO_MAX_BYTES, LISTING_PHOTO_MAX_WIDTH } from "@/lib/constants";
import { compressImageFile } from "@/lib/compress-image";
import { getListingPhotosPayloadSize, validateListingPhotos } from "@/lib/listing-photos";
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
  const [uploadStatus, setUploadStatus] = useState("");
  const [error, setError] = useState("");

  async function uploadPhoto(file: File) {
    const compressed = await compressImageFile(file, {
      maxWidth: LISTING_PHOTO_MAX_WIDTH,
      maxBytes: LISTING_PHOTO_MAX_BYTES,
    });
    const formData = new FormData();
    formData.append("file", compressed);

    const res = await fetch("/api/upload", { method: "POST", body: formData });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || "Upload failed");
    return data.url as string;
  }

  async function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const files = e.target.files;
    if (!files) return;

    setLoading(true);
    setError("");
    setUploadStatus("");
    try {
      const filesToUpload = Array.from(files).slice(0, MAX_LISTING_PHOTOS - photos.length);
      const newPhotos: string[] = [];

      for (let i = 0; i < filesToUpload.length; i++) {
        setUploadStatus(`Завантаження фото ${i + 1} з ${filesToUpload.length}...`);
        const url = await uploadPhoto(filesToUpload[i]);
        newPhotos.push(url);
      }

      const merged = [...photos, ...newPhotos];
      const check = validateListingPhotos(merged);
      if (!check.ok) {
        throw new Error(check.error);
      }

      setPhotos(merged);
      setUploadStatus(`Додано ${newPhotos.length} фото`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Помилка завантаження фото");
    } finally {
      setLoading(false);
      e.target.value = "";
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const photosCheck = validateListingPhotos(photos);
      if (!photosCheck.ok) {
        throw new Error(photosCheck.error);
      }

      const payload = {
        title,
        description,
        price: Number(price),
        category,
        condition,
        city,
        photos: photosCheck.photos,
      };

      if (getListingPhotosPayloadSize(photosCheck.photos) > 2_500_000) {
        throw new Error("Занадто багато великих фото. Спробуйте менше зображень.");
      }

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
        <label className="block text-sm font-medium mb-1">Фото * (мінімум 1, до {MAX_LISTING_PHOTOS})</label>
        <p className="text-xs text-gray-500 mb-2">
          Без фото оголошення не опублікується. Можна обрати кілька фото одразу.
        </p>
        <input type="file" accept="image/*" multiple onChange={handleFileChange} disabled={loading || photos.length >= MAX_LISTING_PHOTOS} />
        {photos.length === 0 && !loading && (
          <p className="text-xs text-amber-700 mt-2">Додайте хоча б одне фото</p>
        )}
        {uploadStatus && <p className="text-xs text-brand-700 mt-2">{uploadStatus}</p>}
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
        disabled={loading || photos.length === 0}
        className="w-full bg-brand-600 text-white py-3 rounded-lg font-medium hover:bg-brand-700 disabled:opacity-50"
      >
        {loading ? "Збереження..." : isEdit ? "Зберегти зміни" : "Опублікувати"}
      </button>
    </form>
  );
}
