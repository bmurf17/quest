import { supabase } from "@/lib/supabase";
import type { EnemyMove } from "@/types/EnemyMove";
import type { Enemy } from "@/types/Enemy";

export interface AdminEnemyRow {
  id: number;
  name: string;
  health: number;
  max_health: number | null;
  strength: number;
  dex: number;
  defense: number;
  img: string;
  exp_gain: number;
  type: "enemy" | "boss";
  phase_thresholds: number[] | null;
  moves: EnemyMove[] | null;
  spawns: Enemy[] | null;
}

export interface AdminRoomSummary {
  id: number;
  name: string;
  section_id: number | null;
}

const enemyColumns =
  "id, name, health, max_health, strength, dex, defense, img, exp_gain, type, phase_thresholds, moves, spawns";

export async function getAdminEnemies(): Promise<AdminEnemyRow[]> {
  const { data, error } = await supabase
    .from("enemies")
    .select(enemyColumns)
    .order("name");

  if (error) throw error;

  return (data ?? []).map((row) => ({
    ...row,
    type: row.type === "boss" ? "boss" : "enemy",
    phase_thresholds: Array.isArray(row.phase_thresholds)
      ? (row.phase_thresholds as number[])
      : null,
    moves: Array.isArray(row.moves) ? (row.moves as unknown as EnemyMove[]) : null,
    spawns: Array.isArray(row.spawns) ? (row.spawns as unknown as Enemy[]) : null,
  }));
}

export async function getAdminRoomSummaries(): Promise<AdminRoomSummary[]> {
  const { data, error } = await supabase
    .from("rooms")
    .select("id, name, section_id")
    .order("name");

  if (error) throw error;
  return data ?? [];
}

export async function getEnemyRoomIds(enemyId: number): Promise<number[]> {
  const { data, error } = await supabase
    .from("room_enemies")
    .select("room_id")
    .eq("enemy_id", enemyId);

  if (error) throw error;
  return (data ?? []).map((row) => row.room_id);
}

/** Replace the set of rooms a library enemy appears in. */
export async function setEnemyRooms(enemyId: number, roomIds: number[]): Promise<void> {
  const { error: deleteError } = await supabase
    .from("room_enemies")
    .delete()
    .eq("enemy_id", enemyId);

  if (deleteError) throw deleteError;
  if (roomIds.length === 0) return;

  const { error } = await supabase
    .from("room_enemies")
    .insert(roomIds.map((roomId) => ({ room_id: roomId, enemy_id: enemyId })));

  if (error) throw error;
}

export type AdminEnemyValues = Omit<AdminEnemyRow, "id">;

function toWriteRow(values: Partial<AdminEnemyValues>) {
  return {
    ...values,
    moves: values.moves as unknown as never,
    spawns: values.spawns as unknown as never,
  };
}

export async function createEnemy(values: AdminEnemyValues): Promise<AdminEnemyRow> {
  const { data, error } = await supabase
    .from("enemies")
    .insert(toWriteRow(values))
    .select(enemyColumns)
    .single();

  if (error) throw error;
  return data as unknown as AdminEnemyRow;
}

export async function updateEnemy(
  enemyId: number,
  values: Partial<AdminEnemyValues>,
): Promise<void> {
  const { error } = await supabase.from("enemies").update(toWriteRow(values)).eq("id", enemyId);

  if (error) throw error;
}

export async function deleteEnemy(enemyId: number): Promise<void> {
  const { error } = await supabase.from("enemies").delete().eq("id", enemyId);
  if (error) throw error;
}
