import { describe, expect, it } from "vitest";
import { findImageAsset, resolveEntityImage } from "@/lib/entityImages";

describe("resolveEntityImage", () => {
  it("resolves stable source paths and bare file names", () => {
    expect(resolveEntityImage("/images/enemies/Mushroom.png", "enemies")).toBe(
      "/images/enemies/Mushroom.png",
    );
    expect(resolveEntityImage("sword.png", "items")).toMatch(/sword/);
    expect(resolveEntityImage("Merchant.png", "npc")).toBe("/images/characters/npc/Merchant.png");
  });

  it("prefers the requested category when names collide", () => {
    expect(resolveEntityImage("Mushroom.png", "enemies")).toBe("/images/enemies/Mushroom.png");
    expect(resolveEntityImage("/images/Mushroom.png", "enemies")).toBe("/images/Mushroom.png");
  });

  it("passes through external URLs, data URIs, and unknown paths", () => {
    expect(resolveEntityImage("https://example.com/hero.png", "npc")).toBe(
      "https://example.com/hero.png",
    );
    expect(resolveEntityImage("data:image/png;base64,abc", "items")).toBe(
      "data:image/png;base64,abc",
    );
    expect(resolveEntityImage("/custom/icon.png", "enemies")).toBe("/custom/icon.png");
    expect(resolveEntityImage(null, "npc")).toBe("");
  });

  it("exposes the matching asset for editor state", () => {
    const asset = findImageAsset("/images/characters/npc/Merchant.png", "npc");
    expect(asset?.label).toBe("Merchant");
    expect(findImageAsset("mystery.png", "npc")).toBeNull();
  });
});
