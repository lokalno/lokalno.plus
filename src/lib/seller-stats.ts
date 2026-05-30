export function formatStars(rating: number): string {
  const full = Math.round(rating);
  return "⭐".repeat(Math.min(5, Math.max(0, full)));
}

export function getRatingLabel(count: number): string {
  if (count === 0) return "Немає відгуків";
  if (count === 1) return "1 відгук";
  if (count >= 2 && count <= 4) return `${count} відгуки`;
  return `${count} відгуків`;
}

export function getFollowerLabel(count: number): string {
  if (count === 0) return "Немає підписників";
  if (count === 1) return "1 підписник";
  if (count >= 2 && count <= 4) return `${count} підписники`;
  return `${count} підписників`;
}

export function isVerifiedSeller(reviewCount: number, avgRating: number | null): boolean {
  return reviewCount >= 5 && avgRating !== null && avgRating >= 4.5;
}
