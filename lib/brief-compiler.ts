import { BriefData, BriefResponse } from "@/types/brief";
import { buildCallSignals } from "./call-signals";
import { getPlaceDetails } from "./google-places";
import { scrapeDepartmentWebsite } from "./scraper";
import { searchDepartmentFacts, searchDepartmentNews } from "./search";
import { searchFemaGrants } from "./fema";
import { researchFollowUpWithOpenAI, researchWithOpenAI } from "./openai-research";
import {
  mergeGrants,
  mergeLeadership,
  needsFundingRetry,
  needsLeadershipRetry,
} from "./research-quality";
import { checkSource } from "./source-validation";

export async function compileBrief(placeId: string): Promise<BriefResponse> {
  try {
    const department = await getPlaceDetails(placeId);
    const locationHint = department.address.split(",").slice(-3).join(" ");
    const website = department.website;
    let aiResearch = null;
    let aiWarning = "";
    try {
      aiResearch = await researchWithOpenAI({
        name: department.name,
        address: department.address,
        website,
      });
    } catch {
      aiWarning = "AI research was unavailable; fallback sources were used";
    }
    const [siteData, searchFacts, fallbackNews, femaGrants] = await Promise.all([
      website ? scrapeDepartmentWebsite(website) : Promise.resolve({ leadership: [], fleet: [] }),
      searchDepartmentFacts(department.name, locationHint),
      aiResearch ? Promise.resolve([]) : searchDepartmentNews(department.name, locationHint),
      searchFemaGrants(department.name, locationHint),
    ]);
    const leadership = aiResearch?.leadership.length
      ? aiResearch.leadership
      : siteData.leadership.length
        ? siteData.leadership
        : searchFacts.leadership;
    const fleet = aiResearch?.fleet.length
      ? aiResearch.fleet
      : siteData.fleet.length
        ? siteData.fleet
        : searchFacts.fleet;
    const news = aiResearch?.news.length ? aiResearch.news : fallbackNews;
    const grants = aiResearch?.grants.length ? aiResearch.grants : femaGrants;

    const sourceCache = new Map<string, Awaited<ReturnType<typeof checkSource>>>();
    const accessibleSource = async (source: { label: string; url: string }) => {
      if (!sourceCache.has(source.url)) sourceCache.set(source.url, await checkSource(source));
      return sourceCache.get(source.url) || null;
    };
    const keepAccessible = async <T extends { source: { label: string; url: string } }>(
      items: T[],
    ) =>
      (
        await Promise.all(
          items.map(async (item) => {
            const source = await accessibleSource(item.source);
            if (!source) return null;
            return { ...item, source } as T;
          }),
        )
      ).filter(Boolean) as T[];
    const [initialLeadership, checkedFleet, initialGrants, checkedNews] = await Promise.all([
      keepAccessible(leadership),
      keepAccessible(fleet),
      keepAccessible(grants),
      keepAccessible(news),
    ]);
    let checkedLeadership = initialLeadership;
    let checkedGrants = initialGrants;
    let omittedCount =
      leadership.length +
      fleet.length +
      grants.length +
      news.length -
      checkedLeadership.length -
      checkedFleet.length -
      checkedGrants.length -
      checkedNews.length;

    if (aiResearch) {
      const followUpCategories = [
        ...(needsLeadershipRetry(checkedLeadership) ? (["leadership"] as const) : []),
        ...(needsFundingRetry(checkedGrants) ? (["grants"] as const) : []),
      ];
      if (followUpCategories.length) {
        const followUp = await researchFollowUpWithOpenAI(
          { name: department.name, address: department.address, website },
          followUpCategories,
        );
        const [followUpLeadership, followUpGrants] = await Promise.all([
          keepAccessible(followUp.leadership),
          keepAccessible(followUp.grants),
        ]);
        omittedCount +=
          followUp.leadership.length +
          followUp.grants.length -
          followUpLeadership.length -
          followUpGrants.length;
        checkedLeadership = mergeLeadership(checkedLeadership, followUpLeadership);
        checkedGrants = mergeGrants(checkedGrants, followUpGrants);
      }
    }

    const callSignals = buildCallSignals({
      fleet: checkedFleet,
      grants: checkedGrants,
      news: checkedNews,
      website: department.website,
    });
    const warnings = [
      aiWarning,
      omittedCount > 0 &&
        `${omittedCount} ${omittedCount === 1 ? "finding was" : "findings were"} omitted because the source was unavailable`,
      needsLeadershipRetry(checkedLeadership) && "No sourced current fire chief found",
      !checkedFleet.length && "No sourced apparatus found",
      needsFundingRetry(checkedGrants) && "No sourced numeric funding amount found",
      !checkedNews.length && "No sourced recent activity found",
    ].filter(Boolean) as string[];
    const data: BriefData = {
      department,
      leadership: checkedLeadership,
      fleet: checkedFleet,
      grants: checkedGrants,
      news: checkedNews,
      callSignals,
      generatedAt: new Date().toISOString(),
    };
    return { success: true, data, warnings };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : "The brief could not be generated.",
      warnings: [],
    };
  }
}
