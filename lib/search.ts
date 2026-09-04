import * as cheerio from "cheerio";
import { Apparatus, Leadership, NewsArticle } from "@/types/brief";
import { isSafePublicUrl } from "./url-safety";
const HEADERS = { "User-Agent": "Mozilla/5.0 (compatible; GarageBrief/1.0; research)" };
const DIRECTORY_HOST =
  /(?:^|\.)(?:chamberofcommerce|facebook|firedepartment|firedepartments|instagram|linkedin|localgovs|mapquest|usfiredept|wikipedia|yelp)\.com$/i;

export function isLikelyDirectoryWebsite(rawUrl: string) {
  try {
    return DIRECTORY_HOST.test(new URL(rawUrl).hostname);
  } catch {
    return true;
  }
}
function cleanDuckUrl(href: string) {
  try {
    const url = new URL(href, "https://duckduckgo.com");
    const result =
      url.searchParams.get("uddg") || (url.protocol.startsWith("http") ? url.href : "");
    return result && isSafePublicUrl(result) ? result : "";
  } catch {
    return "";
  }
}
async function search(query: string) {
  const response = await fetch(`https://html.duckduckgo.com/html/?q=${encodeURIComponent(query)}`, {
    headers: HEADERS,
    cache: "no-store",
    signal: AbortSignal.timeout(12000),
  });
  if (!response.ok) return [];
  const $ = cheerio.load(await response.text());
  return $(".result")
    .map((_, el) => {
      const anchor = $(el).find(".result__a").first();
      const title = anchor.text().replace(/\s+/g, " ").trim();
      const link = cleanDuckUrl(anchor.attr("href") || "");
      const snippet = $(el).find(".result__snippet").text().replace(/\s+/g, " ").trim();
      return title && link ? { title, link, snippet } : null;
    })
    .get()
    .filter(Boolean) as { title: string; link: string; snippet: string }[];
}
export async function searchDepartmentNews(name: string, cityHint: string): Promise<NewsArticle[]> {
  try {
    return (await search(`"${name}" ${cityHint} fire department news apparatus grant`))
      .slice(0, 5)
      .map((result) => ({
        ...result,
        source: { label: new URL(result.link).hostname.replace(/^www\./, ""), url: result.link },
      }));
  } catch {
    return [];
  }
}
export async function searchDepartmentWebsite(
  name: string,
  cityHint: string,
): Promise<string | null> {
  try {
    const results = await search(`"${name}" ${cityHint} official`);
    const locationTokens = cityHint
      .toLowerCase()
      .split(/[^a-z]+/)
      .filter((token) => token.length >= 2 && token !== "usa");
    const ranked = results
      .filter(({ link }) => !isLikelyDirectoryWebsite(link))
      .map((result) => {
        const hostname = new URL(result.link).hostname.toLowerCase().replace(/^www\./, "");
        const resultText = `${result.title} ${result.snippet}`.toLowerCase();
        let score = /\.(gov|us)$/.test(hostname) ? 5 : 0;
        for (const token of locationTokens) {
          if (hostname.includes(token)) score += token.length === 2 ? 10 : 4;
          else if (resultText.includes(token)) score += 1;
        }
        if (/official|municipal|town of|city of/.test(resultText)) score += 2;
        return { ...result, score };
      })
      .sort((a, b) => b.score - a.score);
    return ranked[0]?.link || null;
  } catch {
    return null;
  }
}
export async function searchDepartmentFacts(
  name: string,
  cityHint: string,
): Promise<{ leadership: Leadership[]; fleet: Apparatus[] }> {
  const leadership: Leadership[] = [],
    fleet: Apparatus[] = [];
  try {
    const [people, vehicles] = await Promise.all([
      search(`"${name}" ${cityHint} "fire chief"`),
      search(`"${name}" ${cityHint} apparatus engine ladder rescue fleet`),
    ]);
    for (const result of people.filter(({ link }) => !isLikelyDirectoryWebsite(link)).slice(0, 6)) {
      const text = `${result.title}. ${result.snippet}`.replace(/\s+/g, " ");
      const patterns = [
        /(?:Fire\s+)?Chief\s+([A-Z][A-Za-z.'-]+\s+[A-Z][A-Za-z.'-]+)/,
        /([A-Z][A-Za-z.'-]+\s+[A-Z][A-Za-z.'-]+),?\s+(?:the\s+)?(?:Fire\s+)?Chief/i,
      ];
      for (const pattern of patterns) {
        const match = text.match(pattern);
        if (match && !leadership.some((x) => x.name === match[1]))
          leadership.push({
            name: match[1],
            title: "Fire Chief",
            source: {
              label: new URL(result.link).hostname.replace(/^www\./, ""),
              url: result.link,
            },
          });
      }
    }
    for (const result of vehicles
      .filter(({ link }) => !isLikelyDirectoryWebsite(link))
      .slice(0, 8)) {
      const text = `${result.title}. ${result.snippet}`.replace(/\s+/g, " ");
      const pattern =
        /\b((?:19|20)\d{2})\s+([A-Z0-9][A-Za-z0-9-]*(?:\s+[A-Z0-9][A-Za-z0-9-]*){0,3}\s+(?:engine|pumper|ladder|tower|tanker|tender|rescue|ambulance|brush truck|squad|quint|aerial))\b/gi;
      for (const match of text.matchAll(pattern)) {
        const description = `${match[1]} ${match[2]}`;
        if (!fleet.some((x) => x.description.toLowerCase() === description.toLowerCase()))
          fleet.push({
            description,
            year: Number(match[1]),
            source: {
              label: new URL(result.link).hostname.replace(/^www\./, ""),
              url: result.link,
            },
          });
      }
    }
  } catch {}
  return { leadership: leadership.slice(0, 4), fleet: fleet.slice(0, 8) };
}
