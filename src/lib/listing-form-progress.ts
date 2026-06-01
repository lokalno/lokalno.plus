type ListingFormProgressInput = {
  title: string;
  description: string;
  price: string;
  city: string;
  itemLocation: string;
  stock: string;
  photosCount: number;
  categoryMain: string;
  condition: string;
};

export function getListingFormProgress(input: ListingFormProgressInput): number {
  let score = 0;

  if (input.title.trim().length >= 3) score += 15;
  if (input.description.trim().length >= 20) score += 15;
  if (input.photosCount > 0) score += 20;
  if (Number(input.price) > 0) score += 15;
  if (input.categoryMain.trim()) score += 10;
  if (input.condition.trim()) score += 10;
  if (Number(input.stock) > 0) score += 5;
  if (input.city.trim().length >= 2) score += 5;
  if (input.itemLocation.trim().length >= 2) score += 5;

  return Math.min(100, score);
}

export function getRecommendedPriceRange(price: number): string | null {
  if (!Number.isFinite(price) || price <= 0) return null;
  const low = Math.round(price * 0.95);
  const high = Math.round(price * 1.1);
  return `${low.toLocaleString("uk-UA")} - ${high.toLocaleString("uk-UA")} ₴`;
}
