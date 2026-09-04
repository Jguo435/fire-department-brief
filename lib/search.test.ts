import { describe, expect, it } from "vitest";
import { isLikelyDirectoryWebsite } from "./search";

describe("isLikelyDirectoryWebsite", () => {
  it("separates directory listings from plausible official sites", () => {
    expect(
      isLikelyDirectoryWebsite(
        "https://www.chamberofcommerce.com/business-directory/vermont/washington/fire-station/1",
      ),
    ).toBe(true);
    expect(
      isLikelyDirectoryWebsite(
        "https://www.localgovs.com/government-28202196-washington-fire-department",
      ),
    ).toBe(true);
    expect(isLikelyDirectoryWebsite("https://www.facebook.com/WashingtonVFD100/about/")).toBe(true);
    expect(isLikelyDirectoryWebsite("https://www.washingtonvt.org/")).toBe(false);
  });
});
