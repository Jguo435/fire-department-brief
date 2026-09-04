import { describe, expect, it } from "vitest";
import {
  mergeGrants,
  mergeLeadership,
  needsFundingRetry,
  needsLeadershipRetry,
} from "./research-quality";

const source = { label: "Official record", url: "https://example.gov/record" };

describe("research quality checks", () => {
  it("requires an actual fire chief rather than adjacent leadership", () => {
    expect(needsLeadershipRetry([{ name: "A. Person", title: "Assistant Chief", source }])).toBe(
      true,
    );
    expect(needsLeadershipRetry([{ name: "C. Person", title: "Fire Chief", source }])).toBe(false);
  });

  it("requires a numeric funding amount", () => {
    expect(
      needsFundingRetry([
        {
          organization: "Town",
          program: "Budget",
          amount: "Not stated",
          fiscalYear: "2025",
          source,
        },
      ]),
    ).toBe(true);
    expect(
      needsFundingRetry([
        { organization: "FEMA", program: "AFG", amount: "$86,251", fiscalYear: "2024", source },
      ]),
    ).toBe(false);
  });

  it("merges follow-up results without duplicates", () => {
    const chief = { name: "C. Person", title: "Chief", source };
    const grant = {
      organization: "FEMA",
      program: "AFG",
      amount: "$10,000",
      fiscalYear: "2024",
      source,
    };
    expect(mergeLeadership([chief], [chief])).toHaveLength(1);
    expect(mergeGrants([grant], [grant])).toHaveLength(1);
  });
});
