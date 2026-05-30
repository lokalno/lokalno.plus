const MAX_MESSAGE_IMAGE_LENGTH = 500_000;

export function isValidMessageImageUrl(url: unknown): url is string {
  if (typeof url !== "string" || !url.trim()) return false;
  const value = url.trim();
  if (value.length > MAX_MESSAGE_IMAGE_LENGTH) return false;
  if (value.startsWith("data:image/")) return true;
  if (value.startsWith("https://") || value.startsWith("http://")) return true;
  return false;
}

export function messagePreview(content: string, imageUrl?: string | null): string {
  const text = content.trim();
  if (text) return text;
  if (imageUrl) return "📷 Фото";
  return "";
}
