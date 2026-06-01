import { formatPrice } from "@/lib/utils";
import {
  BUYER_NP_COD_NOTICE,
  SELLER_NP_COD_NOTICE,
  formatOrderPaymentStatus,
  isNovaPoshtaCodPayment,
} from "@/lib/order-payment";

type OrderPaymentInfoProps = {
  paymentStatus: string;
  orderTotal: number;
  isBuyer?: boolean;
  isSeller?: boolean;
  orderStatus?: string;
};

export default function OrderPaymentInfo({
  paymentStatus,
  orderTotal,
  isBuyer = false,
  isSeller = false,
  orderStatus,
}: OrderPaymentInfoProps) {
  if (paymentStatus === "PAID") {
    return (
      <p className="mt-2 text-sm text-gray-500">
        {formatOrderPaymentStatus(paymentStatus)} · {formatPrice(orderTotal)} (старе замовлення через сайт)
      </p>
    );
  }

  if (paymentStatus === "NP_COD_RECEIVED" || (orderStatus === "COMPLETED" && isNovaPoshtaCodPayment(paymentStatus))) {
    return (
      <div className="mt-3 rounded-lg border border-emerald-200 bg-emerald-50 p-3 text-sm text-emerald-950">
        <p className="font-semibold">✓ Оплата на Nova Poshta</p>
        <p className="mt-1">
          {isSeller
            ? `Покупець отримав посилку та оплатив ${formatPrice(orderTotal)} на відділенні. Кошти надійдуть на ваш рахунок Nova Poshta.`
            : `Ви оплатили ${formatPrice(orderTotal)} при отриманні на відділенні Nova Poshta.`}
        </p>
      </div>
    );
  }

  if (isNovaPoshtaCodPayment(paymentStatus)) {
    return (
      <div className="mt-3 rounded-lg border border-blue-200 bg-blue-50/80 p-3 text-sm text-blue-950">
        <p className="font-semibold">
          💳 {formatOrderPaymentStatus(paymentStatus)} · {formatPrice(orderTotal)}
        </p>
        <p className="mt-1">{isSeller ? SELLER_NP_COD_NOTICE : BUYER_NP_COD_NOTICE}</p>
        {isBuyer && orderStatus === "SHIPPED" && (
          <p className="mt-2 font-medium">
            Заберіть посилку на відділенні та оплатіть {formatPrice(orderTotal)} готівкою або карткою.
          </p>
        )}
      </div>
    );
  }

  return null;
}
