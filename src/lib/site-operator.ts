/** Юридичний оператор платформи lokalno.plus (Companies House, UK). */
export const SITE_OPERATOR = {
  legalName: "AXEND SUPPLY LTD",
  companyNumber: "17033238",
  registeredOfficeLines: ["9 Chestnut Avenue", "Corby", "England", "NN17 2ER"],
  country: "United Kingdom",
} as const;

export function formatSiteOperatorAddress(): string {
  return SITE_OPERATOR.registeredOfficeLines.join(", ");
}

export function formatSiteOperatorLabel(): string {
  return `${SITE_OPERATOR.legalName} (Company No. ${SITE_OPERATOR.companyNumber})`;
}
