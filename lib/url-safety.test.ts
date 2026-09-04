import { describe, expect, it } from "vitest";
import { isSafePublicUrl } from "./url-safety";

describe("isSafePublicUrl", () => {
  it("allows public web sources and rejects private or credentialed URLs", () => {
    expect(isSafePublicUrl("https://www.fema.gov/grants/example")).toBe(true);
    expect(isSafePublicUrl("http://127.0.0.1/admin")).toBe(false);
    expect(isSafePublicUrl("http://192.168.1.10/internal")).toBe(false);
    expect(isSafePublicUrl("https://user:password@example.com/private")).toBe(false);
  });
});
