import { Grant } from "@/types/brief";
export async function searchFemaGrants(
  departmentName: string,
  stateHint: string,
): Promise<Grant[]> {
  const base = "https://www.fema.gov/api/open/v1/NonDisasterAssistanceFirefighterGrants";
  const words = departmentName
    .replace(/\b(fire|department|dept|station|city|town|county|district|of|the)\b/gi, " ")
    .replace(/[^a-z0-9 ]/gi, " ")
    .split(/\s+/)
    .filter((x) => x.length > 2);
  const key = words.slice(0, 2).join(" ");
  if (!key) return [];
  const filter = `contains(tolower(vendorName),'${key.toLowerCase().replaceAll("'", "''")}')`;
  const url = `${base}?$filter=${encodeURIComponent(filter)}&$top=50&$orderby=fiscalYear desc`;
  try {
    const response = await fetch(url, { cache: "no-store", signal: AbortSignal.timeout(12000) });
    if (!response.ok) return [];
    const rows = (await response.json()).NonDisasterAssistanceFirefighterGrants || [];
    return rows
      .filter(
        (g: { vendorState?: string }) =>
          !stateHint || !g.vendorState || stateHint.includes(g.vendorState),
      )
      .slice(0, 5)
      .map(
        (g: {
          vendorName: string;
          programName: string;
          awardAmount: number;
          fiscalYear: number;
          awardNumber: string;
        }) => ({
          organization: g.vendorName,
          program: g.programName,
          amount: Number(g.awardAmount || 0).toLocaleString("en-US", {
            style: "currency",
            currency: "USD",
            maximumFractionDigits: 0,
          }),
          fiscalYear: String(g.fiscalYear),
          source: {
            label: `FEMA award ${g.awardNumber}`,
            url: `https://www.fema.gov/grants/preparedness/firefighters/awards?search=${encodeURIComponent(g.awardNumber)}`,
          },
        }),
      );
  } catch {
    return [];
  }
}
