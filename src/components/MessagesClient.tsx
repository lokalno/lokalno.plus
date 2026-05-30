"use client";

import { useState } from "react";
import Link from "next/link";
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

export type Conversation = {
  listingId: string;
  listingTitle: string;
  partnerId: string;
  partnerName: string;
  lastMessage: Message;
};

export function buildConversations(messages: Message[], currentUserId: string): Conversation[] {
  const map = new Map<string, Conversation>();

  for (const msg of messages) {
    const partnerId = msg.senderId === currentUserId ? msg.receiverId : msg.senderId;
    const partnerName = msg.senderId === currentUserId ? msg.receiver.name : msg.sender.name;
    const key = `${msg.listingId}:${partnerId}`;
    const existing = map.get(key);

    if (
      !existing ||
      new Date(msg.createdAt).getTime() > new Date(existing.lastMessage.createdAt).getTime()
    ) {
      map.set(key, {
        listingId: msg.listingId,
        listingTitle: msg.listing.title,
        partnerId,
        partnerName,
        lastMessage: msg,
      });
    }
  }

  return Array.from(map.values()).sort(
    (a, b) =>
      new Date(b.lastMessage.createdAt).getTime() - new Date(a.lastMessage.createdAt).getTime()
  );
}

type MessagesClientProps = {
  initialMessages: Message[];
  currentUserId: string;
  listingId?: string;
  partnerId?: string;
};

export default function MessagesClient({
  initialMessages,
  currentUserId,
  listingId,
  partnerId,
}: MessagesClientProps) {
  const router = useRouter();
  const messages = initialMessages;
  const [content, setContent] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const lastMessage = messages[messages.length - 1];
  const replyReceiverId =
    partnerId ||
    (lastMessage?.senderId === currentUserId
      ? lastMessage.receiverId
      : lastMessage?.senderId);
  const activeListingId = listingId || lastMessage?.listingId;
  const partnerName =
    partnerId && lastMessage
      ? lastMessage.senderId === partnerId
        ? lastMessage.sender.name
        : lastMessage.receiver.name
      : null;

  async function handleSend(e: React.FormEvent) {
    e.preventDefault();
    if (!content.trim() || !replyReceiverId || !activeListingId) return;

    setLoading(true);
    setError("");
    const res = await fetch("/api/messages", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        listingId: activeListingId,
        receiverId: replyReceiverId,
        content,
      }),
    });

    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      setError(data.error || "Не вдалося надіслати повідомлення");
      setLoading(false);
      return;
    }

    setContent("");
    setLoading(false);
    router.refresh();
  }

  if (!listingId && !partnerId) {
    const conversations = buildConversations(messages, currentUserId);

    if (conversations.length === 0) {
      return (
        <div className="bg-white rounded-xl border p-8 text-center text-gray-500">
          Повідомлень поки немає. Напишіть продавцю зі сторінки товару.
        </div>
      );
    }

    return (
      <div className="bg-white rounded-xl border divide-y">
        {conversations.map((conversation) => (
          <Link
            key={`${conversation.listingId}:${conversation.partnerId}`}
            href={`/messages?listingId=${conversation.listingId}&partnerId=${conversation.partnerId}`}
            className="block px-4 py-4 hover:bg-gray-50 transition-colors"
          >
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <p className="font-medium text-gray-900 truncate">{conversation.partnerName}</p>
                <p className="text-sm text-gray-500 truncate">{conversation.listingTitle}</p>
                <p className="text-sm text-gray-700 mt-1 truncate">
                  {conversation.lastMessage.content}
                </p>
              </div>
              <span className="text-xs text-gray-400 shrink-0">
                {formatDate(conversation.lastMessage.createdAt)}
              </span>
            </div>
          </Link>
        ))}
      </div>
    );
  }

  if (messages.length === 0) {
    return (
      <div className="bg-white rounded-xl border p-8 text-center text-gray-500">
        <p>Повідомлень у цьому чаті поки немає.</p>
        <Link href="/messages" className="inline-block mt-3 text-brand-700 hover:underline">
          ← Усі діалоги
        </Link>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-xl border overflow-hidden">
      <div className="px-4 py-3 border-b bg-gray-50 text-sm flex items-center justify-between gap-3">
        <div className="min-w-0">
          {partnerName && (
            <p className="font-medium text-gray-900 truncate">Чат з {partnerName}</p>
          )}
          {lastMessage && (
            <p className="text-gray-600 truncate">
              Товар: <span className="font-medium">{lastMessage.listing.title}</span>
            </p>
          )}
        </div>
        <Link href="/messages" className="text-brand-700 hover:underline shrink-0">
          ← Усі
        </Link>
      </div>

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
        <form onSubmit={handleSend} className="p-4 border-t space-y-2">
          <div className="flex gap-2">
            <input
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder="Ваше повідомлення..."
              className="flex-1"
            />
            <button
              type="submit"
              disabled={loading}
              className="bg-brand-600 text-white px-4 py-2 rounded-lg hover:bg-brand-700"
            >
              Надіслати
            </button>
          </div>
          {error && <p className="text-sm text-red-600">{error}</p>}
        </form>
      )}
    </div>
  );
}
