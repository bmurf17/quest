import { supabase } from "@/lib/supabase";
import { DEFAULT_ITEM_ROWS } from "@/data/itemDefaults";
import type { Item } from "@/types/Item";
import { mapDbItem, type DbItem } from "./RoomQueries";
import type { PostgrestError } from "@supabase/supabase-js";

export const TOWN_SHOP_KEY = "town";
export const merchantShopKey = (npcId: number) => `npc:${npcId}`;

export interface ShopStockRow {
  id: number;
  shop_key: string;
  item_id: string;
  quantity: number | null;
  sort_order: number;
  created_at: string;
}

export interface ShopStockEntry {
  stock: ShopStockRow;
  item: Item;
}

/** A shop entry as the game needs it, whether or not the stock table exists. */
export interface ShopEntry {
  stockId: number | null;
  itemId: string;
  item: Item;
  quantity: number | null;
}

const itemColumns =
  "id, name, value, img, type, effect, hp_change, mana_change, stack_size, slot, attack, defense";

export async function getAllItems(): Promise<DbItem[]> {
  const { data, error } = await supabase.from("items").select(itemColumns).order("name");
  if (error) throw error;
  return (data ?? []) as DbItem[];
}

export async function getMerchantNpcs(): Promise<{ id: number; name: string }[]> {
  const { data, error } = await supabase
    .from("npcs")
    .select("id, name")
    .eq("npc_type", "merchant")
    .order("name");
  if (error) throw error;
  return data ?? [];
}

export type ItemWriteValues = Omit<DbItem, "id">;

const UUID_PATTERN =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

/**
 * The live `items.id` column is UUID. Named ids are not portable, so only an
 * explicit UUID is honoured; anything else gets a generated id.
 */
export async function createItem(values: ItemWriteValues & { id?: string }): Promise<DbItem> {
  const { id: suppliedId, ...rest } = values;
  const id =
    suppliedId && UUID_PATTERN.test(suppliedId.trim())
      ? suppliedId.trim()
      : crypto.randomUUID();
  const { data, error } = await supabase
    .from("items")
    .insert({ ...rest, id })
    .select(itemColumns)
    .single();

  if (error) throw error;
  return data as DbItem;
}

export async function updateItem(id: string, values: Partial<ItemWriteValues>): Promise<void> {
  const { error } = await supabase.from("items").update(values).eq("id", id);
  if (error) throw error;
}

export async function deleteItem(id: string): Promise<void> {
  const { error } = await supabase.from("items").delete().eq("id", id);
  if (error) throw error;
}

const defaultItemId = () => crypto.randomUUID();

/** Insert any built-in items that are missing, matched by name. */
export async function seedMissingDefaultItems(): Promise<number> {
  const existing = await getAllItems();
  const existingNames = new Set(existing.map((item) => item.name.toLowerCase()));
  const rows = DEFAULT_ITEM_ROWS.filter(
    (item) => !existingNames.has(item.name.toLowerCase()),
  ).map((item) => ({ ...item, id: item.id ?? defaultItemId() }));

  if (rows.length === 0) return 0;

  const { error } = await supabase.from("items").upsert(rows, { ignoreDuplicates: true });
  if (error) throw error;
  return rows.length;
}

export function isMissingShopStockTable(error: unknown): boolean {
  const pgError = error as PostgrestError | null;
  if (!pgError) return false;
  if (pgError.code === "42P01") return true;
  return /shop_stock/.test(pgError.message ?? "") && /does not exist|schema cache/i.test(pgError.message ?? "");
}

export async function getShopStock(shopKey: string): Promise<ShopStockEntry[]> {
  const { data, error } = await supabase
    .from("shop_stock")
    .select(`*, item:items(${itemColumns})`)
    .eq("shop_key", shopKey)
    .order("sort_order")
    .order("id");

  if (error) throw error;

  const entries: ShopStockEntry[] = [];
  for (const row of data ?? []) {
    const item = mapDbItem(row.item as DbItem | null);
    if (!item) continue;
    entries.push({ stock: row as ShopStockRow, item });
  }
  return entries;
}

/**
 * Shop entries for the game. If the shop-stock migration has not been applied
 * yet, fall back to the items table so the shop keeps working (with unlimited
 * stock) instead of going blank.
 */
export async function getShopEntries(
  shopKey: string,
): Promise<{ entries: ShopEntry[]; stockTableAvailable: boolean }> {
  try {
    const stock = await getShopStock(shopKey);
    return {
      entries: stock.map(({ stock: row, item }) => ({
        stockId: row.id,
        itemId: row.item_id,
        item,
        quantity: row.quantity,
      })),
      stockTableAvailable: true,
    };
  } catch (error) {
    if (!isMissingShopStockTable(error)) throw error;

    const items = await getAllItems();
    const entries: ShopEntry[] = [];
    for (const row of items) {
      const item = mapDbItem(row);
      if (!item) continue;
      entries.push({ stockId: null, itemId: row.id, item, quantity: null });
    }
    return { entries, stockTableAvailable: false };
  }
}

export async function addShopStock(
  shopKey: string,
  itemId: string,
  quantity: number | null,
): Promise<void> {
  const { error } = await supabase.from("shop_stock").insert({
    shop_key: shopKey,
    item_id: itemId,
    quantity,
  });
  if (error) throw error;
}

export async function updateShopStockQuantity(
  stockId: number,
  quantity: number | null,
): Promise<void> {
  const { error } = await supabase
    .from("shop_stock")
    .update({ quantity })
    .eq("id", stockId);
  if (error) throw error;
}

export async function removeShopStock(stockId: number): Promise<void> {
  const { error } = await supabase.from("shop_stock").delete().eq("id", stockId);
  if (error) throw error;
}

/** Decrement limited stock by one. No-op for unlimited (NULL quantity) rows. */
export async function decrementShopStock(shopKey: string, itemId: string): Promise<void> {
  const { data, error } = await supabase
    .from("shop_stock")
    .select("id, quantity")
    .eq("shop_key", shopKey)
    .eq("item_id", itemId)
    .maybeSingle();

  if (error) throw error;
  if (!data) return;
  if (data.quantity === null) return;
  if (data.quantity <= 0) throw new Error("This item is sold out.");

  const { data: updated, error: updateError } = await supabase
    .from("shop_stock")
    .update({ quantity: data.quantity - 1 })
    .eq("id", data.id)
    .eq("quantity", data.quantity)
    .select("id");

  if (updateError) throw updateError;
  if (!updated || updated.length === 0) {
    throw new Error("Stock changed while buying. Try again.");
  }
}

/** Give the town shop the built-in items with sensible starting quantities. */
export async function seedTownShop(): Promise<number> {
  const items = await getAllItems();
  if (items.length === 0) return 0;

  const rows = items.map((item, index) => ({
    shop_key: TOWN_SHOP_KEY,
    item_id: item.id,
    quantity:
      item.name === "Health Potion" ? 10 : item.name === "Mana Potion" ? 5 : null,
    sort_order: index,
  }));

  const { error } = await supabase
    .from("shop_stock")
    .upsert(rows, { onConflict: "shop_key,item_id", ignoreDuplicates: true });
  if (error) throw error;
  return rows.length;
}
