import OpenAI from "openai";
import { Apparatus, Grant, Leadership, NewsArticle, Source } from "@/types/brief";

interface ResearchResult {
  leadership: Array<{ name: string; title: string; sourceLabel: string; sourceUrl: string }>;
  fleet: Array<{
    description: string;
    year: number | null;
    acquiredYear: number | null;
    sourceLabel: string;
    sourceUrl: string;
  }>;
  grants: Array<{
    organization: string;
    program: string;
    amount: string;
    fiscalYear: string;
    sourceLabel: string;
    sourceUrl: string;
  }>;
  news: Array<{ title: string; snippet: string; sourceLabel: string; sourceUrl: string }>;
}

type FollowUpCategory = "leadership" | "grants";

const itemSource = {
  sourceLabel: { type: "string" },
  sourceUrl: { type: "string" },
};

const schema = {
  type: "object",
  additionalProperties: false,
  required: ["leadership", "fleet", "grants", "news"],
  properties: {
    leadership: {
      type: "array",
      maxItems: 5,
      items: {
        type: "object",
        additionalProperties: false,
        required: ["name", "title", "sourceLabel", "sourceUrl"],
        properties: { name: { type: "string" }, title: { type: "string" }, ...itemSource },
      },
    },
    fleet: {
      type: "array",
      maxItems: 8,
      items: {
        type: "object",
        additionalProperties: false,
        required: ["description", "year", "acquiredYear", "sourceLabel", "sourceUrl"],
        properties: {
          description: { type: "string" },
          year: { anyOf: [{ type: "integer" }, { type: "null" }] },
          acquiredYear: { anyOf: [{ type: "integer" }, { type: "null" }] },
          ...itemSource,
        },
      },
    },
    grants: {
      type: "array",
      maxItems: 5,
      items: {
        type: "object",
        additionalProperties: false,
        required: ["organization", "program", "amount", "fiscalYear", "sourceLabel", "sourceUrl"],
        properties: {
          organization: { type: "string" },
          program: { type: "string" },
          amount: { type: "string" },
          fiscalYear: { type: "string" },
          ...itemSource,
        },
      },
    },
    news: {
      type: "array",
      maxItems: 5,
      items: {
        type: "object",
        additionalProperties: false,
        required: ["title", "snippet", "sourceLabel", "sourceUrl"],
        properties: { title: { type: "string" }, snippet: { type: "string" }, ...itemSource },
      },
    },
  },
} as const;

const leadershipSchema = {
  type: "object",
  additionalProperties: false,
  required: ["leadership"],
  properties: {
    leadership: { ...schema.properties.leadership, maxItems: 2 },
  },
} as const;

const grantsSchema = {
  type: "object",
  additionalProperties: false,
  required: ["grants"],
  properties: {
    grants: { ...schema.properties.grants, maxItems: 2 },
  },
} as const;

function safeSource(label: string, rawUrl: string): Source | null {
  try {
    const url = new URL(rawUrl);
    if (!/^https?:$/.test(url.protocol)) return null;
    const cleanLabel = label
      .replace(/\s*\(\[[\s\S]*$/, "")
      .replace(/\[[^\]]+\]\([^)]*\)/g, "")
      .trim();
    return { label: cleanLabel || url.hostname.replace(/^www\./, ""), url: url.href };
  } catch {
    return null;
  }
}

export async function researchWithOpenAI(department: {
  name: string;
  address: string;
  website: string | null;
}) {
  if (!process.env.OPENAI_API_KEY) return null;
  const client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY, timeout: 45000, maxRetries: 1 });
  const response = await client.responses.create({
    model: "gpt-5.6-luna",
    store: false,
    max_output_tokens: 2400,
    tools: [{ type: "web_search", search_context_size: "medium", external_web_access: true }],
    instructions:
      "You research fire departments for a specialty-vehicle marketplace sales team. Use no more than four web searches, covering leadership, fleet, funding, and recent activity. Return only facts explicitly supported by public web sources. Never infer a person, vehicle, amount, date, or URL. For fleet items, year is the vehicle model year and acquiredYear is the year the department acquired or received it; use null unless each is explicit. Copy each sourceUrl exactly from a page returned by web search. Prefer official government/department pages, FEMA, municipal budgets, meeting minutes, and reputable local news. Exclude directories, social profiles, and generic department descriptions. Fleet means identifiable apparatus or vehicle facts, not general services. News should be relevant to fleet, funding, leadership, facilities, procurement, or operational change and preferably from the last 24 months. Empty arrays are correct when evidence is weak.",
    input: `Research this exact department:\nName: ${department.name}\nAddress: ${department.address}\nKnown website: ${department.website || "none"}\nFind verified leadership, apparatus/fleet, grants or budget awards, and recent relevant activity. Distinguish it from similarly named departments using the address.`,
    text: {
      format: { type: "json_schema", name: "fire_department_research", strict: true, schema },
    },
  });
  const parsed = JSON.parse(response.output_text) as ResearchResult;
  const leadership: Leadership[] = parsed.leadership.flatMap((x) => {
    const source = safeSource(x.sourceLabel, x.sourceUrl);
    return source ? [{ name: x.name, title: x.title, source }] : [];
  });
  const fleet: Apparatus[] = parsed.fleet.flatMap((x) => {
    const source = safeSource(x.sourceLabel, x.sourceUrl);
    return source
      ? [
          {
            description: x.description,
            ...(x.year ? { year: x.year } : {}),
            ...(x.acquiredYear ? { acquiredYear: x.acquiredYear } : {}),
            source,
          },
        ]
      : [];
  });
  const grants: Grant[] = parsed.grants.flatMap((x) => {
    const source = safeSource(x.sourceLabel, x.sourceUrl);
    return source
      ? [
          {
            organization: x.organization,
            program: x.program,
            amount: x.amount,
            fiscalYear: x.fiscalYear.replace(/^FY\s*/i, ""),
            source,
          },
        ]
      : [];
  });
  const news: NewsArticle[] = parsed.news.flatMap((x) => {
    const source = safeSource(x.sourceLabel, x.sourceUrl);
    return source ? [{ title: x.title, snippet: x.snippet, link: source.url, source }] : [];
  });
  return { leadership, fleet, grants, news };
}

export async function researchFollowUpWithOpenAI(
  department: { name: string; address: string; website: string | null },
  categories: FollowUpCategory[],
) {
  if (!process.env.OPENAI_API_KEY || !categories.length) {
    return { leadership: [] as Leadership[], grants: [] as Grant[] };
  }
  const client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY, timeout: 15000, maxRetries: 0 });
  const context = `Exact department:\nName: ${department.name}\nAddress: ${department.address}\nKnown website: ${department.website || "none"}\nDistinguish it from similarly named departments using the address.`;

  const tasks = categories.map(async (category) => {
    const isLeadership = category === "leadership";
    const response = await client.responses.create({
      model: "gpt-5.6-luna",
      store: false,
      max_output_tokens: 4000,
      reasoning: { effort: "low" },
      tools: [{ type: "web_search", search_context_size: "medium", external_web_access: true }],
      instructions: isLeadership
        ? "Find the current, named Fire Chief for this exact fire department. Search official municipal or department pages, meeting records, public reports, and reputable local news. Do not return an assistant, deputy, former chief, or unnamed role as Fire Chief. Return only explicitly supported facts and copy the source URL from a web-search result. An empty array is correct if no current named chief is supported."
        : "Find grants, municipal appropriations, budget awards, or major donations for this exact fire department that state a numeric dollar amount. Search official government records, FEMA, budgets, meeting records, and reputable local news. Do not infer or calculate an amount. Return only explicitly supported facts and copy the source URL from a web-search result. An empty array is correct if no numeric funding amount is supported.",
      input: `${context}\nPerform one focused follow-up search for ${isLeadership ? "the current named Fire Chief" : "funding with a numeric dollar amount"}.`,
      text: {
        format: {
          type: "json_schema",
          name: isLeadership ? "leadership_follow_up" : "funding_follow_up",
          strict: true,
          schema: isLeadership ? leadershipSchema : grantsSchema,
        },
      },
    });
    return { category, parsed: JSON.parse(response.output_text) as Partial<ResearchResult> };
  });

  const settled = await Promise.allSettled(tasks);
  const leadership: Leadership[] = [];
  const grants: Grant[] = [];
  for (const result of settled) {
    if (result.status !== "fulfilled") continue;
    if (result.value.category === "leadership") {
      for (const item of result.value.parsed.leadership || []) {
        const source = safeSource(item.sourceLabel, item.sourceUrl);
        if (source) leadership.push({ name: item.name, title: item.title, source });
      }
    } else {
      for (const item of result.value.parsed.grants || []) {
        const source = safeSource(item.sourceLabel, item.sourceUrl);
        if (source) {
          grants.push({
            organization: item.organization,
            program: item.program,
            amount: item.amount,
            fiscalYear: item.fiscalYear.replace(/^FY\s*/i, ""),
            source,
          });
        }
      }
    }
  }
  return { leadership, grants };
}
