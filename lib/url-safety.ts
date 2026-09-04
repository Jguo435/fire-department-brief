const PRIVATE_HOST = /^(localhost|0\.0\.0\.0|127\.|10\.|192\.168\.|169\.254\.|::1$)/i;
export function isSafePublicUrl(raw: string) {
  try {
    const url = new URL(raw);
    if (
      !/^https?:$/.test(url.protocol) ||
      url.username ||
      url.password ||
      PRIVATE_HOST.test(url.hostname)
    )
      return false;
    const parts = url.hostname.split(".").map(Number);
    if (
      parts.length === 4 &&
      parts.every(Number.isFinite) &&
      parts[0] === 172 &&
      parts[1] >= 16 &&
      parts[1] <= 31
    )
      return false;
    return true;
  } catch {
    return false;
  }
}
