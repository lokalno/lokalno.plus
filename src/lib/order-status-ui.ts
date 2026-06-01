export const BUYER_ORDER_PLACED_MESSAGE =
  "Замовлення оформлено. Оплатіть товар на відділенні Nova Poshta, коли заберете посилку. Очікуйте підтвердження від продавця.";

export type BuyerOrderStatusBanner = {
  className: string;
  title: string;
  message: string;
};

type BuyerOrderBannerContext = {
  cancelledBySeller?: boolean;
  cancelledByBuyer?: boolean;
  novaPoshtaTtn?: string | null;
};

export function getBuyerOrderStatusBanner(
  status: string,
  context?: BuyerOrderBannerContext
): BuyerOrderStatusBanner | null {
  if (status === "PENDING") {
    return {
      className: "border-amber-200 bg-amber-50 text-amber-950",
      title: "Замовлення в обробці",
      message: BUYER_ORDER_PLACED_MESSAGE,
    };
  }

  if (status === "CONFIRMED") {
    return {
      className: "border-emerald-200 bg-emerald-50 text-emerald-950",
      title: "Замовлення прийнято",
      message:
        "Продавець підтвердив замовлення і готує відправку Nova Poshta. Оплата — лише на відділенні при отриманні.",
    };
  }

  if (status === "SHIPPED") {
    return {
      className: "border-violet-200 bg-violet-50 text-violet-950",
      title: "Посилка на відділенні Nova Poshta",
      message: context?.novaPoshtaTtn
        ? `ТТН: ${context.novaPoshtaTtn}. Заберіть посилку та оплатіть на відділенні готівкою або карткою.`
        : "Заберіть посилку на відділенні Nova Poshta та оплатіть при отриманні.",
    };
  }

  if (status === "CANCELLED") {
    if (context?.cancelledBySeller) {
      return {
        className: "border-red-200 bg-red-50 text-red-950",
        title: "Замовлення скасовано продавцем",
        message:
          "Продавець скасував це замовлення. Вам надійшло сповіщення в повідомленнях — перевірте 💬 у шапці сайту.",
      };
    }

    if (context?.cancelledByBuyer) {
      return {
        className: "border-gray-200 bg-gray-50 text-gray-800",
        title: "Замовлення скасовано",
        message: "Ви скасували це замовлення.",
      };
    }

    return {
      className: "border-red-200 bg-red-50 text-red-950",
      title: "Замовлення скасовано",
      message: "Це замовлення більше не активне.",
    };
  }

  return null;
}
