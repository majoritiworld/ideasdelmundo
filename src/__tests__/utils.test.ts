import { describe, it, expect } from "vitest";
import { capitalize, truncate, slugify } from "@/utils";

describe("string utils", () => {
  it("capitalize uppercases the first letter", () => {
    expect(capitalize("hello")).toBe("Hello");
    expect(capitalize("")).toBe("");
  });

  it("truncate shortens long strings and appends suffix", () => {
    expect(truncate("hello world", 5)).toBe("hello…");
    expect(truncate("hi", 10)).toBe("hi");
  });

  it("slugify converts text to URL-safe slug", () => {
    expect(slugify("Hello World")).toBe("hello-world");
    expect(slugify("  Multiple   Spaces  ")).toBe("multiple-spaces");
  });
});
