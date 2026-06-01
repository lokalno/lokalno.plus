export function formatPriceOfferMessage(
  amount: number,
  listingPrice: number,
  comment?: string | null
): string {
  const amountLabel = formatUah(amount);
  const listingLabel = formatUah(listingPrice);

  let text = `💰 Пропозиція ціни: ${amountLabel} (оголошена ціна: ${listingLabel})`;
  const trimmed = comment?.trim();
  if (trimmed) {
    text += `\nКоментар: ${trimmed}`;
  }
  return text;
}

export function formatPriceOfferAcceptedMessage(amount: number, listingTitle: string): string {
  return `✅ Продавець погодився на вашу ціну ${formatUah(amount)} за «${listingTitle}». Можете перейти до оплати за погодженою ціною на сторінці товару.`;
}

export function formatPriceOfferRejectedMessage(amount: number, listingTitle: string): string {
  return `❌ Продавець відхилив вашу пропозицію ${formatUah(amount)} за «${listingTitle}». Можете запропонувати іншу суму або купити за ціною в оголошенні.`;
}

export function roundMoneyAmount(amount: number): number {
  return Math.round(amount * 100) / 100;
}

export function getMaxPriceOfferAmount(listingPrice: number): number {
  const max = roundMoneyAmount(listingPrice - 0.01);
  return max > 0 ? max : 0;
}

export function canAcceptPriceOffers(listingPrice: number): boolean {
  return getMaxPriceOfferAmount(listingPrice) >= 0.01;
}

export function validatePriceOfferAmount(
  amount: unknown,
  listingPrice: number
): { ok: true; amount: number } | { ok: false; error: string } {
  if (!canAcceptPriceOffers(listingPrice)) {
    return {
      ok: false,
      error: "Для цього товару торг недоступний — ціна в оголошенні занадто низька",
    };
  }

  const numeric = typeof amount === "string" ? Number(amount.replace(",", ".")) : Number(amount);

  if (!Number.isFinite(numeric) || numeric <= 0) {
    return { ok: false, error: "Вкажіть коректну суму пропозиції" };
  }

  const normalized = roundMoneyAmount(numeric);

  if (normalized >= roundMoneyAmount(listingPrice)) {
    return {
      ok: false,
      error: "Пропозиція має бути нижчою за ціну в оголошенні — можна лише меншу суму, з копійками",
    };
  }

  if (normalized < 0.01) {
    return { ok: false, error: "Мінімальна пропозиція — 0,01 ₴" };
  }

  return { ok: true, amount: normalized };
}

function formatUah(amount: number): string {
  const hasKopecks = Math.round(amount * 100) % 100 !== 0;
  return new Intl.NumberFormat("uk-UA", {
    style: "currency",
    currency: "UAH",
    minimumFractionDigits: hasKopecks ? 2 : 0,
    maximumFractionDigits: 2,
  }).format(amount);
}

export const PRICE_OFFER_STATUS_LABELS: Record<string, string> = {
  PENDING: "Очікує відповіді",
  ACCEPTED: "Погоджено",
  REJECTED: "Відхилено",
  USED: "Оформлено замовлення",
  CLOSED: "Замовлення скасовано",
};

export type BuyerOfferView = {
  id: string;
  amount: number;
  status: string;
  orderId: string | null;
  orderStatus?: string | null;
};

export type BuyerOfferUiState =
  | "none"
  | "pending"
  | "accepted"
  | "rejected"
  | "used";

export function getBuyerOfferUiState(offer: BuyerOfferView | null | undefined): BuyerOfferUiState {
  if (!offer) return "none";

  if (offer.status === "PENDING") return "pending";

  if (offer.status === "ACCEPTED" && !offer.orderId) return "accepted";

  if (offer.status === "REJECTED") return "rejected";

  if (offer.status === "CLOSED") return "none";

  if (offer.status === "USED") {
    if (offer.orderStatus === "CANCELLED") return "none";
    return "used";
  }

  return "none";
}

export function canSubmitNewPriceOffer(offer: BuyerOfferView | null | undefined): boolean {
  const state = getBuyerOfferUiState(offer);
  return state === "none" || state === "rejected";
}
