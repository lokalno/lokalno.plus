"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

type AdminWithdrawalActionsProps = {
  withdrawalId: string;
};

export default function AdminWithdrawalActions({ withdrawalId }: AdminWithdrawalActionsProps) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  async function updateStatus(status: "COMPLETED" | "REJECTED") {
    setLoading(true);
    await fetch(`/api/admin/withdrawals/${withdrawalId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status }),
    });
    setLoading(false);
    router.refresh();
  }

  return (
    <div className="flex gap-2 flex-wrap">
      <button
        type="button"
        disabled={loading}
        onClick={() => updateStatus("COMPLETED")}
        className="text-sm bg-brand-600 text-white px-3 py-1 rounded-lg hover:bg-brand-700"
      >
        ✓ Переказано
      </button>
      <button
        type="button"
        disabled={loading}
        onClick={() => updateStatus("REJECTED")}
        className="text-sm text-red-600 px-3 py-1 rounded-lg hover:bg-red-50"
      >
        Відхилити
      </button>
    </div>
  );
}
