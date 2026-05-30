"use client";

import { useRef, useState } from "react";
import { uploadPhotoFile } from "@/lib/upload-photo";

type MessageChatInputProps = {
  content: string;
  onContentChange: (value: string) => void;
  onSend: (payload: { content: string; imageUrl: string | null }) => Promise<boolean>;
  loading: boolean;
  error: string;
  placeholder?: string;
};

export default function MessageChatInput({
  content,
  onContentChange,
  onSend,
  loading,
  error,
  placeholder = "Ваше повідомлення...",
}: MessageChatInputProps) {
  const fileRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [localError, setLocalError] = useState("");

  async function handlePickPhoto(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;

    setUploading(true);
    setLocalError("");
    try {
      const url = await uploadPhotoFile(file);
      setImagePreview(url);
    } catch (err) {
      setLocalError(err instanceof Error ? err.message : "Не вдалося завантажити фото");
    } finally {
      setUploading(false);
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!content.trim() && !imagePreview) return;

    const ok = await onSend({ content: content.trim(), imageUrl: imagePreview });
    if (ok) setImagePreview(null);
  }

  const displayError = localError || error;
  const busy = loading || uploading;

  return (
    <form onSubmit={handleSubmit} className="space-y-2">
      {imagePreview && (
        <div className="relative inline-block">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={imagePreview}
            alt="Прикріплене фото"
            className="h-24 w-24 rounded-lg object-cover border"
          />
          <button
            type="button"
            onClick={() => setImagePreview(null)}
            className="absolute -top-2 -right-2 h-6 w-6 rounded-full bg-red-600 text-white text-xs"
            aria-label="Прибрати фото"
          >
            ✕
          </button>
        </div>
      )}

      <div className="flex gap-2">
        <input
          value={content}
          onChange={(e) => onContentChange(e.target.value)}
          placeholder={placeholder}
          className="flex-1"
        />
        <input
          ref={fileRef}
          type="file"
          accept="image/*"
          className="hidden"
          onChange={handlePickPhoto}
        />
        <button
          type="button"
          onClick={() => fileRef.current?.click()}
          disabled={busy}
          className="border border-gray-200 px-3 py-2 rounded-lg hover:bg-gray-50 shrink-0"
          title="Додати фото"
        >
          📷
        </button>
        <button
          type="submit"
          disabled={busy || (!content.trim() && !imagePreview)}
          className="bg-brand-600 text-white px-4 py-2 rounded-lg hover:bg-brand-700 shrink-0"
        >
          {busy ? "..." : "Надіслати"}
        </button>
      </div>

      {displayError && <p className="text-sm text-red-600">{displayError}</p>}
    </form>
  );
}
