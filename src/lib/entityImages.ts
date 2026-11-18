import { IMAGE_ASSETS, type ImageAsset, type ImageAssetCategory } from "@/data/imageAssets";

const normalize = (value: string) => value.trim().replace(/\\/g, "/");

const withoutLeadingSlash = (value: string) => normalize(value).replace(/^\/+/, "");

const filenameOf = (value: string) => withoutLeadingSlash(value).split("/").pop() ?? value;

const assetIndex = new Map<string, ImageAsset[]>();

for (const asset of IMAGE_ASSETS) {
  const keys = [
    asset.sourcePath,
    withoutLeadingSlash(asset.sourcePath),
    asset.key,
    withoutLeadingSlash(asset.key).toLowerCase(),
  ];
  for (const key of keys) {
    const list = assetIndex.get(key) ?? [];
    list.push(asset);
    assetIndex.set(key, list);
  }
}

function pickCategory(
  matches: ImageAsset[],
  category?: ImageAssetCategory,
): ImageAsset | undefined {
  if (matches.length === 0) return undefined;
  if (category) {
    const scoped = matches.find((asset) => asset.category === category);
    if (scoped) return scoped;
  }
  return matches[0];
}

/**
 * Turn a database image value into a usable URL.
 *
 * Values are looked up in the generated asset index by their stable
 * `sourcePath` first, then by file name. URLs, data URIs, and unknown paths are
 * passed through unchanged so operators can point at arbitrary art.
 */
export function resolveEntityImage(
  img: string | null | undefined,
  category?: ImageAssetCategory,
): string {
  if (!img) return "";
  const value = normalize(img);
  if (/^(https?:|data:|blob:)/i.test(value)) return value;

  const sourceMatches = assetIndex.get(withoutLeadingSlash(value));
  const sourceMatch = pickCategory(sourceMatches ?? [], category);
  if (sourceMatch) return sourceMatch.src;

  const filename = filenameOf(value);
  const filenameMatches = [
    ...(assetIndex.get(filename) ?? []),
    ...(assetIndex.get(filename.toLowerCase()) ?? []),
  ];
  const uniqueMatches = [...new Set(filenameMatches)];
  const filenameMatch = pickCategory(uniqueMatches, category);
  if (filenameMatch) return filenameMatch.src;

  return value;
}

/** Find the asset row behind an image value, if the picker knows about it. */
export function findImageAsset(
  img: string | null | undefined,
  category?: ImageAssetCategory,
): ImageAsset | null {
  if (!img) return null;
  const value = withoutLeadingSlash(normalize(img));
  const direct = pickCategory(assetIndex.get(value) ?? [], category);
  if (direct) return direct;

  const filename = filenameOf(value);
  const matches = [
    ...(assetIndex.get(filename) ?? []),
    ...(assetIndex.get(filename.toLowerCase()) ?? []),
  ];
  return pickCategory([...new Set(matches)], category) ?? null;
}
