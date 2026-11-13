import hpImg from "@/assets/health-potion.png";
import manaImg from "@/assets/mana-potion.png";
import sword from "@/assets/sword.png";
import staff from "@/assets/staff.png";
import spear from "@/assets/spear.png";
import longbow from "@/assets/bow-v1.png";

/**
 * Database item rows store a stable image key (e.g. `health-potion.png`) so
 * they are not tied to hashed build filenames. Anything that already looks like
 * a URL or absolute path is passed through unchanged.
 */
const IMAGE_BY_KEY: Record<string, string> = {
  "health-potion": hpImg,
  "health-potion.png": hpImg,
  "mana-potion": manaImg,
  "mana-potion.png": manaImg,
  sword: sword,
  "sword.png": sword,
  staff: staff,
  "staff.png": staff,
  spear: spear,
  "spear.png": spear,
  "bow-v1": longbow,
  "bow-v1.png": longbow,
  "longbow.png": longbow,
};

export function resolveItemImage(img: string | null | undefined): string {
  if (!img) return "";
  if (/^(https?:|data:)/i.test(img)) return img;

  const filename = img.split("/").pop() ?? img;
  return IMAGE_BY_KEY[img] ?? IMAGE_BY_KEY[filename] ?? img;
}
