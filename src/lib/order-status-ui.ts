export const BUYER_ORDER_PLACED_MESSAGE =
  "Замовлення успішно оформлено і знаходиться в обробці. Очікуйте підтвердження від продавця.";

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
        "Продавець підтвердив замовлення. Очікуйте відправку Nova Poshta по всій Україні — надішлемо ТТН для відстеження.",
    };
  }

  if (status === "SHIPPED") {
    return {
      className: "border-violet-200 bg-violet-50 text-violet-950",
      title: "Замовлення відправлено",
      message: context?.novaPoshtaTtn
        ? `Посилку відправлено Nova Poshta. ТТН: ${context.novaPoshtaTtn}. Відстежуйте доставку за номером накладної.`
        : "Посилку відправлено Nova Poshta по Україні.",
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
