export const ORDER_RETURN_REASONS = [
  "NOT_AS_DESCRIBED",
  "DEFECTIVE",
  "WRONG_ITEM",
  "SIZE_OR_COLOR",
  "CHANGED_MIND",
  "OTHER",
] as const;

export type OrderReturnReason = (typeof ORDER_RETURN_REASONS)[number];

export const ORDER_RETURN_REASON_LABELS: Record<OrderReturnReason, string> = {
  NOT_AS_DESCRIBED: "Товар не відповідає опису",
  DEFECTIVE: "Товар пошкоджений або не працює",
  WRONG_ITEM: "Прийшов не той товар",
  SIZE_OR_COLOR: "Не підійшов розмір або колір",
  CHANGED_MIND: "Передумав(ла)",
  OTHER: "Інша причина",
};

export type OrderReturnInput = {
  returnReason?: string | null;
  returnReasonNote?: string | null;
};

export function isOrderReturnReason(value: string): value is OrderReturnReason {
  return (ORDER_RETURN_REASONS as readonly string[]).includes(value);
}

export function getReturnReasonLabel(
  reason: string | null | undefined,
  note?: string | null
): string {
  if (!reason) return "";
  if (isOrderReturnReason(reason)) {
    const base = ORDER_RETURN_REASON_LABELS[reason];
    if (reason === "OTHER" && note?.trim()) {
      return `${base}: ${note.trim()}`;
    }
    return base;
  }
  return reason;
}

export function validateReturnRequestInput(
  input: OrderReturnInput
): { ok: true; reason: OrderReturnReason; note: string | null } | { ok: false; error: string } {
  const reason = input.returnReason?.trim();
  if (!reason || !isOrderReturnReason(reason)) {
    return { ok: false, error: "Оберіть причину повернення" };
  }
  if (reason === "OTHER" && !input.returnReasonNote?.trim()) {
    return { ok: false, error: "Опишіть причину повернення" };
  }
  return {
    ok: true,
    reason,
    note: input.returnReasonNote?.trim() || null,
  };
}
