import { describe, expect, it, vi } from "vitest";
import {
  BACKUP_FORMAT,
  BACKUP_TABLES,
  BACKUP_VERSION,
  backupFileName,
  formatBytes,
  parseBackup,
  tableCounts,
  type BackupFile,
} from "@/queries/AdminBackupQueries";

vi.mock("@/lib/supabase", () => ({
  supabase: {},
  default: {},
}));

const backup = (tables: BackupFile["tables"] = { items: [] }): BackupFile => ({
  format: BACKUP_FORMAT,
  version: BACKUP_VERSION,
  createdAt: "2026-02-03T04:05:06.000Z",
  app: "qwest",
  tables,
});

describe("parseBackup", () => {
  it("accepts a well-formed backup and keeps known tables", () => {
    const result = parseBackup(
      JSON.stringify(backup({ items: [{ id: "potion" }], enemies: [{ id: 1 }] })),
    );

    expect(result.ok).toBe(true);
    expect(result.backup?.tables.items).toHaveLength(1);
    expect(result.backup?.tables.enemies).toHaveLength(1);
  });

  it("ignores tables that are not part of the core set", () => {
    const raw = JSON.stringify({
      ...backup({ items: [] }),
      tables: { items: [], not_a_table: [{ id: 1 }] },
    });

    const result = parseBackup(raw);
    expect(result.ok).toBe(true);
    expect(result.backup?.tables).not.toHaveProperty("not_a_table");
  });

  it("rejects invalid JSON and non-backup files", () => {
    expect(parseBackup("{oops").ok).toBe(false);
    expect(parseBackup(JSON.stringify({ hello: "world" })).error).toMatch(/marker/);
    expect(parseBackup(JSON.stringify([])).error).toMatch(/backup/);
  });

  it("rejects backups from a newer version", () => {
    const result = parseBackup(JSON.stringify({ ...backup(), version: BACKUP_VERSION + 1 }));
    expect(result.ok).toBe(false);
    expect(result.error).toMatch(/newer version/);
  });

  it("rejects a table that is not an array", () => {
    const result = parseBackup(
      JSON.stringify({ ...backup(), tables: { items: { id: "nope" } } }),
    );
    expect(result.ok).toBe(false);
    expect(result.error).toMatch(/items/);
  });

  it("rejects a backup with no known tables", () => {
    const result = parseBackup(JSON.stringify({ ...backup(), tables: { mystery: [] } }));
    expect(result.ok).toBe(false);
    expect(result.error).toMatch(/no known/);
  });
});

describe("tableCounts", () => {
  it("counts only tables present with rows", () => {
    expect(
      tableCounts(backup({ items: [{ id: "a" }, { id: "b" }], enemies: [], rooms: undefined })),
    ).toEqual({ items: 2, enemies: 0 });
  });
});

describe("backupFileName", () => {
  it("produces a sortable timestamped filename", () => {
    expect(backupFileName(new Date(2026, 1, 3, 4, 5, 6))).toBe(
      "qwest-backup-2026-02-03-040506.json",
    );
  });
});

describe("formatBytes", () => {
  it("switches units at the right thresholds", () => {
    expect(formatBytes(512)).toBe("512 B");
    expect(formatBytes(2048)).toBe("2.0 KB");
    expect(formatBytes(2 * 1024 * 1024)).toBe("2.0 MB");
  });
});

describe("BACKUP_TABLES", () => {
  it("starts with parents and ends with join tables", () => {
    expect(BACKUP_TABLES[0]).toBe("sections");
    expect(BACKUP_TABLES).toContain("dialogue_choices");
    expect(BACKUP_TABLES.indexOf("rooms")).toBeLessThan(BACKUP_TABLES.indexOf("quests"));
    expect(BACKUP_TABLES.indexOf("items")).toBeLessThan(BACKUP_TABLES.indexOf("shop_stock"));
  });
});
