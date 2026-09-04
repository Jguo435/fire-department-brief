export function isValidPlaceId(value: unknown): value is string {
  if (typeof value !== "string") return false;
  const trimmed = value.trim();
  return trimmed.length >= 10 && trimmed.length <= 255 && /^[A-Za-z0-9_-]+$/.test(trimmed);
}
