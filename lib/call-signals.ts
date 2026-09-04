import { Apparatus, CallSignal, Grant, NewsArticle } from "@/types/brief";

const SALES_RELEVANT_NEWS =
  /apparatus|engine|ladder|truck|ambulance|rescue|fleet|vehicle|grant|budget|funding|purchase|procure|replace|retire|surplus|auction|out of service|station|chief/i;

export function buildCallSignals({
  fleet,
  grants,
  news,
  website,
  currentYear = new Date().getFullYear(),
}: {
  fleet: Apparatus[];
  grants: Grant[];
  news: NewsArticle[];
  website: string | null;
  currentYear?: number;
}): CallSignal[] {
  const signals: CallSignal[] = [];
  const oldVehicles = fleet
    .filter(
      (vehicle): vehicle is Apparatus & { year: number } =>
        typeof vehicle.year === "number" && vehicle.year <= currentYear - 10,
    )
    .sort((a, b) => a.year - b.year)
    .slice(0, 3);
  for (const vehicle of oldVehicles) {
    const age = currentYear - vehicle.year;
    signals.push({
      headline: "Older apparatus identified",
      detail: `${vehicle.description.replace(/[.!?]+$/, "")} is ${age} years old (model year ${vehicle.year}). Ask whether it remains active and if replacement or resale is being considered.`,
      kind: "fleet",
      source: vehicle.source,
    });
  }
  if (grants[0])
    signals.push({
      headline: "Funding history on record",
      detail: `${grants[0].organization} received ${grants[0].amount} through ${grants[0].program} in FY${grants[0].fiscalYear}. Ask what the award changed in their fleet plan.`,
      kind: "funding",
      source: grants[0].source,
    });
  const relevantNews = news.find((article) =>
    SALES_RELEVANT_NEWS.test(`${article.title} ${article.snippet}`),
  );
  if (relevantNews)
    signals.push({
      headline: "Recent public activity",
      detail: relevantNews.snippet || relevantNews.title,
      kind: "timing",
      source: relevantNews.source,
    });
  if (!signals.length && website)
    signals.push({
      headline: "Start with current fleet priorities",
      detail:
        "No strong transaction trigger surfaced in public sources. Ask what equipment is next to rotate out.",
      kind: "context",
      source: { label: "Department website", url: website },
    });
  return signals.slice(0, 5);
}
