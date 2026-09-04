import { describe, expect, it } from "vitest";
import { buildCallSignals } from "./call-signals";

const source = { label: "Official fleet page", url: "https://example.gov/fire/fleet" };

describe("buildCallSignals", () => {
  it("creates an old-apparatus signal and preserves its exact source", () => {
    const signals = buildCallSignals({
      fleet: [{ description: "2005 Pierce engine", year: 2005, source }],
      grants: [],
      news: [],
      website: "https://example.gov/fire",
      currentYear: 2026,
    });
    expect(signals[0].headline).toBe("Older apparatus identified");
    expect(signals[0].detail).toContain("21 years old (model year 2005)");
    expect(signals[0].source).toBe(source);
  });

  it("uses ten years as the older-apparatus threshold", () => {
    const signals = buildCallSignals({
      fleet: [{ description: "2016 engine", year: 2016, source }],
      grants: [],
      news: [],
      website: null,
      currentYear: 2026,
    });
    expect(signals[0].kind).toBe("fleet");
    expect(signals[0].detail).toContain("10 years old");
  });

  it("selects up to the three oldest qualifying apparatus in age order", () => {
    const signals = buildCallSignals({
      fleet: [
        { description: "2015 ambulance", year: 2015, source },
        { description: "2005 brush truck", year: 2005, source },
        { description: "2001 utility", year: 2001, source },
        { description: "2005 utility", year: 2005, source },
        { description: "2022 engine", year: 2022, source },
      ],
      grants: [],
      news: [],
      website: null,
      currentYear: 2026,
    });

    expect(signals).toHaveLength(3);
    expect(signals.map((signal) => signal.detail)).toEqual([
      expect.stringContaining("2001 utility"),
      expect.stringContaining("2005 brush truck"),
      expect.stringContaining("2005 utility"),
    ]);
  });

  it("keeps funding and news alongside three apparatus signals", () => {
    const signals = buildCallSignals({
      fleet: [2001, 2005, 2010].map((year) => ({
        description: `${year} engine`,
        year,
        source,
      })),
      grants: [
        {
          organization: "FEMA",
          program: "AFG",
          amount: "$100,000",
          fiscalYear: "2025",
          source,
        },
      ],
      news: [
        {
          title: "Station renovation",
          snippet: "The station renovation is underway.",
          link: source.url,
          source,
        },
      ],
      website: null,
      currentYear: 2026,
    });

    expect(signals).toHaveLength(5);
    expect(signals.map(({ kind }) => kind)).toEqual([
      "fleet",
      "fleet",
      "fleet",
      "funding",
      "timing",
    ]);
  });

  it("does not promote routine news into a sales signal", () => {
    const signals = buildCallSignals({
      fleet: [],
      grants: [],
      news: [
        {
          title: "Annual pancake breakfast",
          snippet: "Neighbors joined firefighters for breakfast.",
          link: "https://example.gov/fire/news",
          source,
        },
      ],
      website: "https://example.gov/fire",
    });
    expect(signals).toHaveLength(1);
    expect(signals[0].kind).toBe("context");
  });

  it("returns an empty list when data and a department website are unavailable", () => {
    expect(buildCallSignals({ fleet: [], grants: [], news: [], website: null })).toEqual([]);
  });
});
