/** Оплата на відділенні Nova Poshta (контроль оплати / післяплата). */
export const ORDER_PAYMENT_NP_COD = "NP_COD";
export const ORDER_PAYMENT_NP_COD_RECEIVED = "NP_COD_RECEIVED";

export const ORDER_PAYMENT_LABELS: Record<string, string> = {
  NP_COD: "Оплата при отриманні (Nova Poshta)",
  NP_COD_RECEIVED: "Оплачено на Nova Poshta",
  UNPAID: "Оплата при отриманні (Nova Poshta)",
  PAID: "Оплачено (на сайті)",
  REFUNDED: "Повернено",
};

export function formatOrderPaymentStatus(status: string): string {
  return ORDER_PAYMENT_LABELS[status] || status;
}

export function isNovaPoshtaCodPayment(status: string): boolean {
  return status === ORDER_PAYMENT_NP_COD || status === ORDER_PAYMENT_NP_COD_RECEIVED || status === "UNPAID";
}

export const BUYER_NP_COD_NOTICE =
  "Оплата лише на відділенні Nova Poshta при отриманні посилки. На сайті гроші не списуються.";

export const SELLER_NP_COD_NOTICE =
  "Кошти надійдуть на ваш рахунок Nova Poshta після того, як покупець забере посилку та оплатить на відділенні.";
