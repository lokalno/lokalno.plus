"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { formatDate } from "@/lib/utils";
import { messagePreview } from "@/lib/message-image";
import MessageBubble from "@/components/MessageBubble";
import MessageChatInput from "@/components/MessageChatInput";
import { dispatchNotificationRefresh } from "@/components/HeaderNotifications";

type Message = {
  id: string;
  content: string;
  imageUrl?: string | null;
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

const POLL_INTERVAL_MS = 30_000;

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

function buildMessagesUrl(listingId?: string, partnerId?: string) {
  const params = new URLSearchParams();
  if (listingId) params.set("listingId", listingId);
  if (partnerId) params.set("partnerId", partnerId);
  const query = params.toString();
  return query ? `/api/messages?${query}` : "/api/messages";
}

type MessagesClientProps = {
  initialMessages: Message[];
  currentUserId: string;
  listingId?: string;
  partnerId?: string;
  threadPartnerName?: string;
  threadListingTitle?: string;
};

export default function MessagesClient({
  initialMessages,
  currentUserId,
  listingId,
  partnerId,
  threadPartnerName,
  threadListingTitle,
}: MessagesClientProps) {
  const [messages, setMessages] = useState(initialMessages);
  const [content, setContent] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const scrollRef = useRef<HTMLDivElement>(null);
  const prevCountRef = useRef(initialMessages.length);

  const inThread = Boolean(listingId && partnerId);
  const inList = !listingId && !partnerId;

  const fetchMessages = useCallback(async () => {
    const res = await fetch(buildMessagesUrl(listingId, partnerId), { cache: "no-store" });
    if (!res.ok) return;
    const data: Message[] = await res.json();
    setMessages(data);
    if (inThread) {
      if (listingId) {
        await fetch("/api/price-offers/mark-read", {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ scope: "buyer", listingId }),
        }).catch(() => {});
      }
      dispatchNotificationRefresh();
    }
  }, [listingId, partnerId, inThread]);

  useEffect(() => {
    setMessages(initialMessages);
  }, [initialMessages]);

  useEffect(() => {
    if (!inThread) return;

    void fetchMessages();

    const tick = () => {
      if (document.visibilityState === "visible") {
        void fetchMessages();
      }
    };

    const intervalId = window.setInterval(tick, POLL_INTERVAL_MS);
    const onVisible = () => {
      if (document.visibilityState === "visible") void fetchMessages();
    };
    document.addEventListener("visibilitychange", onVisible);

    return () => {
      window.clearInterval(intervalId);
      document.removeEventListener("visibilitychange", onVisible);
    };
  }, [fetchMessages, inThread]);

  useEffect(() => {
    if (!inThread || messages.length <= prevCountRef.current) {
      prevCountRef.current = messages.length;
      return;
    }

    prevCountRef.current = messages.length;
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
  }, [messages, inThread]);

  const lastMessage = messages[messages.length - 1];
  const replyReceiverId =
    partnerId ||
    (lastMessage?.senderId === currentUserId
      ? lastMessage.receiverId
      : lastMessage?.senderId);
  const activeListingId = listingId || lastMessage?.listingId;
  const partnerName =
    (partnerId && lastMessage
      ? lastMessage.senderId === partnerId
        ? lastMessage.sender.name
        : lastMessage.receiver.name
      : null) ||
    threadPartnerName ||
    null;
  const listingTitle = lastMessage?.listing.title || threadListingTitle || null;

  async function handleSend(payload: { content: string; imageUrl: string | null }) {
    if ((!payload.content && !payload.imageUrl) || !replyReceiverId || !activeListingId) {
      return false;
    }

    setLoading(true);
    setError("");
    const res = await fetch("/api/messages", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        listingId: activeListingId,
        receiverId: replyReceiverId,
        content: payload.content,
        imageUrl: payload.imageUrl,
      }),
    });

    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      setError(data.error || "Не вдалося надіслати повідомлення");
      setLoading(false);
      return false;
    }

    setContent("");
    setLoading(false);
    await fetchMessages();
    return true;
  }

  if (inList) {
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
                  {messagePreview(
                    conversation.lastMessage.content,
                    conversation.lastMessage.imageUrl
                  )}
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

  if (!inList && inThread) {
    return (
      <div className="bg-white rounded-xl border overflow-hidden">
        <div className="px-4 py-3 border-b bg-gray-50 text-sm flex items-center justify-between gap-3">
          <div className="min-w-0">
            {partnerName && (
              <p className="font-medium text-gray-900 truncate">Чат з {partnerName}</p>
            )}
            {listingTitle && (
              <p className="text-gray-600 truncate">
                Товар: <span className="font-medium">{listingTitle}</span>
              </p>
            )}
          </div>
          <Link href="/messages" className="text-brand-700 hover:underline shrink-0">
            ← Усі
          </Link>
        </div>

        <div ref={scrollRef} className="p-4 space-y-4 max-h-96 overflow-y-auto min-h-[160px]">
          {messages.length === 0 ? (
            <p className="py-10 text-center text-gray-500">
              Повідомлень поки немає. Напишіть перше повідомлення нижче.
            </p>
          ) : (
            messages.map((msg) => {
              const isMine = msg.senderId === currentUserId;
              return (
                <div key={msg.id} className={`flex ${isMine ? "justify-end" : "justify-start"}`}>
                  <MessageBubble
                    content={msg.content}
                    imageUrl={msg.imageUrl}
                    senderName={msg.sender.name}
                    createdAt={msg.createdAt}
                    isMine={isMine}
                  />
                </div>
              );
            })
          )}
        </div>

        {replyReceiverId && activeListingId && (
          <div className="p-4 border-t">
            <MessageChatInput
              content={content}
              onContentChange={setContent}
              onSend={handleSend}
              loading={loading}
              error={error}
            />
          </div>
        )}
      </div>
    );
  }

  if (messages.length === 0 && !inThread) {
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
    <div className="bg-white rounded-xl border p-8 text-center text-gray-500">
      <p>Не вдалося відкрити чат. Перевірте посилання або поверніться до списку діалогів.</p>
      <Link href="/messages" className="inline-block mt-3 text-brand-700 hover:underline">
        ← Усі діалоги
      </Link>
    </div>
  );
}
