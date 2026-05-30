"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

type AdminSupportActionsProps = {
  ticketId: string;
  status: string;
  adminNote?: string | null;
};

export default function AdminSupportActions({
  ticketId,
  status,
  adminNote: initialNote = "",
}: AdminSupportActionsProps) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [adminNote, setAdminNote] = useState(initialNote || "");

  async function updateTicket(payload: { status?: string; adminNote?: string }) {
    setLoading(true);
    await fetch(`/api/admin/support/${ticketId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    setLoading(false);
    router.refresh();
  }

  return (
    <div className="flex flex-col gap-2 shrink-0 w-full sm:w-64">
      {status === "OPEN" && (
        <button
          onClick={() => updateTicket({ status: "RESOLVED", adminNote })}
          disabled={loading}
          className="text-sm bg-brand-600 text-white px-4 py-2 rounded-xl hover:bg-brand-700 font-semibold"
        >
          ✓ Вирішено
        </button>
      )}
      {status === "RESOLVED" && (
        <button
          onClick={() => updateTicket({ status: "OPEN" })}
          disabled={loading}
          className="text-sm border px-3 py-2 rounded-xl hover:bg-gray-50"
        >
          Відкрити знову
        </button>
      )}
      <textarea
        value={adminNote}
        onChange={(e) => setAdminNote(e.target.value)}
        rows={2}
        placeholder="Нотатка адміна..."
        className="text-sm w-full"
      />
      <button
        onClick={() => updateTicket({ adminNote })}
        disabled={loading}
        className="text-sm border px-3 py-1 rounded-lg hover:bg-gray-50"
      >
        Зберегти нотатку
      </button>
    </div>
  );
}
