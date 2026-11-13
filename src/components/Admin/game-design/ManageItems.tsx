import { useEffect, useMemo, useState } from "react";
import { colors, fonts } from "@/theme";
import { resolveItemImage } from "@/lib/itemImages";
import {
  addShopStock,
  createItem,
  deleteItem,
  getAllItems,
  getMerchantNpcs,
  getShopStock,
  isMissingShopStockTable,
  merchantShopKey,
  removeShopStock,
  seedMissingDefaultItems,
  seedTownShop,
  TOWN_SHOP_KEY,
  updateItem,
  updateShopStockQuantity,
  type ItemWriteValues,
  type ShopStockEntry,
} from "@/queries/ItemQueries";
import type { DbItem } from "@/queries/RoomQueries";
import type { EquipmentSlot } from "@/types/Item";
import { Toast } from "./create-room/Toast";
import { FieldGroup, StyledInput, StyledSelect } from "./create-room/primitives";
import type { CSSProperties } from "react";

type ToastState = { type: "success" | "error"; message: string } | null;
type Tab = "items" | "stock";
type ItemType = "consumable" | "equipment";

const SLOT_OPTIONS: EquipmentSlot[] = [
  "weapon",
  "armor",
  "helmet",
  "shield",
  "accessory",
  "boots",
];

interface ItemDraft {
  id: string;
  name: string;
  type: ItemType;
  value: number;
  img: string;
  effect: string;
  hp_change: number;
  mana_change: number;
  stack_size: number | null;
  slot: EquipmentSlot;
  attack: number | null;
  defense: number | null;
}

const errorMessage = (err: unknown) =>
  err instanceof Error ? err.message : "Something went wrong.";

const emptyDraft = (): ItemDraft => ({
  id: "",
  name: "",
  type: "consumable",
  value: 0,
  img: "",
  effect: "",
  hp_change: 0,
  mana_change: 0,
  stack_size: null,
  slot: "weapon",
  attack: null,
  defense: null,
});

const draftFromItem = (item: DbItem): ItemDraft => ({
  id: item.id,
  name: item.name,
  type: item.type,
  value: item.value,
  img: item.img,
  effect: item.effect ?? "",
  hp_change: item.hp_change ?? 0,
  mana_change: item.mana_change ?? 0,
  stack_size: item.stack_size,
  slot: item.slot ?? "weapon",
  attack: item.attack,
  defense: item.defense,
});

const draftToValues = (draft: ItemDraft): ItemWriteValues => ({
  name: draft.name.trim(),
  type: draft.type,
  value: Number.isFinite(draft.value) ? draft.value : 0,
  img: draft.img.trim(),
  effect: draft.effect.trim() || null,
  hp_change: draft.type === "consumable" ? draft.hp_change : null,
  mana_change: draft.type === "consumable" ? draft.mana_change : null,
  stack_size: draft.type === "consumable" ? draft.stack_size : null,
  slot: draft.type === "equipment" ? draft.slot : null,
  attack: draft.type === "equipment" ? draft.attack : null,
  defense: draft.type === "equipment" ? draft.defense : null,
});

const numberOrNull = (value: string): number | null => {
  if (value.trim() === "") return null;
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : null;
};

function ItemPreview({ draft }: { draft: ItemDraft }) {
  const image = resolveItemImage(draft.img);
  return (
    <div style={previewStyle}>
      <div style={previewEyebrowStyle}>Live preview</div>
      <div style={previewCardStyle}>
        <div style={previewIconStyle}>
          {image ? (
            <img src={image} alt="" style={previewImgStyle} />
          ) : (
            <span style={previewPlaceholderStyle}>?</span>
          )}
        </div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={previewNameStyle}>{draft.name.trim() || "Unnamed item"}</div>
          {draft.effect.trim() && (
            <div style={previewDescriptionStyle}>{draft.effect.trim()}</div>
          )}
          <div style={previewMetaStyle}>
            <span style={previewTypeStyle}>{draft.type}</span>
            <span style={previewPriceStyle}>{draft.value || 0} GP</span>
          </div>
          {draft.type === "consumable" ? (
            <div style={previewStatsStyle}>
              {draft.hp_change !== 0 && <span>HP {signed(draft.hp_change)}</span>}
              {draft.mana_change !== 0 && <span>Mana {signed(draft.mana_change)}</span>}
            </div>
          ) : (
            <div style={previewStatsStyle}>
              <span>{draft.slot}</span>
              {draft.attack !== null && <span>Attack {signed(draft.attack)}</span>}
              {draft.defense !== null && <span>Defense {signed(draft.defense)}</span>}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

const signed = (value: number) => (value > 0 ? `+${value}` : `${value}`);

function StockQuantityInput({
  entry,
  onSave,
}: {
  entry: ShopStockEntry;
  onSave: (quantity: number | null) => void;
}) {
  const [value, setValue] = useState(entry.stock.quantity?.toString() ?? "");

  useEffect(() => {
    setValue(entry.stock.quantity?.toString() ?? "");
  }, [entry.stock.quantity]);

  return (
    <input
      value={value}
      onChange={(event) => setValue(event.target.value)}
      onBlur={() => {
        const next = numberOrNull(value);
        if (next !== entry.stock.quantity) onSave(next);
      }}
      placeholder="∞"
      inputMode="numeric"
      aria-label={`Quantity for ${entry.item.name}`}
      style={quantityInputStyle}
    />
  );
}

export default function ManageItems() {
  const [tab, setTab] = useState<Tab>("items");
  const [items, setItems] = useState<DbItem[]>([]);
  const [merchants, setMerchants] = useState<{ id: number; name: string }[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [draft, setDraft] = useState<ItemDraft>(emptyDraft);
  const [isNew, setIsNew] = useState(false);
  const [query, setQuery] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [isBusy, setIsBusy] = useState(false);
  const [toast, setToast] = useState<ToastState>(null);

  const [shopKey, setShopKey] = useState(TOWN_SHOP_KEY);
  const [stock, setStock] = useState<ShopStockEntry[]>([]);
  const [isLoadingStock, setIsLoadingStock] = useState(false);
  const [stockTableMissing, setStockTableMissing] = useState(false);
  const [stockError, setStockError] = useState<string | null>(null);
  const [newStockItemId, setNewStockItemId] = useState("");
  const [newStockQuantity, setNewStockQuantity] = useState("");

  function showToast(type: "success" | "error", message: string) {
    setToast({ type, message });
    window.setTimeout(() => setToast(null), 4000);
  }

  useEffect(() => {
    let cancelled = false;

    void (async () => {
      setIsLoading(true);
      try {
        const [itemRows, merchantRows] = await Promise.all([
          getAllItems(),
          getMerchantNpcs(),
        ]);
        if (cancelled) return;
        setItems(itemRows);
        setMerchants(merchantRows);
        setSelectedId(itemRows[0]?.id ?? null);
        if (itemRows[0]) setDraft(draftFromItem(itemRows[0]));
      } catch (err) {
        if (!cancelled) showToast("error", errorMessage(err));
      } finally {
        if (!cancelled) setIsLoading(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, []);

  const filteredItems = useMemo(() => {
    const needle = query.trim().toLowerCase();
    if (!needle) return items;
    return items.filter(
      (item) =>
        item.name.toLowerCase().includes(needle) ||
        item.type.toLowerCase().includes(needle),
    );
  }, [items, query]);

  const stockItemIds = useMemo(() => new Set(stock.map((entry) => entry.stock.item_id)), [
    stock,
  ]);
  const availableStockItems = items.filter((item) => !stockItemIds.has(item.id));

  const shopOptions = useMemo(
    () => [
      { key: TOWN_SHOP_KEY, label: "Town shop" },
      ...merchants.map((npc) => ({
        key: merchantShopKey(npc.id),
        label: `${npc.name} (merchant)`,
      })),
    ],
    [merchants],
  );

  async function loadStock(nextShopKey = shopKey) {
    setIsLoadingStock(true);
    setStockError(null);
    try {
      const rows = await getShopStock(nextShopKey);
      setStock(rows);
      setStockTableMissing(false);
      setNewStockItemId("");
    } catch (err) {
      if (isMissingShopStockTable(err)) {
        setStock([]);
        setStockTableMissing(true);
      } else {
        setStockError(errorMessage(err));
      }
    } finally {
      setIsLoadingStock(false);
    }
  }

  useEffect(() => {
    if (tab !== "stock") return;
    void loadStock();
    // Reloads when the selected shop changes or the tab is opened.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tab, shopKey]);

  function selectItem(item: DbItem) {
    setSelectedId(item.id);
    setDraft(draftFromItem(item));
    setIsNew(false);
  }

  function startNewItem() {
    setSelectedId(null);
    setDraft(emptyDraft());
    setIsNew(true);
  }

  function cancelEdit() {
    const current = items.find((item) => item.id === selectedId);
    if (current) {
      setDraft(draftFromItem(current));
      setIsNew(false);
    }
  }

  async function refreshItems(preferredId?: string) {
    const next = await getAllItems();
    setItems(next);
    const selected = next.find((item) => item.id === (preferredId ?? selectedId)) ?? next[0];
    setSelectedId(selected?.id ?? null);
    if (selected) {
      setDraft(draftFromItem(selected));
      setIsNew(false);
    }
    return next;
  }

  async function handleSaveItem() {
    if (!draft.name.trim()) {
      showToast("error", "Item name is required.");
      return;
    }

    setIsBusy(true);
    try {
      if (isNew) {
        const created = await createItem({
          ...draftToValues(draft),
          id: draft.id.trim() || undefined,
        });
        await refreshItems(created.id);
        showToast("success", "Item created.");
      } else if (selectedId) {
        await updateItem(selectedId, draftToValues(draft));
        await refreshItems(selectedId);
        showToast("success", "Item saved.");
      }
    } catch (err) {
      showToast("error", errorMessage(err));
    } finally {
      setIsBusy(false);
    }
  }

  async function handleDeleteItem() {
    if (!selectedId) return;
    const item = items.find((entry) => entry.id === selectedId);
    if (!item) return;
    if (!window.confirm(`Delete “${item.name}”? Chests and quests using it will be affected.`)) {
      return;
    }

    setIsBusy(true);
    try {
      await deleteItem(selectedId);
      await refreshItems();
      showToast("success", "Item deleted.");
    } catch (err) {
      showToast("error", errorMessage(err));
    } finally {
      setIsBusy(false);
    }
  }

  async function handleSeedItems() {
    setIsBusy(true);
    try {
      const count = await seedMissingDefaultItems();
      await refreshItems();
      showToast("success", count === 0 ? "All built-in items already exist." : `Seeded ${count} items.`);
    } catch (err) {
      showToast("error", errorMessage(err));
    } finally {
      setIsBusy(false);
    }
  }

  async function handleSeedTownShop() {
    setIsBusy(true);
    try {
      await seedTownShop();
      await loadStock(TOWN_SHOP_KEY);
      showToast("success", "Town shop stocked.");
    } catch (err) {
      showToast("error", errorMessage(err));
    } finally {
      setIsBusy(false);
    }
  }

  async function handleAddStock() {
    if (!newStockItemId) return;
    setIsBusy(true);
    try {
      await addShopStock(shopKey, newStockItemId, numberOrNull(newStockQuantity));
      await loadStock();
      setNewStockQuantity("");
      showToast("success", "Stock added.");
    } catch (err) {
      showToast("error", errorMessage(err));
    } finally {
      setIsBusy(false);
    }
  }

  async function handleSaveQuantity(entry: ShopStockEntry, quantity: number | null) {
    try {
      await updateShopStockQuantity(entry.stock.id, quantity);
      setStock((current) =>
        current.map((row) =>
          row.stock.id === entry.stock.id
            ? { ...row, stock: { ...row.stock, quantity } }
            : row,
        ),
      );
    } catch (err) {
      showToast("error", errorMessage(err));
    }
  }

  async function handleRemoveStock(entry: ShopStockEntry) {
    try {
      await removeShopStock(entry.stock.id);
      setStock((current) => current.filter((row) => row.stock.id !== entry.stock.id));
    } catch (err) {
      showToast("error", errorMessage(err));
    }
  }

  return (
    <>
      <main style={pageStyle}>
        <div style={pageInnerStyle}>
          <header style={headerStyle}>
            <div>
              <div style={eyebrowStyle}>Game Design</div>
              <h1 style={titleStyle}>Items &amp; Shops</h1>
              <p style={subtitleStyle}>
                Create items and control what each shop sells, including limited stock.
              </p>
            </div>
            <div style={tabsStyle}>
              <button
                type="button"
                onClick={() => setTab("items")}
                style={{ ...tabStyle, ...(tab === "items" ? tabActiveStyle : {}) }}
              >
                Items
              </button>
              <button
                type="button"
                onClick={() => setTab("stock")}
                style={{ ...tabStyle, ...(tab === "stock" ? tabActiveStyle : {}) }}
              >
                Shop stock
              </button>
            </div>
          </header>

          {tab === "items" ? (
            <div className="grid grid-cols-1 gap-5 lg:grid-cols-[300px_minmax(0,1fr)]">
              <section style={panelStyle}>
                <div style={panelHeaderStyle}>
                  <div style={panelHeadingStyle}>Item library</div>
                  <button type="button" onClick={startNewItem} style={addButtonStyle}>
                    + New
                  </button>
                </div>
                <input
                  value={query}
                  onChange={(event) => setQuery(event.target.value)}
                  placeholder="Search items…"
                  aria-label="Search items"
                  style={searchStyle}
                />

                <div style={itemListStyle}>
                  {isLoading && <div style={emptyTextStyle}>Loading…</div>}
                  {!isLoading && filteredItems.length === 0 && (
                    <div style={emptyTextStyle}>
                      No items yet.
                      <br />
                      <button type="button" onClick={() => void handleSeedItems()} style={linkButtonStyle}>
                        Seed built-in items
                      </button>
                    </div>
                  )}
                  {filteredItems.map((item) => {
                    const isSelected = !isNew && item.id === selectedId;
                    return (
                      <button
                        key={item.id}
                        type="button"
                        onClick={() => selectItem(item)}
                        style={{ ...itemRowStyle, ...(isSelected ? itemRowSelectedStyle : {}) }}
                      >
                        <span style={itemRowIconStyle}>
                          {item.img ? (
                            <img src={resolveItemImage(item.img)} alt="" style={itemRowImgStyle} />
                          ) : (
                            "?"
                          )}
                        </span>
                        <span style={{ flex: 1, minWidth: 0 }}>
                          <span style={itemRowNameStyle}>{item.name}</span>
                          <span style={itemRowMetaStyle}>
                            {item.type} · {item.value} GP
                          </span>
                        </span>
                      </button>
                    );
                  })}
                </div>

                {items.length > 0 && (
                  <button
                    type="button"
                    onClick={() => void handleSeedItems()}
                    disabled={isBusy}
                    style={secondaryButtonStyle}
                  >
                    Seed missing built-ins
                  </button>
                )}
              </section>

              <section style={panelStyle}>
                <div style={panelHeaderStyle}>
                  <div style={panelHeadingStyle}>{isNew ? "New item" : "Edit item"}</div>
                  {draft.img && (
                    <span style={imageKeyStyle}>{draft.img}</span>
                  )}
                </div>

                {!isNew && !selectedId ? (
                  <div style={emptyTextStyle}>Select an item to edit it.</div>
                ) : (
                  <>
                    <div style={formGridStyle}>
                      <FieldGroup id="item-name" label="Name">
                        <StyledInput
                          id="item-name"
                          value={draft.name}
                          onChange={(event) =>
                            setDraft((current) => ({ ...current, name: event.target.value }))
                          }
                        />
                      </FieldGroup>
                      <FieldGroup id="item-id" label="ID">
                        <StyledInput
                          id="item-id"
                          value={isNew ? "" : draft.id}
                          disabled
                          placeholder={isNew ? "Generated automatically" : ""}
                        />
                      </FieldGroup>
                      <FieldGroup id="item-type" label="Type">
                        <StyledSelect
                          id="item-type"
                          value={draft.type}
                          onChange={(event) =>
                            setDraft((current) => ({
                              ...current,
                              type: event.target.value as ItemType,
                            }))
                          }
                        >
                          <option value="consumable">Consumable</option>
                          <option value="equipment">Equipment</option>
                        </StyledSelect>
                      </FieldGroup>
                      <FieldGroup id="item-value" label="Price (GP)">
                        <StyledInput
                          id="item-value"
                          type="number"
                          value={draft.value}
                          onChange={(event) =>
                            setDraft((current) => ({
                              ...current,
                              value: Number(event.target.value) || 0,
                            }))
                          }
                        />
                      </FieldGroup>
                      <FieldGroup id="item-img" label="Image key or URL">
                        <StyledInput
                          id="item-img"
                          value={draft.img}
                          placeholder="health-potion.png"
                          onChange={(event) =>
                            setDraft((current) => ({ ...current, img: event.target.value }))
                          }
                        />
                      </FieldGroup>
                    </div>

                    <FieldGroup id="item-effect" label="Description / effect">
                      <textarea
                        id="item-effect"
                        value={draft.effect}
                        onChange={(event) =>
                          setDraft((current) => ({ ...current, effect: event.target.value }))
                        }
                        style={textareaStyle}
                      />
                    </FieldGroup>

                    <div style={formGridStyle}>
                      {draft.type === "consumable" ? (
                        <>
                          <FieldGroup id="item-hp" label="HP change">
                            <StyledInput
                              id="item-hp"
                              type="number"
                              value={draft.hp_change}
                              onChange={(event) =>
                                setDraft((current) => ({
                                  ...current,
                                  hp_change: Number(event.target.value) || 0,
                                }))
                              }
                            />
                          </FieldGroup>
                          <FieldGroup id="item-mana" label="Mana change">
                            <StyledInput
                              id="item-mana"
                              type="number"
                              value={draft.mana_change}
                              onChange={(event) =>
                                setDraft((current) => ({
                                  ...current,
                                  mana_change: Number(event.target.value) || 0,
                                }))
                              }
                            />
                          </FieldGroup>
                          <FieldGroup id="item-stack" label="Stack size (blank = none)">
                            <StyledInput
                              id="item-stack"
                              type="number"
                              value={draft.stack_size ?? ""}
                              onChange={(event) =>
                                setDraft((current) => ({
                                  ...current,
                                  stack_size: numberOrNull(event.target.value),
                                }))
                              }
                            />
                          </FieldGroup>
                        </>
                      ) : (
                        <>
                          <FieldGroup id="item-slot" label="Slot">
                            <StyledSelect
                              id="item-slot"
                              value={draft.slot}
                              onChange={(event) =>
                                setDraft((current) => ({
                                  ...current,
                                  slot: event.target.value as EquipmentSlot,
                                }))
                              }
                            >
                              {SLOT_OPTIONS.map((slot) => (
                                <option key={slot} value={slot}>
                                  {slot}
                                </option>
                              ))}
                            </StyledSelect>
                          </FieldGroup>
                          <FieldGroup id="item-attack" label="Attack bonus (blank = none)">
                            <StyledInput
                              id="item-attack"
                              type="number"
                              value={draft.attack ?? ""}
                              onChange={(event) =>
                                setDraft((current) => ({
                                  ...current,
                                  attack: numberOrNull(event.target.value),
                                }))
                              }
                            />
                          </FieldGroup>
                          <FieldGroup id="item-defense" label="Defense bonus (blank = none)">
                            <StyledInput
                              id="item-defense"
                              type="number"
                              value={draft.defense ?? ""}
                              onChange={(event) =>
                                setDraft((current) => ({
                                  ...current,
                                  defense: numberOrNull(event.target.value),
                                }))
                              }
                            />
                          </FieldGroup>
                        </>
                      )}
                    </div>

                    <ItemPreview draft={draft} />

                    <div style={footerActionsStyle}>
                      {!isNew && (
                        <button
                          type="button"
                          onClick={() => void handleDeleteItem()}
                          disabled={isBusy}
                          style={dangerButtonStyle}
                        >
                          Delete item
                        </button>
                      )}
                      <div style={{ flex: 1 }} />
                      {!isNew && (
                        <button type="button" onClick={cancelEdit} style={secondaryButtonStyle}>
                          Reset
                        </button>
                      )}
                      <button
                        type="button"
                        onClick={() => void handleSaveItem()}
                        disabled={isBusy}
                        style={primaryButtonStyle}
                      >
                        {isBusy ? "Saving…" : isNew ? "Create item" : "Save item"}
                      </button>
                    </div>
                  </>
                )}
              </section>
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-5 lg:grid-cols-[minmax(0,1fr)_320px]">
              <section style={panelStyle}>
                <div style={panelHeaderStyle}>
                  <div>
                    <div style={panelHeadingStyle}>Stock</div>
                    <div style={stockSubheadingStyle}>
                      Blank quantity means unlimited. Buying decrements limited stock.
                    </div>
                  </div>
                  <StyledSelect
                    value={shopKey}
                    onChange={(event) => setShopKey(event.target.value)}
                    aria-label="Shop"
                    style={{ maxWidth: 230 }}
                  >
                    {shopOptions.map((shop) => (
                      <option key={shop.key} value={shop.key}>
                        {shop.label}
                      </option>
                    ))}
                  </StyledSelect>
                </div>

                {stockTableMissing ? (
                  <div style={infoBoxStyle}>
                    <strong style={{ color: colors.gold }}>Shop stock table not found.</strong>
                    <p style={{ margin: "8px 0 0" }}>
                      Run <code>supabase/migrations/003_items_shop.sql</code> in the Supabase SQL
                      editor, then reload this page. The in-game shop falls back to the item
                      library until then.
                    </p>
                  </div>
                ) : isLoadingStock ? (
                  <div style={emptyTextStyle}>Loading stock…</div>
                ) : stockError ? (
                  <div style={infoBoxStyle}>{stockError}</div>
                ) : stock.length === 0 ? (
                  <div style={emptyTextStyle}>
                    Nothing in this shop yet. Add an item below.
                  </div>
                ) : (
                  <div style={stockListStyle}>
                    {stock.map((entry) => (
                      <div key={entry.stock.id} style={stockRowStyle}>
                        <span style={itemRowIconStyle}>
                          {entry.item.img ? (
                            <img src={entry.item.img} alt="" style={itemRowImgStyle} />
                          ) : (
                            "?"
                          )}
                        </span>
                        <span style={{ flex: 1, minWidth: 0 }}>
                          <span style={itemRowNameStyle}>{entry.item.name}</span>
                          <span style={itemRowMetaStyle}>
                            {entry.item.cost} GP ·{" "}
                            {entry.stock.quantity === null ? "unlimited" : "limited"}
                          </span>
                        </span>
                        <StockQuantityInput
                          entry={entry}
                          onSave={(quantity) => void handleSaveQuantity(entry, quantity)}
                        />
                        <button
                          type="button"
                          onClick={() => void handleRemoveStock(entry)}
                          style={dangerSmallButtonStyle}
                        >
                          Remove
                        </button>
                      </div>
                    ))}
                  </div>
                )}

                {!stockTableMissing && (
                  <div style={addStockRowStyle}>
                    <StyledSelect
                      value={newStockItemId}
                      onChange={(event) => setNewStockItemId(event.target.value)}
                      aria-label="Item to add"
                      style={{ flex: 2 }}
                    >
                      <option value="">Choose an item…</option>
                      {availableStockItems.map((item) => (
                        <option key={item.id} value={item.id}>
                          {item.name} · {item.value} GP
                        </option>
                      ))}
                    </StyledSelect>
                    <StyledInput
                      value={newStockQuantity}
                      onChange={(event) => setNewStockQuantity(event.target.value)}
                      placeholder="∞"
                      inputMode="numeric"
                      aria-label="Starting quantity"
                      style={{ flex: 1 }}
                    />
                    <button
                      type="button"
                      onClick={() => void handleAddStock()}
                      disabled={isBusy || !newStockItemId}
                      style={primaryButtonStyle}
                    >
                      Add stock
                    </button>
                  </div>
                )}
              </section>

              <section style={panelStyle}>
                <div style={panelHeadingStyle}>Shop tools</div>
                <p style={helperCopyStyle}>
                  The town shop is used from the Town menu. Merchant NPC shops use{" "}
                  <code>npc:&lt;id&gt;</code> keys.
                </p>
                <button
                  type="button"
                  onClick={() => void handleSeedTownShop()}
                  disabled={isBusy || stockTableMissing}
                  style={{ ...secondaryButtonStyle, width: "100%", marginBottom: 10 }}
                >
                  Stock town shop with all items
                </button>
                <button
                  type="button"
                  onClick={() => void handleSeedItems()}
                  disabled={isBusy}
                  style={{ ...secondaryButtonStyle, width: "100%" }}
                >
                  Seed missing built-in items
                </button>
              </section>
            </div>
          )}
        </div>
      </main>

      {toast && <Toast type={toast.type} message={toast.message} onClose={() => setToast(null)} />}
    </>
  );
}

// Static style objects hoisted out of the render path.
const pageStyle: CSSProperties = {
  minHeight: "100%",
  padding: "36px 28px 72px",
  fontFamily: fonts.body,
};
const pageInnerStyle: CSSProperties = { maxWidth: 1200, margin: "0 auto" };
const headerStyle: CSSProperties = {
  display: "flex",
  alignItems: "flex-end",
  justifyContent: "space-between",
  gap: 16,
  flexWrap: "wrap",
  marginBottom: 24,
};
const eyebrowStyle: CSSProperties = {
  fontSize: 11,
  fontWeight: 700,
  letterSpacing: "0.14em",
  textTransform: "uppercase",
  color: colors.goldMuted,
  fontFamily: fonts.display,
  marginBottom: 6,
};
const titleStyle: CSSProperties = {
  margin: 0,
  fontSize: 30,
  fontWeight: 700,
  color: colors.text,
  fontFamily: fonts.display,
  letterSpacing: "0.04em",
};
const subtitleStyle: CSSProperties = { margin: "6px 0 0", fontSize: 14, color: colors.muted };
const tabsStyle: CSSProperties = {
  display: "flex",
  gap: 4,
  padding: 3,
  background: "rgba(0,0,0,0.3)",
  border: `1px solid ${colors.goldBorder}`,
  borderRadius: 7,
};
const tabStyle: CSSProperties = {
  padding: "7px 14px",
  background: "transparent",
  borderWidth: 1,
  borderStyle: "solid",
  borderColor: "transparent",
  borderRadius: 5,
  color: colors.muted,
  fontSize: 12,
  fontFamily: fonts.display,
  letterSpacing: "0.04em",
  cursor: "pointer",
};
const tabActiveStyle: CSSProperties = {
  background: "rgba(212,175,55,0.12)",
  borderColor: colors.goldBorder,
  color: colors.gold,
};
const panelStyle: CSSProperties = {
  background: "rgba(255,255,255,0.025)",
  border: `1px solid ${colors.goldBorder}`,
  borderRadius: 10,
  padding: 18,
  minWidth: 0,
};
const panelHeaderStyle: CSSProperties = {
  display: "flex",
  alignItems: "flex-start",
  justifyContent: "space-between",
  gap: 12,
  marginBottom: 14,
};
const panelHeadingStyle: CSSProperties = {
  fontSize: 12,
  fontWeight: 700,
  letterSpacing: "0.1em",
  textTransform: "uppercase",
  color: colors.gold,
  fontFamily: fonts.display,
  marginBottom: 4,
};
const stockSubheadingStyle: CSSProperties = { fontSize: 11, color: colors.muted };
const searchStyle: CSSProperties = {
  width: "100%",
  boxSizing: "border-box",
  padding: "8px 10px",
  marginBottom: 10,
  background: "rgba(0,0,0,0.35)",
  border: `1px solid ${colors.goldBorder}`,
  borderRadius: 6,
  color: colors.text,
  fontSize: 12,
  fontFamily: fonts.body,
  outline: "none",
};
const itemListStyle: CSSProperties = {
  display: "flex",
  flexDirection: "column",
  gap: 4,
  maxHeight: "58vh",
  overflowY: "auto",
  marginBottom: 12,
};
const itemRowStyle: CSSProperties = {
  display: "flex",
  alignItems: "center",
  gap: 10,
  width: "100%",
  padding: "8px 10px",
  background: "transparent",
  borderWidth: 1,
  borderStyle: "solid",
  borderColor: "transparent",
  borderRadius: 6,
  cursor: "pointer",
  textAlign: "left",
  font: "inherit",
};
const itemRowSelectedStyle: CSSProperties = {
  background: "rgba(212,175,55,0.1)",
  borderColor: colors.goldBorder,
};
const itemRowIconStyle: CSSProperties = {
  width: 34,
  height: 34,
  flexShrink: 0,
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  background: "rgba(0,0,0,0.35)",
  border: "1px solid rgba(180,140,80,0.15)",
  borderRadius: 6,
  color: colors.muted,
  fontSize: 12,
};
const itemRowImgStyle: CSSProperties = { width: 26, height: 26, imageRendering: "pixelated" };
const itemRowNameStyle: CSSProperties = {
  display: "block",
  fontSize: 13,
  color: colors.text,
  fontFamily: fonts.display,
  letterSpacing: "0.02em",
};
const itemRowMetaStyle: CSSProperties = {
  display: "block",
  fontSize: 10,
  color: "#6B7280",
  textTransform: "capitalize",
};
const emptyTextStyle: CSSProperties = {
  padding: "18px 8px",
  textAlign: "center",
  color: colors.muted,
  fontSize: 12,
  lineHeight: 1.6,
};
const addButtonStyle: CSSProperties = {
  padding: "4px 9px",
  background: "rgba(212,175,55,0.1)",
  border: "1px dashed rgba(212,175,55,0.4)",
  borderRadius: 4,
  color: colors.gold,
  fontSize: 10,
  fontFamily: fonts.display,
  cursor: "pointer",
};
const linkButtonStyle: CSSProperties = {
  marginTop: 8,
  padding: 0,
  background: "transparent",
  border: "none",
  color: colors.gold,
  fontSize: 12,
  textDecoration: "underline",
  cursor: "pointer",
};
const imageKeyStyle: CSSProperties = {
  fontFamily: "monospace",
  fontSize: 10,
  color: "#6B7280",
};
const formGridStyle: CSSProperties = {
  display: "grid",
  gridTemplateColumns: "repeat(auto-fit, minmax(170px, 1fr))",
  gap: "0 14px",
};
const textareaStyle: CSSProperties = {
  width: "100%",
  minHeight: 64,
  padding: 10,
  background: "rgba(0,0,0,0.35)",
  border: `1px solid ${colors.goldBorder}`,
  borderRadius: 6,
  color: colors.text,
  fontSize: 13,
  fontFamily: fonts.body,
  resize: "vertical",
  boxSizing: "border-box",
  outline: "none",
  marginBottom: 16,
};
const previewStyle: CSSProperties = {
  padding: 14,
  background: "rgba(0,0,0,0.22)",
  border: `1px solid ${colors.subtleBorder}`,
  borderRadius: 8,
  marginBottom: 16,
};
const previewEyebrowStyle: CSSProperties = {
  fontSize: 9,
  fontWeight: 700,
  letterSpacing: "0.12em",
  textTransform: "uppercase",
  color: colors.goldMuted,
  fontFamily: fonts.display,
  marginBottom: 10,
};
const previewCardStyle: CSSProperties = {
  display: "flex",
  alignItems: "center",
  gap: 14,
  padding: 12,
  background: "rgba(255,255,255,0.025)",
  border: "1px solid rgba(180,140,80,0.14)",
  borderRadius: 7,
};
const previewIconStyle: CSSProperties = {
  width: 52,
  height: 52,
  flexShrink: 0,
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  background: "rgba(0,0,0,0.4)",
  border: "1px solid rgba(180,140,80,0.15)",
  borderRadius: 7,
};
const previewImgStyle: CSSProperties = { width: 38, height: 38, imageRendering: "pixelated" };
const previewPlaceholderStyle: CSSProperties = { color: "#6B7280", fontSize: 18 };
const previewNameStyle: CSSProperties = {
  fontSize: 14,
  fontWeight: 700,
  color: colors.text,
  fontFamily: fonts.display,
  marginBottom: 3,
};
const previewDescriptionStyle: CSSProperties = {
  fontSize: 12,
  color: "#7A6A52",
  lineHeight: 1.4,
  marginBottom: 4,
};
const previewMetaStyle: CSSProperties = { display: "flex", gap: 10, alignItems: "center" };
const previewTypeStyle: CSSProperties = {
  fontSize: 9,
  textTransform: "uppercase",
  letterSpacing: "0.08em",
  color: colors.goldMuted,
  border: `1px solid ${colors.goldBorder}`,
  borderRadius: 3,
  padding: "1px 5px",
};
const previewPriceStyle: CSSProperties = {
  fontSize: 12,
  fontWeight: 700,
  color: "#F5D76E",
  fontFamily: fonts.display,
};
const previewStatsStyle: CSSProperties = {
  display: "flex",
  gap: 10,
  marginTop: 5,
  fontSize: 10,
  color: colors.muted,
  textTransform: "capitalize",
};
const footerActionsStyle: CSSProperties = { display: "flex", gap: 8, alignItems: "center" };
const primaryButtonStyle: CSSProperties = {
  padding: "8px 16px",
  background: "rgba(212,175,55,0.16)",
  border: `1px solid ${colors.goldBorder}`,
  borderRadius: 6,
  color: colors.gold,
  fontSize: 12,
  fontWeight: 700,
  fontFamily: fonts.display,
  letterSpacing: "0.05em",
  cursor: "pointer",
};
const secondaryButtonStyle: CSSProperties = {
  padding: "8px 14px",
  background: "rgba(255,255,255,0.03)",
  border: "1px solid rgba(255,255,255,0.1)",
  borderRadius: 6,
  color: "#A8916A",
  fontSize: 11,
  fontFamily: fonts.display,
  cursor: "pointer",
};
const dangerButtonStyle: CSSProperties = {
  padding: "8px 14px",
  background: "rgba(220,38,38,0.1)",
  border: "1px solid rgba(220,38,38,0.3)",
  borderRadius: 6,
  color: "#FCA5A5",
  fontSize: 11,
  fontFamily: fonts.display,
  cursor: "pointer",
};
const dangerSmallButtonStyle: CSSProperties = {
  padding: "5px 10px",
  background: "rgba(220,38,38,0.07)",
  border: "1px solid rgba(220,38,38,0.25)",
  borderRadius: 4,
  color: "#FCA5A5",
  fontSize: 10,
  fontFamily: fonts.display,
  cursor: "pointer",
};
const stockListStyle: CSSProperties = { display: "flex", flexDirection: "column", gap: 6 };
const stockRowStyle: CSSProperties = {
  display: "flex",
  alignItems: "center",
  gap: 12,
  padding: "8px 10px",
  background: "rgba(0,0,0,0.18)",
  border: `1px solid ${colors.subtleBorder}`,
  borderRadius: 6,
};
const quantityInputStyle: CSSProperties = {
  width: 72,
  padding: "6px 8px",
  background: "rgba(0,0,0,0.35)",
  border: `1px solid ${colors.goldBorder}`,
  borderRadius: 5,
  color: colors.text,
  fontSize: 12,
  textAlign: "right",
  fontFamily: fonts.body,
  outline: "none",
};
const addStockRowStyle: CSSProperties = {
  display: "flex",
  alignItems: "center",
  gap: 8,
  marginTop: 16,
  paddingTop: 16,
  borderTop: `1px solid ${colors.subtleBorder}`,
  flexWrap: "wrap",
};
const infoBoxStyle: CSSProperties = {
  padding: 14,
  background: "rgba(242,164,68,0.06)",
  border: "1px solid rgba(242,164,68,0.25)",
  borderRadius: 7,
  color: colors.muted,
  fontSize: 12,
  lineHeight: 1.6,
};
const helperCopyStyle: CSSProperties = {
  margin: "0 0 14px",
  fontSize: 12,
  lineHeight: 1.6,
  color: colors.muted,
};
