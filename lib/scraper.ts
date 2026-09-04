import * as cheerio from "cheerio";
import { Leadership, Apparatus } from "@/types/brief";
import { isSafePublicUrl } from "./url-safety";
const HEADERS = { "User-Agent": "Mozilla/5.0 (compatible; GarageBrief/1.0; research)" };
const PAGE_TERMS = /chief|leadership|staff|about|apparatus|fleet|equipment|stations/i;
function extract(text: string, url: string) {
  const leadership: Leadership[] = [],
    fleet: Apparatus[] = [];
  const clean = text.replace(/\s+/g, " ");
  const leaderPattern =
    /(?:Fire\s+)?(Chief|Deputy Chief|Assistant Chief|Battalion Chief|Commissioner)\s*[:\-–]?\s*([A-Z][A-Za-z.'-]+(?:\s+[A-Z][A-Za-z.'-]+){1,2})/g;
  for (const match of clean.matchAll(leaderPattern)) {
    const item = { name: match[2], title: match[1], source: { label: "Department website", url } };
    if (!leadership.some((x) => x.name === item.name)) leadership.push(item);
  }
  const vehiclePattern =
    /\b((?:19|20)\d{2}\s+)?((?:[A-Z][\w-]+\s+){0,2}(?:engine|pumper|ladder|tower|tanker|tender|rescue|ambulance|brush truck|squad|quint|aerial))(?:\s+(?:Engine|Truck|Unit|Rescue)?\s*#?\d+)?\b/gi;
  for (const match of clean.matchAll(vehiclePattern)) {
    const description = match[0].trim();
    if (
      description.length > 5 &&
      !fleet.some((x) => x.description.toLowerCase() === description.toLowerCase())
    )
      fleet.push({
        description,
        year: match[1] ? Number(match[1].trim()) : undefined,
        source: { label: "Department website", url },
      });
  }
  return { leadership, fleet };
}
export async function scrapeDepartmentWebsite(websiteUrl: string) {
  const combined = { leadership: [] as Leadership[], fleet: [] as Apparatus[] };
  if (!isSafePublicUrl(websiteUrl)) return combined;
  try {
    const base = new URL(websiteUrl);
    const home = await fetch(base, {
      headers: HEADERS,
      cache: "no-store",
      signal: AbortSignal.timeout(10000),
    });
    if (!home.ok) return combined;
    const homeHtml = await home.text();
    const $ = cheerio.load(homeHtml);
    const links = new Set<string>([base.href]);
    $("a[href]").each((_, el) => {
      try {
        const next = new URL($(el).attr("href") || "", base);
        if (next.origin === base.origin && PAGE_TERMS.test(`${$(el).text()} ${next.pathname}`))
          links.add(next.href);
      } catch {}
    });
    const results = await Promise.allSettled(
      [...links].slice(0, 6).map(async (url, i) => {
        const html =
          i === 0
            ? homeHtml
            : await (
                await fetch(url, {
                  headers: HEADERS,
                  cache: "no-store",
                  signal: AbortSignal.timeout(9000),
                })
              ).text();
        const page = cheerio.load(html);
        page("script,style,nav,footer").remove();
        return extract(page("body").text(), url);
      }),
    );
    for (const result of results)
      if (result.status === "fulfilled") {
        for (const x of result.value.leadership)
          if (!combined.leadership.some((y) => y.name === x.name)) combined.leadership.push(x);
        for (const x of result.value.fleet)
          if (!combined.fleet.some((y) => y.description === x.description)) combined.fleet.push(x);
      }
  } catch {}
  return { leadership: combined.leadership.slice(0, 6), fleet: combined.fleet.slice(0, 10) };
}
