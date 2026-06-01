export type OrderShippingInput = {
  recipientFirstName?: unknown;
  recipientLastName?: unknown;
  recipientPhone?: unknown;
  deliveryOblast?: unknown;
  deliveryRaion?: unknown;
  deliveryCity?: unknown;
  deliveryWarehouse?: unknown;
};

export type ValidatedOrderShipping = {
  deliveryMethod: "NOVA_POSHTA";
  recipientFirstName: string;
  recipientLastName: string;
  recipientPhone: string;
  deliveryOblast: string;
  deliveryRaion: string;
  deliveryCity: string;
  deliveryWarehouse: string;
};

function clean(value: unknown): string {
  return typeof value === "string" ? value.trim() : "";
}

function normalizePhone(phone: string): string | null {
  const digits = phone.replace(/\D/g, "");
  if (digits.length === 10 && digits.startsWith("0")) return digits;
  if (digits.length === 12 && digits.startsWith("380")) return `0${digits.slice(3)}`;
  return null;
}

export function validateOrderShipping(
  input: OrderShippingInput
): { ok: true; data: ValidatedOrderShipping } | { ok: false; error: string } {
  const recipientFirstName = clean(input.recipientFirstName);
  const recipientLastName = clean(input.recipientLastName);
  const recipientPhoneRaw = clean(input.recipientPhone);
  const deliveryOblast = clean(input.deliveryOblast);
  const deliveryRaion = clean(input.deliveryRaion);
  const deliveryCity = clean(input.deliveryCity);
  const deliveryWarehouse = clean(input.deliveryWarehouse);

  if (recipientFirstName.length < 2) {
    return { ok: false, error: "Вкажіть ім'я отримувача" };
  }
  if (recipientLastName.length < 2) {
    return { ok: false, error: "Вкажіть прізвище отримувача" };
  }

  const recipientPhone = normalizePhone(recipientPhoneRaw);
  if (!recipientPhone) {
    return { ok: false, error: "Вкажіть коректний номер телефону (напр. 0671234567)" };
  }

  if (deliveryOblast.length < 2) {
    return { ok: false, error: "Вкажіть область доставки" };
  }
  if (deliveryRaion.length < 2) {
    return { ok: false, error: "Вкажіть район доставки" };
  }
  if (deliveryCity.length < 2) {
    return { ok: false, error: "Вкажіть місто або село доставки" };
  }
  if (deliveryWarehouse.length < 1) {
    return { ok: false, error: "Вкажіть відділення або адресу Nova Poshta" };
  }

  return {
    ok: true,
    data: {
      deliveryMethod: "NOVA_POSHTA",
      recipientFirstName,
      recipientLastName,
      recipientPhone,
      deliveryOblast,
      deliveryRaion,
      deliveryCity,
      deliveryWarehouse,
    },
  };
}

export function formatOrderDelivery(order: {
  deliveryMethod: string;
  recipientFirstName: string;
  recipientLastName: string;
  recipientPhone: string;
  deliveryOblast: string;
  deliveryRaion: string;
  deliveryCity: string;
  deliveryWarehouse: string;
}): string[] {
  if (!order.recipientFirstName && !order.deliveryCity) {
    return [];
  }

  return [
    `${order.recipientLastName} ${order.recipientFirstName}`.trim(),
    `Тел.: ${order.recipientPhone}`,
    `${order.deliveryCity}, ${order.deliveryRaion}, ${order.deliveryOblast}`,
    `Nova Poshta: ${order.deliveryWarehouse}`,
  ];
}

export function validateNovaPoshtaTtn(value: unknown): { ok: true; ttn: string } | { ok: false; error: string } {
  const raw = typeof value === "string" ? value.trim() : "";
  const digits = raw.replace(/\D/g, "");

  if (digits.length < 10 || digits.length > 14) {
    return { ok: false, error: "Вкажіть коректний номер ТТН Nova Poshta (10–14 цифр)" };
  }

  return { ok: true, ttn: digits };
}

export { getNovaPoshtaTrackingUrl } from "@/lib/nova-poshta-links";

export function formatNovaPoshtaTtn(ttn: string): string {
  return ttn.replace(/\D/g, "");
}
