"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { formatDate } from "@/lib/utils";

type Message = {
  id: string;
  content: string;
  createdAt: string;
  senderId: string;
  receiverId: string;
  listingId: string;
  sender: { id: string; name: string };
  receiver: { id: string; name: string };
  listing: { id: string; title: string };
};

type MessagesClientProps = {
  initialMessages: Message[];
  currentUserId: string;
  listingId?: string;
};

export default function MessagesClient({
  initialMessages,
  currentUserId,
  listingId,
}: MessagesClientProps) {
  const router = useRouter();
  const [messages] = useState(initialMessages);
  const [content, setContent] = useState("");
  const [loading, setLoading] = useState(false);

  const lastMessage = messages[messages.length - 1];
  const replyReceiverId =
    lastMessage?.senderId === currentUserId
      ? lastMessage.receiverId
      : lastMessage?.senderId;
  const activeListingId = listingId || lastMessage?.listingId;

  async function handleSend(e: React.FormEvent) {
    e.preventDefault();
    if (!content.trim() || !replyReceiverId || !activeListingId) return;

    setLoading(true);
    await fetch("/api/messages", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        listingId: activeListingId,
        receiverId: replyReceiverId,
        content,
      }),
    });
    setContent("");
    setLoading(false);
    router.refresh();
  }

  if (messages.length === 0) {
    return (
      <div className="bg-white rounded-xl border p-8 text-center text-gray-500">
        Повідомлень поки немає. Напишіть продавцю зі сторінки товару.
      </div>
    );
  }

  return (
    <div className="bg-white rounded-xl border overflow-hidden">
      {listingId && lastMessage && (
        <div className="px-4 py-3 border-b bg-gray-50 text-sm">
          Товар: <span className="font-medium">{lastMessage.listing.title}</span>
        </div>
      )}

      <div className="p-4 space-y-4 max-h-96 overflow-y-auto">
        {messages.map((msg) => {
          const isMine = msg.senderId === currentUserId;
          return (
            <div key={msg.id} className={`flex ${isMine ? "justify-end" : "justify-start"}`}>
              <div
                className={`max-w-[80%] rounded-xl px-4 py-2 ${
                  isMine ? "bg-brand-600 text-white" : "bg-gray-100 text-gray-900"
                }`}
              >
                {!listingId && (
                  <p className="text-xs opacity-70 mb-1">{msg.listing.title}</p>
                )}
                <p>{msg.content}</p>
                <p className={`text-xs mt-1 ${isMine ? "text-brand-100" : "text-gray-400"}`}>
                  {msg.sender.name} · {formatDate(msg.createdAt)}
                </p>
              </div>
            </div>
          );
        })}
      </div>

      {replyReceiverId && activeListingId && (
        <form onSubmit={handleSend} className="p-4 border-t flex gap-2">
          <input
            value={content}
            onChange={(e) => setContent(e.target.value)}
            placeholder="Ваша відповідь..."
            className="flex-1"
          />
          <button
            type="submit"
            disabled={loading}
            className="bg-brand-600 text-white px-4 py-2 rounded-lg hover:bg-brand-700"
          >
            Надіслати
          </button>
        </form>
      )}
    </div>
  );
}
