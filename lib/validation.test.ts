import { describe, expect, it } from "vitest";
import { isValidPlaceId } from "./validation";

describe("isValidPlaceId", () => {
  it("accepts opaque Google Place IDs without assuming a ChI prefix", () => {
    expect(isValidPlaceId("AbCdEf_123456-xyz")).toBe(true);
  });

  it("rejects missing, short, or unsafe values", () => {
    expect(isValidPlaceId(null)).toBe(false);
    expect(isValidPlaceId("short")).toBe(false);
    expect(isValidPlaceId("valid-length-but has spaces")).toBe(false);
  });
});
