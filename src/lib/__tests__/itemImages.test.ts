import { describe, expect, it } from "vitest";
import { resolveItemImage } from "@/lib/itemImages";

describe("resolveItemImage", () => {
  it("maps known database image keys to bundled assets", () => {
    expect(resolveItemImage("health-potion.png")).toMatch(/health-potion/);
    expect(resolveItemImage("mana-potion.png")).toMatch(/mana-potion/);
    expect(resolveItemImage("sword.png")).toMatch(/sword/);
  });

  it("strips folder prefixes before matching", () => {
    expect(resolveItemImage("/src/assets/mana-potion.png")).toMatch(/mana-potion/);
    expect(resolveItemImage("assets/bow-v1.png")).toMatch(/bow/);
  });

  it("passes through URLs, absolute paths, and data URIs", () => {
    expect(resolveItemImage("https://example.com/sword.png")).toBe(
      "https://example.com/sword.png",
    );
    expect(resolveItemImage("/custom/icon.png")).toBe("/custom/icon.png");
    expect(resolveItemImage("data:image/png;base64,abc")).toBe("data:image/png;base64,abc");
  });

  it("returns an empty string for a missing image and leaves unknown keys alone", () => {
    expect(resolveItemImage("")).toBe("");
    expect(resolveItemImage(null)).toBe("");
    expect(resolveItemImage("mystery-key.png")).toBe("mystery-key.png");
  });
});
