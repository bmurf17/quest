import { supabase } from "@/lib/supabase";
import type { Database } from "@/types/database.generated";
import type { PostgrestError } from "@supabase/supabase-js";

type TableName = keyof Database["public"]["Tables"];
type TableRow = Record<string, unknown>;

/**
 * Core content tables in dependency order (parents first). Restore inserts in
 * this order and deletes in reverse so foreign keys stay satisfied.
 *
 * `shop_stock` is included last: it is optional until migration 003 is applied.
 */
export const BACKUP_TABLES: readonly TableName[] = [
  "sections",
  "items",
  "enemies",
  "transitions",
  "camps",
  "chests",
  "rooms",
  "quests",
  "npcs",
  "quest_objectives",
  "quest_rewards",
  "room_interactions",
  "room_enemies",
  "neighboring_rooms",
  "npc_dialogues",
  "dialogue_nodes",
  "dialogue_choices",
  "dialogue_outcomes",
  "conversation_flags",
  "shop_stock",
];

/** Tables that are safe to omit from a backup without blocking a restore. */
const OPTIONAL_TABLES: ReadonlySet<TableName> = new Set(["shop_stock"]);

export const BACKUP_FORMAT = "qwest-backup";
export const BACKUP_VERSION = 1;

export interface BackupFile {
  format: typeof BACKUP_FORMAT;
  version: number;
  createdAt: string;
  app: "qwest";
  tables: Partial<Record<TableName, TableRow[]>>;
}

export interface BackupSnapshot {
  id: string;
  createdAt: string;
  label: string;
  bytes: number;
  tableCounts: Record<string, number>;
  payload: BackupFile;
}

export interface BackupBuildResult {
  backup: BackupFile;
  /** Tables that could not be read, e.g. an optional table that does not exist yet. */
  skippedTables: string[];
  totalRows: number;
}

const isMissingTable = (error: unknown) => {
  const pgError = error as PostgrestError | null;
  if (!pgError) return false;
  if (pgError.code === "42P01" || pgError.code === "PGRST205") return true;
  return /does not exist|schema cache/i.test(pgError.message ?? "");
};

/** Read every row from every core table into a portable JSON backup. */
export async function buildBackup(): Promise<BackupBuildResult> {
  const tables: Partial<Record<TableName, TableRow[]>> = {};
  const skippedTables: string[] = [];
  let totalRows = 0;

  for (const table of BACKUP_TABLES) {
    const { data, error } = await supabase.from(table).select("*");
    if (error) {
      if (OPTIONAL_TABLES.has(table) && isMissingTable(error)) {
        skippedTables.push(table);
        continue;
      }
      throw error;
    }
    const rows = (data ?? []) as TableRow[];
    tables[table] = rows;
    totalRows += rows.length;
  }

  return {
    backup: {
      format: BACKUP_FORMAT,
      version: BACKUP_VERSION,
      createdAt: new Date().toISOString(),
      app: "qwest",
      tables,
    },
    skippedTables,
    totalRows,
  };
}

export function backupFileName(createdAt = new Date()): string {
  const pad = (value: number) => String(value).padStart(2, "0");
  return [
    "qwest-backup-",
    createdAt.getFullYear(),
    "-",
    pad(createdAt.getMonth() + 1),
    "-",
    pad(createdAt.getDate()),
    "-",
    pad(createdAt.getHours()),
    pad(createdAt.getMinutes()),
    pad(createdAt.getSeconds()),
    ".json",
  ].join("");
}

export function tableCounts(backup: BackupFile): Record<string, number> {
  const counts: Record<string, number> = {};
  for (const table of BACKUP_TABLES) {
    const rows = backup.tables[table];
    if (rows) counts[table] = rows.length;
  }
  return counts;
}

export function backupBytes(backup: BackupFile): number {
  return new Blob([JSON.stringify(backup)]).size;
}

export interface BackupValidation {
  ok: boolean;
  error?: string;
  backup?: BackupFile;
}

/** Validate an imported file before anything destructive happens. */
export function parseBackup(raw: string): BackupValidation {
  let parsed: unknown;
  try {
    parsed = JSON.parse(raw);
  } catch {
    return { ok: false, error: "That file is not valid JSON." };
  }

  if (!parsed || typeof parsed !== "object") {
    return { ok: false, error: "That file does not look like a backup." };
  }

  const candidate = parsed as Partial<BackupFile>;
  if (candidate.format !== BACKUP_FORMAT) {
    return { ok: false, error: "Missing the Qwest backup marker in that file." };
  }
  if (typeof candidate.version !== "number") {
    return { ok: false, error: "That backup has no version number." };
  }
  if (candidate.version > BACKUP_VERSION) {
    return {
      ok: false,
      error: `That backup was made by a newer version (${candidate.version}).`,
    };
  }
  if (!candidate.tables || typeof candidate.tables !== "object") {
    return { ok: false, error: "That backup contains no table data." };
  }

  const tables: Partial<Record<TableName, TableRow[]>> = {};
  for (const table of BACKUP_TABLES) {
    const rows = (candidate.tables as Record<string, unknown>)[table];
    if (rows === undefined) continue;
    if (!Array.isArray(rows)) {
      return { ok: false, error: `Table "${table}" is not an array of rows.` };
    }
    tables[table] = rows as TableRow[];
  }

  if (Object.keys(tables).length === 0) {
    return { ok: false, error: "That backup contains no known Qwest tables." };
  }

  return {
    ok: true,
    backup: {
      format: BACKUP_FORMAT,
      version: candidate.version,
      createdAt: candidate.createdAt ?? new Date().toISOString(),
      app: "qwest",
      tables,
    },
  };
}

export interface RestoreReport {
  restoredTables: string[];
  failed: { table: string; message: string }[];
  sequencesReset: boolean;
  sequenceWarning?: string;
}

/** Column used to match every row when clearing a table for a full restore. */
const DELETE_FILTER_COLUMN: Partial<Record<TableName, string>> = {
  quest_rewards: "quest_id",
};

async function deleteTable(table: TableName): Promise<void> {
  // PostgREST requires a filter on delete. "not null" on a NOT NULL key column
  // matches every row, including UUID primary keys.
  const column = DELETE_FILTER_COLUMN[table] ?? "id";
  const { error } = await supabase.from(table).delete().not(column, "is", null);
  if (error) throw error;
}

const BATCH_SIZE = 250;

async function insertTable(table: TableName, rows: TableRow[]): Promise<void> {
  for (let index = 0; index < rows.length; index += BATCH_SIZE) {
    const batch = rows.slice(index, index + BATCH_SIZE);
    const { error } = await supabase.from(table).insert(batch as never);
    if (error) throw error;
  }
}

/**
 * Restore a backup: remove rows that the backup knows about, then insert the
 * backup's rows. Tables present in the backup but missing from the live schema
 * (e.g. `shop_stock` before migration 003) are reported instead of aborting.
 *
 * The caller must have already required an explicit confirmation.
 */
export async function restoreBackup(backup: BackupFile): Promise<RestoreReport> {
  const presentTables = BACKUP_TABLES.filter((table) => backup.tables[table] !== undefined);
  const report: RestoreReport = {
    restoredTables: [],
    failed: [],
    sequencesReset: false,
  };

  // A restore is a full replace: clear children before parents, then rebuild.
  for (const table of [...presentTables].reverse()) {
    try {
      await deleteTable(table);
    } catch (error) {
      const pgError = error as PostgrestError | null;
      report.failed.push({
        table,
        message: pgError?.message ?? (error instanceof Error ? error.message : "Delete failed."),
      });
    }
  }

  // Insert parents before children.
  for (const table of presentTables) {
    const rows = backup.tables[table] ?? [];
    if (rows.length === 0) continue;
    try {
      await insertTable(table, rows);
      report.restoredTables.push(table);
    } catch (error) {
      const pgError = error as PostgrestError | null;
      report.failed.push({
        table,
        message: pgError?.message ?? (error instanceof Error ? error.message : "Insert failed."),
      });
    }
  }

  // Explicit ids do not advance Postgres identity sequences. Reset them so new
  // rows created after a restore do not collide. Best-effort: the helper only
  // exists once migration 004 has been applied.
  const { error: rpcError } = await supabase.rpc("reset_content_sequences");
  if (rpcError) {
    report.sequenceWarning =
      "Restore preserved ids but could not reset identity sequences. Run " +
      "supabase/migrations/004_backup_sequences.sql before creating new rows.";
  } else {
    report.sequencesReset = true;
  }

  return report;
}

const SNAPSHOT_KEY = "qwest.backup.snapshots.v1";
const MAX_SNAPSHOTS = 8;
const MAX_SNAPSHOT_BYTES = 4_000_000;

export function loadSnapshots(): BackupSnapshot[] {
  try {
    const raw = localStorage.getItem(SNAPSHOT_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as BackupSnapshot[];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function persistSnapshots(snapshots: BackupSnapshot[]): void {
  localStorage.setItem(SNAPSHOT_KEY, JSON.stringify(snapshots));
}

/** Store a backup in local history. Returns the snapshot, or null if it is too large. */
export function saveSnapshot(backup: BackupFile, label: string): BackupSnapshot | null {
  const bytes = backupBytes(backup);
  if (bytes > MAX_SNAPSHOT_BYTES) return null;

  const snapshot: BackupSnapshot = {
    id: crypto.randomUUID(),
    createdAt: new Date().toISOString(),
    label: label.trim() || "Manual snapshot",
    bytes,
    tableCounts: tableCounts(backup),
    payload: backup,
  };

  const existing = loadSnapshots();
  persistSnapshots([snapshot, ...existing].slice(0, MAX_SNAPSHOTS));
  return snapshot;
}

export function deleteSnapshot(id: string): BackupSnapshot[] {
  const next = loadSnapshots().filter((snapshot) => snapshot.id !== id);
  persistSnapshots(next);
  return next;
}

export function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}
