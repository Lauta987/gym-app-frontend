export function isValidImageUrl(imageUrl?: string) {
  if (!imageUrl) return false;

  try {
    const url = new URL(imageUrl);

    return url.protocol === "http:" || url.protocol === "https:";
  } catch {
    return false;
  }
} 