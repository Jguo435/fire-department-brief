import { Source } from "@/types/brief";
import { isSafePublicUrl } from "./url-safety";

export async function checkSource(source: Source): Promise<Source | null> {
  let currentUrl = source.url;
  try {
    for (let redirects = 0; redirects <= 3; redirects += 1) {
      if (!isSafePublicUrl(currentUrl)) return null;
      const response = await fetch(currentUrl, {
        cache: "no-store",
        headers: { "User-Agent": "Mozilla/5.0 (compatible; GarageBrief/1.0; research)" },
        redirect: "manual",
        signal: AbortSignal.timeout(10000),
      });
      if (response.status >= 300 && response.status < 400) {
        const location = response.headers.get("location");
        if (!location) return null;
        currentUrl = new URL(location, currentUrl).href;
        continue;
      }
      if (!response.ok) return null;
      await response.body?.cancel();
      return { ...source, url: currentUrl };
    }
  } catch {}
  return null;
}
