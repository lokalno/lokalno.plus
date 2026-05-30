"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

type ReviewFormProps = {
  orderId: string;
};

export default function ReviewForm({ orderId }: ReviewFormProps) {
  const router = useRouter();
  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState("");
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);

    const res = await fetch("/api/reviews", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ orderId, rating, comment }),
    });

    setLoading(false);
    if (res.ok) {
      setDone(true);
      router.refresh();
    }
  }

  if (done) {
    return <p className="text-sm text-green-700 bg-green-50 p-2 rounded-lg">Дякуємо за відгук!</p>;
  }

  return (
    <form onSubmit={handleSubmit} className="mt-2 p-3 bg-gray-50 rounded-lg space-y-2">
      <p className="text-sm font-medium">Оцінити продавця</p>
      <select value={rating} onChange={(e) => setRating(Number(e.target.value))} className="text-sm">
        {[5, 4, 3, 2, 1].map((n) => (
          <option key={n} value={n}>
            {"⭐".repeat(n)} ({n})
          </option>
        ))}
      </select>
      <textarea
        value={comment}
        onChange={(e) => setComment(e.target.value)}
        placeholder="Коментар (необов'язково)"
        rows={2}
        className="text-sm"
      />
      <button
        type="submit"
        disabled={loading}
        className="text-sm bg-brand-600 text-white px-3 py-1 rounded-lg hover:bg-brand-700"
      >
        {loading ? "..." : "Надіслати відгук"}
      </button>
    </form>
  );
}
