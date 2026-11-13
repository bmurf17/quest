import { useEffect, useMemo, useState } from "react";
import { colors, fonts } from "@/theme";
import { estimateEnemy } from "@/lib/enemyBalance";
import {
  createEnemy,
  deleteEnemy,
  getAdminEnemies,
  getAdminRoomSummaries,
  getEnemyRoomIds,
  setEnemyRooms,
  updateEnemy,
  type AdminEnemyRow,
  type AdminRoomSummary,
} from "@/queries/AdminEnemyQueries";
import type { Enemy } from "@/types/Enemy";
import { Toast } from "./create-room/Toast";
import { FieldGroup, StyledInput, StyledSelect } from "./create-room/primitives";
import type { CSSProperties } from "react";

type ToastState = { type: "success" | "error"; message: string } | null;
type Tab = "library" | "balance";
type EnemyType = "enemy" | "boss";

interface EnemyDraft {
  name: string;
  type: EnemyType;
  img: string;
  health: number;
  max_health: number | null;
  strength: number;
  dex: number;
  defense: number;
  exp_gain: number;
  phaseThresholds: string;
  movesJson: string;
  spawnsJson: string;
}

const errorMessage = (err: unknown) =>
  err instanceof Error ? err.message : "Something went wrong.";

const emptyDraft = (): EnemyDraft => ({
  name: "",
  type: "enemy",
  img: "",
  health: 20,
  max_health: null,
  strength: 5,
  dex: 5,
  defense: 5,
  exp_gain: 10,
  phaseThresholds: "",
  movesJson: "[]",
  spawnsJson: "[]",
});

const draftFromEnemy = (enemy: AdminEnemyRow): EnemyDraft => ({
  name: enemy.name,
  type: enemy.type,
  img: enemy.img,
  health: enemy.health,
  max_health: enemy.max_health,
  strength: enemy.strength,
  dex: enemy.dex,
  defense: enemy.defense,
  exp_gain: enemy.exp_gain,
  phaseThresholds: (enemy.phase_thresholds ?? []).join(", "),
  movesJson: JSON.stringify(enemy.moves ?? [], null, 2),
  spawnsJson: JSON.stringify(enemy.spawns ?? [], null, 2),
});

const parseThresholds = (value: string): number[] =>
  value
    .split(",")
    .map((part) => Number(part.trim()))
    .filter((value) => Number.isFinite(value) && value > 0)
    .sort((a, b) => b - a);

const parseJsonArray = (label: string, value: string): unknown[] => {
  if (!value.trim()) return [];
  let parsed: unknown;
  try {
    parsed = JSON.parse(value);
  } catch {
    throw new Error(`${label} must be valid JSON.`);
  }
  if (!Array.isArray(parsed)) throw new Error(`${label} must be a JSON array.`);
  return parsed;
};

const draftToEnemy = (draft: EnemyDraft): Enemy => ({
  id: 0,
  name: draft.name,
  health: draft.health,
  maxHealth: draft.max_health ?? undefined,
  strength: draft.strength,
  dex: draft.dex,
  defense: draft.defense,
  img: draft.img,
  expGain: draft.exp_gain,
  type: draft.type,
});

const draftToValues = (draft: EnemyDraft) => {
  const moves = parseJsonArray("Moves", draft.movesJson) as AdminEnemyRow["moves"];
  const spawns = parseJsonArray("Spawns", draft.spawnsJson) as AdminEnemyRow["spawns"];

  return {
    name: draft.name.trim(),
    type: draft.type,
    img: draft.img.trim(),
    health: Math.max(1, draft.health),
    max_health: draft.max_health,
    strength: draft.strength,
    dex: draft.dex,
    defense: draft.defense,
    exp_gain: Math.max(0, draft.exp_gain),
    phase_thresholds: parseThresholds(draft.phaseThresholds),
    moves,
    spawns,
  };
};

function BalanceCell({
  value,
  onSave,
  ariaLabel,
}: {
  value: number;
  onSave: (next: number) => void;
  ariaLabel: string;
}) {
  const [draft, setDraft] = useState(String(value));

  useEffect(() => {
    setDraft(String(value));
  }, [value]);

  return (
    <input
      value={draft}
      aria-label={ariaLabel}
      inputMode="numeric"
      onChange={(event) => setDraft(event.target.value)}
      onBlur={() => {
        const next = Number(draft);
        if (!Number.isFinite(next)) {
          setDraft(String(value));
          return;
        }
        if (next !== value) onSave(next);
      }}
      style={balanceInputStyle}
    />
  );
}

export default function ManageEnemies() {
  const [tab, setTab] = useState<Tab>("library");
  const [enemies, setEnemies] = useState<AdminEnemyRow[]>([]);
  const [rooms, setRooms] = useState<AdminRoomSummary[]>([]);
  const [selectedId, setSelectedId] = useState<number | null>(null);
  const [draft, setDraft] = useState<EnemyDraft>(emptyDraft);
  const [isNew, setIsNew] = useState(false);
  const [query, setQuery] = useState("");
  const [typeFilter, setTypeFilter] = useState<"all" | EnemyType>("all");
  const [linkedRoomIds, setLinkedRoomIds] = useState<number[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isBusy, setIsBusy] = useState(false);
  const [toast, setToast] = useState<ToastState>(null);

  function showToast(type: "success" | "error", message: string) {
    setToast({ type, message });
    window.setTimeout(() => setToast(null), 4000);
  }

  useEffect(() => {
    let cancelled = false;
    void (async () => {
      setIsLoading(true);
      try {
        const [enemyRows, roomRows] = await Promise.all([
          getAdminEnemies(),
          getAdminRoomSummaries(),
        ]);
        if (cancelled) return;
        setEnemies(enemyRows);
        setRooms(roomRows);
        setSelectedId(enemyRows[0]?.id ?? null);
        if (enemyRows[0]) setDraft(draftFromEnemy(enemyRows[0]));
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

  useEffect(() => {
    if (selectedId === null) {
      setLinkedRoomIds([]);
      return;
    }
    let cancelled = false;
    void getEnemyRoomIds(selectedId)
      .then((ids) => {
        if (!cancelled) setLinkedRoomIds(ids);
      })
      .catch((err) => {
        if (!cancelled) showToast("error", errorMessage(err));
      });
    return () => {
      cancelled = true;
    };
  }, [selectedId]);

  const filteredEnemies = useMemo(() => {
    const needle = query.trim().toLowerCase();
    return enemies.filter((enemy) => {
      const matchesQuery = !needle || enemy.name.toLowerCase().includes(needle);
      const matchesType = typeFilter === "all" || enemy.type === typeFilter;
      return matchesQuery && matchesType;
    });
  }, [enemies, query, typeFilter]);

  const selectedEnemy = enemies.find((enemy) => enemy.id === selectedId) ?? null;
  const estimate = useMemo(() => estimateEnemy(draftToEnemy(draft)), [draft]);

  function selectEnemy(enemy: AdminEnemyRow) {
    setSelectedId(enemy.id);
    setDraft(draftFromEnemy(enemy));
    setIsNew(false);
  }

  function startNewEnemy() {
    setSelectedId(null);
    setDraft(emptyDraft());
    setIsNew(true);
  }

  async function refreshEnemies(preferredId?: number) {
    const next = await getAdminEnemies();
    setEnemies(next);
    const picked = next.find((enemy) => enemy.id === (preferredId ?? selectedId)) ?? next[0];
    setSelectedId(picked?.id ?? null);
    if (picked) {
      setDraft(draftFromEnemy(picked));
      setIsNew(false);
    }
  }

  async function handleSave() {
    if (!draft.name.trim()) {
      showToast("error", "Enemy name is required.");
      return;
    }

    setIsBusy(true);
    try {
      if (isNew) {
        const created = await createEnemy(draftToValues(draft));
        await refreshEnemies(created.id);
        showToast("success", "Enemy created in the library.");
      } else if (selectedId) {
        await updateEnemy(selectedId, draftToValues(draft));
        await refreshEnemies(selectedId);
        showToast("success", "Enemy saved.");
      }
    } catch (err) {
      showToast("error", errorMessage(err));
    } finally {
      setIsBusy(false);
    }
  }

  async function handleDelete() {
    if (!selectedId || !selectedEnemy) return;
    if (!window.confirm(`Delete “${selectedEnemy.name}” from the library?`)) return;

    setIsBusy(true);
    try {
      await deleteEnemy(selectedId);
      await refreshEnemies();
      showToast("success", "Enemy deleted.");
    } catch (err) {
      showToast("error", errorMessage(err));
    } finally {
      setIsBusy(false);
    }
  }

  async function handleToggleRoom(roomId: number) {
    if (!selectedId) return;
    const next = linkedRoomIds.includes(roomId)
      ? linkedRoomIds.filter((id) => id !== roomId)
      : [...linkedRoomIds, roomId];
    setLinkedRoomIds(next);
    try {
      await setEnemyRooms(selectedId, next);
    } catch (err) {
      setLinkedRoomIds(linkedRoomIds);
      showToast("error", errorMessage(err));
    }
  }

  async function handleInlineUpdate(
    enemy: AdminEnemyRow,
    values: Partial<Pick<AdminEnemyRow, "health" | "strength" | "dex" | "defense" | "exp_gain">>,
  ) {
    setEnemies((current) =>
      current.map((entry) => (entry.id === enemy.id ? { ...entry, ...values } : entry)),
    );
    if (selectedId === enemy.id) {
      setDraft((current) => ({ ...current, ...values }));
    }
    try {
      await updateEnemy(enemy.id, values);
    } catch (err) {
      showToast("error", errorMessage(err));
      await refreshEnemies(enemy.id);
    }
  }

  return (
    <>
      <main style={pageStyle}>
        <div style={pageInnerStyle}>
          <header style={headerStyle}>
            <div>
              <div style={eyebrowStyle}>Game Design</div>
              <h1 style={titleStyle}>Enemies &amp; Balance</h1>
              <p style={subtitleStyle}>
                One reusable enemy library, boss phases, and a quick balance overview.
              </p>
            </div>
            <div style={tabsStyle}>
              <button
                type="button"
                onClick={() => setTab("library")}
                style={{ ...tabStyle, ...(tab === "library" ? tabActiveStyle : {}) }}
              >
                Library
              </button>
              <button
                type="button"
                onClick={() => setTab("balance")}
                style={{ ...tabStyle, ...(tab === "balance" ? tabActiveStyle : {}) }}
              >
                Balance
              </button>
            </div>
          </header>

          {tab === "library" ? (
            <div className="grid grid-cols-1 gap-5 lg:grid-cols-[290px_minmax(0,1fr)]">
              <section style={panelStyle}>
                <div style={panelHeaderStyle}>
                  <div style={panelHeadingStyle}>Library</div>
                  <button type="button" onClick={startNewEnemy} style={addButtonStyle}>
                    + New
                  </button>
                </div>
                <input
                  value={query}
                  onChange={(event) => setQuery(event.target.value)}
                  placeholder="Search enemies…"
                  aria-label="Search enemies"
                  style={searchStyle}
                />
                <div style={{ marginBottom: 10 }}>
                  <StyledSelect
                    value={typeFilter}
                    onChange={(event) =>
                      setTypeFilter(event.target.value as typeof typeFilter)
                    }
                    aria-label="Filter by type"
                  >
                    <option value="all">All types</option>
                    <option value="enemy">Enemies</option>
                    <option value="boss">Bosses</option>
                  </StyledSelect>
                </div>

                <div style={listStyle}>
                  {isLoading && <div style={emptyTextStyle}>Loading…</div>}
                  {!isLoading && filteredEnemies.length === 0 && (
                    <div style={emptyTextStyle}>No enemies found.</div>
                  )}
                  {filteredEnemies.map((enemy) => (
                    <button
                      key={enemy.id}
                      type="button"
                      onClick={() => selectEnemy(enemy)}
                      style={{
                        ...rowStyle,
                        ...(!isNew && enemy.id === selectedId ? rowSelectedStyle : {}),
                      }}
                    >
                      <span style={{ flex: 1, minWidth: 0 }}>
                        <span style={rowNameStyle}>{enemy.name}</span>
                        <span style={rowMetaStyle}>
                          {enemy.type} · {enemy.health} HP · {enemy.exp_gain} XP
                        </span>
                      </span>
                      {enemy.type === "boss" && <span style={bossBadgeStyle}>boss</span>}
                    </button>
                  ))}
                </div>
              </section>

              <section style={panelStyle}>
                <div style={panelHeaderStyle}>
                  <div style={panelHeadingStyle}>{isNew ? "New enemy" : "Edit enemy"}</div>
                  {!isNew && selectedId && (
                    <span style={threatBadgeStyle}>
                      {estimate.label} · threat {estimate.threat}
                    </span>
                  )}
                </div>

                {!isNew && !selectedId ? (
                  <div style={emptyTextStyle}>Select an enemy to edit it.</div>
                ) : (
                  <>
                    <div style={formGridStyle}>
                      <FieldGroup id="enemy-name" label="Name">
                        <StyledInput
                          id="enemy-name"
                          value={draft.name}
                          onChange={(event) =>
                            setDraft((current) => ({ ...current, name: event.target.value }))
                          }
                        />
                      </FieldGroup>
                      <FieldGroup id="enemy-type" label="Type">
                        <StyledSelect
                          id="enemy-type"
                          value={draft.type}
                          onChange={(event) =>
                            setDraft((current) => ({
                              ...current,
                              type: event.target.value as EnemyType,
                            }))
                          }
                        >
                          <option value="enemy">Enemy</option>
                          <option value="boss">Boss</option>
                        </StyledSelect>
                      </FieldGroup>
                      <FieldGroup id="enemy-img" label="Sprite path or URL">
                        <StyledInput
                          id="enemy-img"
                          value={draft.img}
                          placeholder="/images/Mushroom.png"
                          onChange={(event) =>
                            setDraft((current) => ({ ...current, img: event.target.value }))
                          }
                        />
                      </FieldGroup>
                      <FieldGroup id="enemy-health" label="Health">
                        <StyledInput
                          id="enemy-health"
                          type="number"
                          value={draft.health}
                          onChange={(event) =>
                            setDraft((current) => ({
                              ...current,
                              health: Number(event.target.value) || 1,
                            }))
                          }
                        />
                      </FieldGroup>
                      <FieldGroup id="enemy-max-health" label="Max health (blank = health)">
                        <StyledInput
                          id="enemy-max-health"
                          type="number"
                          value={draft.max_health ?? ""}
                          onChange={(event) =>
                            setDraft((current) => ({
                              ...current,
                              max_health:
                                event.target.value.trim() === ""
                                  ? null
                                  : Number(event.target.value) || 0,
                            }))
                          }
                        />
                      </FieldGroup>
                      <FieldGroup id="enemy-exp" label="EXP reward">
                        <StyledInput
                          id="enemy-exp"
                          type="number"
                          value={draft.exp_gain}
                          onChange={(event) =>
                            setDraft((current) => ({
                              ...current,
                              exp_gain: Number(event.target.value) || 0,
                            }))
                          }
                        />
                      </FieldGroup>
                      <FieldGroup id="enemy-strength" label="Strength">
                        <StyledInput
                          id="enemy-strength"
                          type="number"
                          value={draft.strength}
                          onChange={(event) =>
                            setDraft((current) => ({
                              ...current,
                              strength: Number(event.target.value) || 0,
                            }))
                          }
                        />
                      </FieldGroup>
                      <FieldGroup id="enemy-dex" label="Dexterity">
                        <StyledInput
                          id="enemy-dex"
                          type="number"
                          value={draft.dex}
                          onChange={(event) =>
                            setDraft((current) => ({
                              ...current,
                              dex: Number(event.target.value) || 0,
                            }))
                          }
                        />
                      </FieldGroup>
                      <FieldGroup id="enemy-defense" label="Defense">
                        <StyledInput
                          id="enemy-defense"
                          type="number"
                          value={draft.defense}
                          onChange={(event) =>
                            setDraft((current) => ({
                              ...current,
                              defense: Number(event.target.value) || 0,
                            }))
                          }
                        />
                      </FieldGroup>
                    </div>

                    {draft.type === "boss" && (
                      <div style={bossSectionStyle}>
                        <div style={bossHeadingStyle}>Boss configuration</div>
                        <div style={formGridStyle}>
                          <FieldGroup id="enemy-thresholds" label="Phase thresholds (HP %, descending)">
                            <StyledInput
                              id="enemy-thresholds"
                              value={draft.phaseThresholds}
                              placeholder="50, 25"
                              onChange={(event) =>
                                setDraft((current) => ({
                                  ...current,
                                  phaseThresholds: event.target.value,
                                }))
                              }
                            />
                          </FieldGroup>
                        </div>
                        <FieldGroup id="enemy-moves" label="Moves (JSON array)">
                          <textarea
                            id="enemy-moves"
                            value={draft.movesJson}
                            onChange={(event) =>
                              setDraft((current) => ({
                                ...current,
                                movesJson: event.target.value,
                              }))
                            }
                            spellCheck={false}
                            style={jsonStyle}
                          />
                        </FieldGroup>
                        <FieldGroup id="enemy-spawns" label="Spawns (JSON array)">
                          <textarea
                            id="enemy-spawns"
                            value={draft.spawnsJson}
                            onChange={(event) =>
                              setDraft((current) => ({
                                ...current,
                                spawnsJson: event.target.value,
                              }))
                            }
                            spellCheck={false}
                            style={jsonStyle}
                          />
                        </FieldGroup>
                      </div>
                    )}

                    <div style={estimateBoxStyle}>
                      <div style={estimateHeadingStyle}>Balance estimate</div>
                      <div style={estimateGridStyle}>
                        <span>Effective HP: {estimate.effectiveHealth}</span>
                        <span>Avg move damage: {estimate.averageDamage}</span>
                        <span>Threat score: {estimate.threat}</span>
                        <span style={estimateLabelStyle}>{estimate.label}</span>
                      </div>
                    </div>

                    {!isNew && selectedId && (
                      <div style={roomsSectionStyle}>
                        <div style={bossHeadingStyle}>Appears in rooms</div>
                        {rooms.length === 0 ? (
                          <p style={helperTextStyle}>No rooms available.</p>
                        ) : (
                          <div style={roomsGridStyle}>
                            {rooms.map((room) => (
                              <label key={room.id} style={roomCheckboxStyle}>
                                <input
                                  type="checkbox"
                                  checked={linkedRoomIds.includes(room.id)}
                                  onChange={() => void handleToggleRoom(room.id)}
                                />
                                <span>{room.name}</span>
                              </label>
                            ))}
                          </div>
                        )}
                      </div>
                    )}

                    <div style={footerStyle}>
                      {!isNew && (
                        <button
                          type="button"
                          onClick={() => void handleDelete()}
                          disabled={isBusy}
                          style={dangerButtonStyle}
                        >
                          Delete enemy
                        </button>
                      )}
                      <div style={{ flex: 1 }} />
                      <button
                        type="button"
                        onClick={() => void handleSave()}
                        disabled={isBusy}
                        style={primaryButtonStyle}
                      >
                        {isBusy ? "Saving…" : isNew ? "Create enemy" : "Save enemy"}
                      </button>
                    </div>
                  </>
                )}
              </section>
            </div>
          ) : (
            <section style={panelStyle}>
              <div style={panelHeaderStyle}>
                <div>
                  <div style={panelHeadingStyle}>Balance table</div>
                  <div style={helperTextStyle}>
                    Edit stats inline; changes save when you leave a field.
                  </div>
                </div>
              </div>

              <div style={{ overflowX: "auto" }}>
                <table style={tableStyle}>
                  <thead>
                    <tr>
                      {["Name", "Type", "HP", "STR", "DEX", "DEF", "EXP", "Eff. HP", "Threat"].map(
                        (label) => (
                          <th key={label} style={thStyle}>
                            {label}
                          </th>
                        ),
                      )}
                    </tr>
                  </thead>
                  <tbody>
                    {enemies.map((enemy) => {
                      const enemyEstimate = estimateEnemy({
                        id: enemy.id,
                        name: enemy.name,
                        health: enemy.health,
                        maxHealth: enemy.max_health ?? undefined,
                        strength: enemy.strength,
                        dex: enemy.dex,
                        defense: enemy.defense,
                        img: enemy.img,
                        expGain: enemy.exp_gain,
                        type: enemy.type,
                        moves: enemy.moves ?? undefined,
                      });
                      return (
                        <tr key={enemy.id}>
                          <td style={tdNameStyle}>{enemy.name}</td>
                          <td style={tdStyle}>{enemy.type}</td>
                          <td style={tdStyle}>
                            <BalanceCell
                              value={enemy.health}
                              ariaLabel={`${enemy.name} health`}
                              onSave={(health) => void handleInlineUpdate(enemy, { health })}
                            />
                          </td>
                          <td style={tdStyle}>
                            <BalanceCell
                              value={enemy.strength}
                              ariaLabel={`${enemy.name} strength`}
                              onSave={(strength) =>
                                void handleInlineUpdate(enemy, { strength })
                              }
                            />
                          </td>
                          <td style={tdStyle}>
                            <BalanceCell
                              value={enemy.dex}
                              ariaLabel={`${enemy.name} dexterity`}
                              onSave={(dex) => void handleInlineUpdate(enemy, { dex })}
                            />
                          </td>
                          <td style={tdStyle}>
                            <BalanceCell
                              value={enemy.defense}
                              ariaLabel={`${enemy.name} defense`}
                              onSave={(defense) =>
                                void handleInlineUpdate(enemy, { defense })
                              }
                            />
                          </td>
                          <td style={tdStyle}>
                            <BalanceCell
                              value={enemy.exp_gain}
                              ariaLabel={`${enemy.name} exp`}
                              onSave={(exp_gain) =>
                                void handleInlineUpdate(enemy, { exp_gain })
                              }
                            />
                          </td>
                          <td style={tdStyle}>{enemyEstimate.effectiveHealth}</td>
                          <td style={tdStyle}>
                            <span style={{ ...estimateLabelStyle, textTransform: "capitalize" }}>
                              {enemyEstimate.label} · {enemyEstimate.threat}
                            </span>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </section>
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
const pageInnerStyle: CSSProperties = { maxWidth: 1250, margin: "0 auto" };
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
const listStyle: CSSProperties = {
  display: "flex",
  flexDirection: "column",
  gap: 4,
  maxHeight: "58vh",
  overflowY: "auto",
};
const rowStyle: CSSProperties = {
  display: "flex",
  alignItems: "center",
  gap: 8,
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
const rowSelectedStyle: CSSProperties = {
  background: "rgba(212,175,55,0.1)",
  borderColor: colors.goldBorder,
};
const rowNameStyle: CSSProperties = {
  display: "block",
  fontSize: 13,
  color: colors.text,
  fontFamily: fonts.display,
  letterSpacing: "0.02em",
};
const rowMetaStyle: CSSProperties = {
  display: "block",
  fontSize: 10,
  color: "#6B7280",
  textTransform: "capitalize",
};
const bossBadgeStyle: CSSProperties = {
  padding: "1px 5px",
  background: "rgba(220,38,38,0.1)",
  border: "1px solid rgba(220,38,38,0.25)",
  borderRadius: 3,
  color: "#FCA5A5",
  fontSize: 8,
  textTransform: "uppercase",
  letterSpacing: "0.06em",
};
const threatBadgeStyle: CSSProperties = {
  padding: "3px 9px",
  background: "rgba(212,175,55,0.08)",
  border: `1px solid ${colors.goldBorder}`,
  borderRadius: 20,
  color: colors.goldMuted,
  fontSize: 10,
  fontFamily: fonts.display,
  textTransform: "capitalize",
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
const emptyTextStyle: CSSProperties = {
  padding: "18px 8px",
  textAlign: "center",
  color: colors.muted,
  fontSize: 12,
  lineHeight: 1.6,
};
const formGridStyle: CSSProperties = {
  display: "grid",
  gridTemplateColumns: "repeat(auto-fit, minmax(170px, 1fr))",
  gap: "0 14px",
};
const bossSectionStyle: CSSProperties = {
  marginTop: 8,
  padding: 14,
  background: "rgba(139,92,246,0.05)",
  border: "1px solid rgba(139,92,246,0.2)",
  borderRadius: 8,
};
const bossHeadingStyle: CSSProperties = {
  fontSize: 11,
  fontWeight: 700,
  letterSpacing: "0.1em",
  textTransform: "uppercase",
  color: "#C4B5FD",
  fontFamily: fonts.display,
  marginBottom: 12,
};
const jsonStyle: CSSProperties = {
  width: "100%",
  minHeight: 120,
  padding: 10,
  background: "rgba(0,0,0,0.4)",
  border: "1px solid rgba(139,92,246,0.25)",
  borderRadius: 6,
  color: "#E8DCC8",
  fontSize: 11,
  fontFamily: "monospace",
  resize: "vertical",
  boxSizing: "border-box",
  outline: "none",
};
const estimateBoxStyle: CSSProperties = {
  padding: 14,
  background: "rgba(255,255,255,0.025)",
  border: `1px solid ${colors.subtleBorder}`,
  borderRadius: 8,
  marginBottom: 16,
};
const estimateHeadingStyle: CSSProperties = {
  fontSize: 9,
  fontWeight: 700,
  letterSpacing: "0.12em",
  textTransform: "uppercase",
  color: colors.goldMuted,
  fontFamily: fonts.display,
  marginBottom: 8,
};
const estimateGridStyle: CSSProperties = {
  display: "flex",
  gap: 16,
  flexWrap: "wrap",
  fontSize: 12,
  color: colors.muted,
};
const estimateLabelStyle: CSSProperties = {
  color: colors.gold,
  fontWeight: 700,
  textTransform: "capitalize",
};
const roomsSectionStyle: CSSProperties = {
  marginTop: 8,
  paddingTop: 14,
  borderTop: `1px solid ${colors.subtleBorder}`,
};
const roomsGridStyle: CSSProperties = {
  display: "grid",
  gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))",
  gap: 6,
  maxHeight: 180,
  overflowY: "auto",
};
const roomCheckboxStyle: CSSProperties = {
  display: "flex",
  alignItems: "center",
  gap: 7,
  fontSize: 12,
  color: colors.textMuted,
  cursor: "pointer",
};
const helperTextStyle: CSSProperties = { margin: 0, fontSize: 11, color: colors.muted };
const footerStyle: CSSProperties = { display: "flex", gap: 8, alignItems: "center", marginTop: 16 };
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
const tableStyle: CSSProperties = {
  width: "100%",
  borderCollapse: "collapse",
  fontSize: 12,
};
const thStyle: CSSProperties = {
  padding: "8px 7px",
  textAlign: "left",
  fontSize: 9,
  letterSpacing: "0.08em",
  textTransform: "uppercase",
  color: colors.goldMuted,
  borderBottom: `1px solid ${colors.goldBorder}`,
  fontFamily: fonts.display,
  whiteSpace: "nowrap",
};
const tdStyle: CSSProperties = {
  padding: "5px 7px",
  borderBottom: `1px solid ${colors.subtleBorder}`,
  color: colors.textMuted,
  whiteSpace: "nowrap",
};
const tdNameStyle: CSSProperties = {
  ...tdStyle,
  color: colors.text,
  fontFamily: fonts.display,
  letterSpacing: "0.02em",
};
const balanceInputStyle: CSSProperties = {
  width: 62,
  padding: "4px 6px",
  background: "rgba(0,0,0,0.35)",
  border: `1px solid ${colors.goldBorder}`,
  borderRadius: 4,
  color: colors.text,
  fontSize: 11,
  textAlign: "right",
  fontFamily: fonts.body,
  outline: "none",
};
