const MIN_WITHDRAWAL = 100;
const MAX_WITHDRAWAL = 500_000;

export function maskCardNumber(cardNumber: string): string {
  const digits = cardNumber.replace(/\D/g, "");
  if (digits.length < 4) return "****";
  return `**** **** **** ${digits.slice(-4)}`;
}

export function normalizeCardNumber(cardNumber: string): string | null {
  const digits = cardNumber.replace(/\D/g, "");
  if (digits.length < 13 || digits.length > 19) return null;
  return digits;
}

export function validateWithdrawalAmount(balance: number, amount: unknown):
  | { ok: true; amount: number }
  | { ok: false; error: string } {
  const value = typeof amount === "number" ? amount : Number(amount);
  if (!Number.isFinite(value) || value <= 0) {
    return { ok: false, error: "Вкажіть суму виведення" };
  }
  if (value < MIN_WITHDRAWAL) {
    return { ok: false, error: `Мінімальна сума виведення — ${MIN_WITHDRAWAL} ₴` };
  }
  if (value > MAX_WITHDRAWAL) {
    return { ok: false, error: `Максимальна сума одного виведення — ${MAX_WITHDRAWAL} ₴` };
  }
  if (value > balance) {
    return { ok: false, error: "Недостатньо коштів на балансі" };
  }
  return { ok: true, amount: Math.round(value * 100) / 100 };
}

export function validatePayoutCard(cardHolder: unknown, cardNumber: unknown):
  | { ok: true; cardHolder: string; cardNumber: string; cardLast4: string }
  | { ok: false; error: string } {
  const holder = typeof cardHolder === "string" ? cardHolder.trim() : "";
  const normalized = typeof cardNumber === "string" ? normalizeCardNumber(cardNumber) : null;

  if (holder.length < 3) {
    return { ok: false, error: "Вкажіть ім'я власника картки" };
  }
  if (!normalized) {
    return { ok: false, error: "Вкажіть коректний номер банківської картки" };
  }

  return {
    ok: true,
    cardHolder: holder,
    cardNumber: normalized,
    cardLast4: normalized.slice(-4),
  };
}

export const WALLET_TRANSACTION_TYPES: Record<string, string> = {
  SALE: "Продаж",
  WITHDRAWAL: "Виведення",
  WITHDRAWAL_REFUND: "Повернення виведення",
  SALE_REFUND: "Повернення продажу",
};

export const WITHDRAWAL_STATUSES: Record<string, string> = {
  PENDING: "Очікує переказу",
  COMPLETED: "Виконано",
  REJECTED: "Відхилено",
};

export const PAYMENT_STATUSES: Record<string, string> = {
  UNPAID: "Не оплачено",
  PAID: "Оплачено",
  REFUNDED: "Повернено",
};
