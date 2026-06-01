export type SellerNameSource = {
  name: string;
  storeName?: string | null;
};

export const SELLER_NAME_SELECT = {
  name: true,
  storeName: true,
} as const;

export const STORE_NAME_HINT =
  "Назва магазину буде відображатися покупцям замість вашого імені.";

export function getSellerDisplayName(user: SellerNameSource): string {
  const storeName = user.storeName?.trim();
  if (storeName) return storeName;
  return user.name;
}

export function normalizeStoreName(value: unknown): string | null {
  if (typeof value !== "string") return null;
  const trimmed = value.trim();
  if (!trimmed) return null;
  return trimmed.slice(0, 80);
}
