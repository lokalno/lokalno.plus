/** Офіційні посилання Nova Post (novapost.com). Старий домен novaposhta.ua може показувати помилку. */

const LOCALE = "uk-ua";

export const NOVA_POSHTA_MAIN = `https://novapost.com/${LOCALE}/`;
export const NOVA_POSHTA_PERSONAL_CABINET = "https://my.novapost.com/";
export const NOVA_POSHTA_BUSINESS_CABINET = "https://my.novapost.com/";
export const NOVA_POSHTA_CASH_DELIVERY = `https://novapost.com/${LOCALE}/for-business/financial-services/cash-delivery-agreement/`;
export const NOVA_POSHTA_CABINET_HELP = `https://novapost.com/${LOCALE}/`;

export const NOVA_POST_BRAND = "novapost.com";

export function getNovaPoshtaTrackingUrl(ttn: string): string {
  const digits = ttn.replace(/\D/g, "");
  return `${NOVA_POSHTA_MAIN}tracking/?cargo_number=${encodeURIComponent(digits)}`;
}
