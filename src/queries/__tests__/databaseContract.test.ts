import { readFileSync, readdirSync, statSync } from "node:fs";
import { join, relative } from "node:path";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";
import type { Database } from "@/types/database.generated";
import type { DbEnemy, DbItem } from "@/queries/RoomQueries";
import type { ShopStockRow } from "@/queries/ItemQueries";

type Assert<T extends true> = T;

// These fail `tsc -b` if a hand-written DB row type grows a column that the
// generated schema contract does not know about.
type EnemyColumnsExist = Assert<
  keyof DbEnemy extends keyof Database["public"]["Tables"]["enemies"]["Row"] ? true : false
>;
type ItemColumnsExist = Assert<
  keyof DbItem extends keyof Database["public"]["Tables"]["items"]["Row"] ? true : false
>;
type ShopStockColumnsExist = Assert<
  keyof ShopStockRow extends keyof Database["public"]["Tables"]["shop_stock"]["Row"]
    ? true
    : false
>;

const srcDir = fileURLToPath(new URL("../..", import.meta.url));
const generatedTypesPath = join(srcDir, "types/database.generated.ts");

function walk(dir: string): string[] {
  return readdirSync(dir).flatMap((entry) => {
    const fullPath = join(dir, entry);
    if (statSync(fullPath).isDirectory()) return walk(fullPath);
    return /\.(ts|tsx)$/.test(entry) ? [fullPath] : [];
  });
}

function tablesInGeneratedTypes(): Set<string> {
  const source = readFileSync(generatedTypesPath, "utf8");
  return new Set([...source.matchAll(/^ {6}([a-z_]+): \{$/gm)].map((match) => match[1]));
}

function tablesQueriedByApp(): Map<string, string[]> {
  const tables = new Map<string, string[]>();
  for (const file of walk(srcDir)) {
    if (file.endsWith("database.generated.ts")) continue;
    const source = readFileSync(file, "utf8");
    for (const match of source.matchAll(/\.from\(\s*["'`]([^"'`]+)["'`]\s*\)/g)) {
      const table = match[1];
      const path = relative(srcDir, file);
      tables.set(table, [...(tables.get(table) ?? []), path]);
    }
  }
  return tables;
}

describe("database schema contract", () => {
  it("covers every table queried by the app", () => {
    const knownTables = tablesInGeneratedTypes();
    const missing = [...tablesQueriedByApp()]
      .filter(([table]) => !knownTables.has(table))
      .map(([table, files]) => `${table} (${files.join(", ")})`);

    expect(missing).toEqual([]);
  });

  it("has unique, ordered migration prefixes", () => {
    const migrationsDir = join(srcDir, "../supabase/migrations");
    const files = readdirSync(migrationsDir).filter((file) => file.endsWith(".sql"));
    const prefixes = files.map((file) => file.split("_")[0]);

    expect(new Set(prefixes).size).toBe(prefixes.length);
    expect(files).toEqual([...files].sort());
  });
});

// Keep the type helpers referenced so unused-type lint rules stay quiet.
export type DatabaseContractChecks = [EnemyColumnsExist, ItemColumnsExist, ShopStockColumnsExist];
