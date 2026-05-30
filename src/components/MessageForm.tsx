"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import MessageChatInput from "@/components/MessageChatInput";

type MessageFormProps = {
  listingId: string;
  receiverId: string;
};

export default function MessageForm({ listingId, receiverId }: MessageFormProps) {
  const router = useRouter();
  const [content, setContent] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function handleSend(payload: { content: string; imageUrl: string | null }) {
    setLoading(true);
    setError("");
    try {
      const res = await fetch("/api/messages", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          listingId,
          receiverId,
          content: payload.content,
          imageUrl: payload.imageUrl,
        }),
      });

      if (res.ok) {
        setContent("");
        router.push(`/messages?listingId=${listingId}&partnerId=${receiverId}`);
        return true;
      }

      const data = await res.json().catch(() => ({}));
      setError(data.error || "Не вдалося надіслати повідомлення");
      return false;
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="mt-4">
      <MessageChatInput
        content={content}
        onContentChange={setContent}
        onSend={handleSend}
        loading={loading}
        error={error}
        placeholder="Написати продавцю..."
      />
    </div>
  );
}
