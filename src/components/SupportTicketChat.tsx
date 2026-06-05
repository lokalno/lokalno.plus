"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import MessageBubble from "@/components/MessageBubble";
import type { SupportTicketPayload } from "@/lib/support-chat";

const POLL_INTERVAL_MS = 15_000;

type SupportTicketChatProps = {
  ticketId: string;
  initialTicket: SupportTicketPayload;
  currentUserId: string;
  isAdminView: boolean;
};

export default function SupportTicketChat({
  ticketId,
  initialTicket,
  currentUserId,
  isAdminView,
}: SupportTicketChatProps) {
  const [ticket, setTicket] = useState(initialTicket);
  const [content, setContent] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const scrollRef = useRef<HTMLDivElement>(null);

  const fetchTicket = useCallback(async () => {
    const res = await fetch(`/api/support/${ticketId}`, { cache: "no-store" });
    if (!res.ok) return;
    const data: SupportTicketPayload = await res.json();
    setTicket(data);
  }, [ticketId]);

  useEffect(() => {
    setTicket(initialTicket);
  }, [initialTicket]);

  useEffect(() => {
    void fetchTicket();

    const tick = () => {
      if (document.visibilityState === "visible") void fetchTicket();
    };

    const intervalId = window.setInterval(tick, POLL_INTERVAL_MS);
    document.addEventListener("visibilitychange", tick);

    return () => {
      window.clearInterval(intervalId);
      document.removeEventListener("visibilitychange", tick);
    };
  }, [fetchTicket]);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
  }, [ticket.replies.length]);

  async function handleSend(e: React.FormEvent) {
    e.preventDefault();
    const text = content.trim();
    if (!text) return;

    setLoading(true);
    setError("");

    const res = await fetch(`/api/support/${ticketId}/replies`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ content: text }),
    });

    const data = await res.json().catch(() => ({}));
    setLoading(false);

    if (!res.ok) {
      setError(data.error || "Не вдалося надіслати");
      return;
    }

    setContent("");
    await fetchTicket();
  }

  const chatItems = [
    {
      id: "initial",
      content: ticket.message,
      senderName: ticket.user.name,
      createdAt: ticket.createdAt,
      isMine: !isAdminView,
      isAdmin: false,
    },
    ...ticket.replies.map((r) => ({
      id: r.id,
      content: r.content,
      senderName: r.isAdmin ? "Підтримка" : r.author.name,
      createdAt: r.createdAt,
      isMine: isAdminView ? r.isAdmin : !r.isAdmin,
      isAdmin: r.isAdmin,
    })),
  ];

  return (
    <div className="bg-white rounded-xl border overflow-hidden">
      <div ref={scrollRef} className="p-4 space-y-4 max-h-[28rem] overflow-y-auto min-h-[200px]">
        {chatItems.map((item) => (
          <div key={item.id} className={`flex ${item.isMine ? "justify-end" : "justify-start"}`}>
            <MessageBubble
              content={item.content}
              senderName={item.senderName}
              createdAt={item.createdAt}
              isMine={item.isMine}
            />
          </div>
        ))}
      </div>

      <form onSubmit={handleSend} className="p-4 border-t bg-gray-50 space-y-2">
        <textarea
          value={content}
          onChange={(e) => setContent(e.target.value)}
          rows={3}
          placeholder={isAdminView ? "Відповідь користувачу..." : "Ваше повідомлення..."}
          className="w-full"
        />
        {error && <p className="text-sm text-red-600">{error}</p>}
        <button
          type="submit"
          disabled={loading || !content.trim()}
          className="bg-brand-600 text-white px-4 py-2 rounded-xl hover:bg-brand-700 disabled:opacity-50 font-medium"
        >
          {loading ? "Надсилання..." : "Надіслати"}
        </button>
      </form>
    </div>
  );
}
