"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

type MessageFormProps = {
  listingId: string;
  receiverId: string;
};

export default function MessageForm({ listingId, receiverId }: MessageFormProps) {
  const router = useRouter();
  const [content, setContent] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!content.trim()) return;

    setLoading(true);
    try {
      const res = await fetch("/api/messages", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ listingId, receiverId, content }),
      });

      if (res.ok) {
        setContent("");
        router.push(`/messages?listingId=${listingId}`);
      }
    } finally {
      setLoading(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="flex gap-2 mt-4">
      <input
        value={content}
        onChange={(e) => setContent(e.target.value)}
        placeholder="Написати продавцю..."
        className="flex-1"
      />
      <button
        type="submit"
        disabled={loading}
        className="bg-brand-600 text-white px-4 py-2 rounded-lg hover:bg-brand-700 shrink-0"
      >
        Надіслати
      </button>
    </form>
  );
}
