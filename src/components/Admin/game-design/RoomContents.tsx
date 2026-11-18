import { useEffect, useMemo, useState } from "react";
import { colors, fonts } from "@/theme";
import { getAdminEnemies } from "@/queries/AdminEnemyQueries";
import { getAllItems } from "@/queries/ItemQueries";
import {
  saveRoomInteraction,
  setRoomEnemies,
  type RoomInteractionWrite,
} from "@/queries/AdminQueries";
import { FieldGroup, StyledInput, StyledSelect } from "./create-room/primitives";
import { AdminImageField } from "@/components/Admin/ui/AdminImageField";
import type { Room } from "@/types/Room";
import type { RoomInteraction } from "@/types/RoomInteractions";
import type { AdminEnemyRow } from "@/queries/AdminEnemyQueries";
import type { DbItem } from "@/queries/RoomQueries";
import type { CSSProperties } from "react";

type InteractionKind = "none" | "Combat" | "NPC" | "chest" | "camp" | "transition" | "cutscene";

interface InteractionDraft {
  type: InteractionKind;
  npcName: string;
  npcDialogue: string;
  npcDiscovery: string;
  npcImg: string;
  chestItemId: string;
  chestQuantity: number;
  chestLocked: boolean;
  chestDiscovery: string;
  campHeal: number;
  campMana: boolean;
  campCost: string;
  campDiscovery: string;
  transitionDestination: "next_dungeon" | "sanctuary";
  transitionDiscovery: string;
  cutsceneId: string;
  cutsceneDiscovery: string;
}

const errorMessage = (err: unknown) =>
  err instanceof Error ? err.message : "Something went wrong.";

const blankDraft = (): InteractionDraft => ({
  type: "none",
  npcName: "",
  npcDialogue: "",
  npcDiscovery: "",
  npcImg: "",
  chestItemId: "",
  chestQuantity: 1,
  chestLocked: false,
  chestDiscovery: "",
  campHeal: 50,
  campMana: true,
  campCost: "",
  campDiscovery: "",
  transitionDestination: "next_dungeon",
  transitionDiscovery: "",
  cutsceneId: "intro",
  cutsceneDiscovery: "",
});

function draftFromInteraction(
  interaction: RoomInteraction | null,
  hasEnemies = false,
): InteractionDraft {
  const draft = blankDraft();
  if (!interaction) {
    return {
      ...draft,
      // Rooms without an interaction and with enemies are combat rooms.
      type: hasEnemies ? "Combat" : "none",
    };
  }

  switch (interaction.type) {
    case "NPC":
      return {
        ...draft,
        type: "NPC",
        npcName: interaction.npc.name,
        npcDialogue: interaction.npc.dialogue.join("\n"),
        npcDiscovery: interaction.npc.discoveryMessage ?? "",
        npcImg: interaction.npc.img,
      };
    case "chest":
      return {
        ...draft,
        type: "chest",
        chestItemId: interaction.chest.itemId,
        chestQuantity: interaction.chest.quantity,
        chestLocked: interaction.chest.isLocked,
        chestDiscovery: interaction.chest.discoveryMessage ?? "",
      };
    case "camp":
      return {
        ...draft,
        type: "camp",
        campHeal: interaction.camp.healAmount,
        campMana: interaction.camp.restoresMana,
        campCost: interaction.camp.cost === undefined ? "" : String(interaction.camp.cost),
        campDiscovery: interaction.camp.discoveryMessage ?? "",
      };
    case "transition":
      return {
        ...draft,
        type: "transition",
        transitionDestination: interaction.transition.destination,
        transitionDiscovery: interaction.transition.discoveryMessage ?? "",
      };
    case "cutscene":
      return {
        ...draft,
        type: "cutscene",
        cutsceneId: interaction.cutscene.cutsceneId,
        cutsceneDiscovery: interaction.cutscene.discoveryMessage ?? "",
      };
  }
}

const uniqueSorted = (ids: number[]) => [...new Set(ids)].sort((a, b) => a - b);

interface RoomContentsProps {
  room: Room;
  onRefresh: () => Promise<void>;
  showToast: (type: "success" | "error", message: string) => void;
}

export function RoomContents({ room, onRefresh, showToast }: RoomContentsProps) {
  const [enemies, setEnemies] = useState<AdminEnemyRow[]>([]);
  const [items, setItems] = useState<DbItem[]>([]);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [selectedEnemyIds, setSelectedEnemyIds] = useState<number[]>(() =>
    room.enemies.map((enemy) => enemy.id),
  );
  const [draft, setDraft] = useState<InteractionDraft>(() =>
    draftFromInteraction(room.interaction, room.enemies.length > 0),
  );
  const [isSavingEnemies, setIsSavingEnemies] = useState(false);
  const [isSavingInteraction, setIsSavingInteraction] = useState(false);

  useEffect(() => {
    let cancelled = false;
    void (async () => {
      try {
        const [enemyRows, itemRows] = await Promise.all([getAdminEnemies(), getAllItems()]);
        if (cancelled) return;
        setEnemies(enemyRows);
        setItems(itemRows);
      } catch (err) {
        if (!cancelled) setLoadError(errorMessage(err));
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    setSelectedEnemyIds(room.enemies.map((enemy) => enemy.id));
    setDraft(draftFromInteraction(room.interaction, room.enemies.length > 0));
  }, [room]);

  const isCombat = draft.type === "Combat";

  const enemiesChanged = useMemo(
    () =>
      uniqueSorted(selectedEnemyIds).join(",") !==
      uniqueSorted(room.enemies.map((enemy) => enemy.id)).join(","),
    [selectedEnemyIds, room.enemies],
  );

  const itemOptions = useMemo(
    () => items.map((item) => ({ id: item.id, name: item.name })),
    [items],
  );

  function toggleEnemy(enemyId: number) {
    setSelectedEnemyIds((current) =>
      current.includes(enemyId) ? current.filter((id) => id !== enemyId) : [...current, enemyId],
    );
  }

  async function handleSaveEnemies() {
    setIsSavingEnemies(true);
    try {
      await setRoomEnemies(room.id, selectedEnemyIds);
      // A combat room cannot also carry an interaction, otherwise the runtime
      // would start combat and never show the interaction.
      if (room.interaction) {
        await saveRoomInteraction(room.id, { type: "none" });
      }
      await onRefresh();
      showToast("success", "Combat room saved.");
    } catch (err) {
      showToast("error", errorMessage(err));
    } finally {
      setIsSavingEnemies(false);
    }
  }

  async function handleSaveInteraction() {
    if (isCombat) {
      await handleSaveEnemies();
      return;
    }

    let write: RoomInteractionWrite;

    if (draft.type === "NPC") {
      if (!draft.npcName.trim()) {
        showToast("error", "NPC name is required.");
        return;
      }
      write = {
        type: "NPC",
        name: draft.npcName.trim(),
        dialogue: draft.npcDialogue
          .split("\n")
          .map((line) => line.trim())
          .filter(Boolean),
        discoveryMessage: draft.npcDiscovery.trim() || null,
        img: draft.npcImg.trim(),
      };
    } else if (draft.type === "chest") {
      if (!draft.chestItemId) {
        showToast("error", "Pick an item for the chest.");
        return;
      }
      write = {
        type: "chest",
        itemId: draft.chestItemId,
        quantity: Math.max(1, draft.chestQuantity),
        isLocked: draft.chestLocked,
        discoveryMessage: draft.chestDiscovery.trim() || null,
      };
    } else if (draft.type === "camp") {
      write = {
        type: "camp",
        healAmount: Math.max(0, draft.campHeal),
        restoresMana: draft.campMana,
        cost: draft.campCost.trim() === "" ? null : Math.max(0, Number(draft.campCost)),
        discoveryMessage: draft.campDiscovery.trim() || null,
      };
    } else if (draft.type === "transition") {
      write = {
        type: "transition",
        destination: draft.transitionDestination,
        discoveryMessage: draft.transitionDiscovery.trim() || null,
      };
    } else if (draft.type === "cutscene") {
      if (!draft.cutsceneId.trim()) {
        showToast("error", "Cutscene id is required.");
        return;
      }
      write = {
        type: "cutscene",
        cutsceneId: draft.cutsceneId.trim(),
        discoveryMessage: draft.cutsceneDiscovery.trim() || null,
      };
    } else {
      write = { type: "none" };
    }

    setIsSavingInteraction(true);
    try {
      await saveRoomInteraction(room.id, write);
      // Leaving combat mode removes the encounter roster so the room does not
      // immediately re-enter combat on entry.
      if (room.enemies.length > 0) {
        await setRoomEnemies(room.id, []);
      }
      await onRefresh();
      showToast("success", draft.type === "none" ? "Interaction removed." : "Interaction saved.");
    } catch (err) {
      showToast("error", errorMessage(err));
    } finally {
      setIsSavingInteraction(false);
    }
  }

  return (
    <>
      <div style={panelStyle}>
        <div style={panelHeadingStyle}>Room type</div>
        <p style={helperTextStyle}>
          A room is either a combat encounter or an interaction, not both. Switching type clears the
          other side when you save.
        </p>

        <FieldGroup id="roomInteractionType" label="Interaction type">
          <StyledSelect
            id="roomInteractionType"
            value={draft.type}
            onChange={(event) =>
              setDraft((current) => ({
                ...current,
                type: event.target.value as InteractionKind,
              }))
            }
          >
            <option value="Combat">Combat (enemies)</option>
            <option value="none">None</option>
            <option value="NPC">NPC</option>
            <option value="chest">Chest</option>
            <option value="camp">Camp</option>
            <option value="transition">Transition</option>
            <option value="cutscene">Cutscene</option>
          </StyledSelect>
        </FieldGroup>
      </div>

      {isCombat ? (
        <div style={panelStyle}>
          <div style={panelHeadingStyle}>Enemies</div>
          <p style={helperTextStyle}>
            Attach reusable enemies from the library. Only combat rooms show this roster.
          </p>

          {loadError && <div style={errorStyle}>{loadError}</div>}

          {enemies.length === 0 ? (
            <div style={emptyStyle}>
              No enemies in the library yet. Create one on the Enemies page.
            </div>
          ) : (
            <div style={enemyGridStyle}>
              {enemies.map((enemy) => (
                <label key={enemy.id} style={checkboxStyle}>
                  <input
                    type="checkbox"
                    checked={selectedEnemyIds.includes(enemy.id)}
                    onChange={() => toggleEnemy(enemy.id)}
                  />
                  <span style={checkboxTextStyle}>
                    {enemy.name}
                    <span style={checkboxMetaStyle}>
                      {enemy.type} · {enemy.health} HP
                    </span>
                  </span>
                </label>
              ))}
            </div>
          )}

          {selectedEnemyIds.length === 0 && (
            <p style={helperTextStyle}>
              No enemies selected. Saving now leaves this as an empty room.
            </p>
          )}

          <div style={formActionsStyle}>
            <button
              type="button"
              onClick={() => void handleSaveEnemies()}
              disabled={isSavingEnemies || (!enemiesChanged && !room.interaction)}
              style={{
                ...primaryButtonStyle,
                opacity: isSavingEnemies || (!enemiesChanged && !room.interaction) ? 0.5 : 1,
                cursor:
                  isSavingEnemies || (!enemiesChanged && !room.interaction)
                    ? "not-allowed"
                    : "pointer",
              }}
            >
              {isSavingEnemies ? "Saving…" : "Save combat room"}
            </button>
          </div>
        </div>
      ) : (
        <div style={panelStyle}>
          <div style={panelHeadingStyle}>Interaction</div>
          <p style={helperTextStyle}>
            Choose what the party finds here. Saving replaces the current interaction.
          </p>

          {draft.type === "NPC" && (
            <>
              <FieldGroup id="roomNpcName" label="NPC name">
                <StyledInput
                  id="roomNpcName"
                  value={draft.npcName}
                  onChange={(event) =>
                    setDraft((current) => ({ ...current, npcName: event.target.value }))
                  }
                />
              </FieldGroup>
              <FieldGroup id="roomNpcDialogue" label="Opening dialogue (one line per entry)">
                <textarea
                  id="roomNpcDialogue"
                  value={draft.npcDialogue}
                  rows={4}
                  onChange={(event) =>
                    setDraft((current) => ({ ...current, npcDialogue: event.target.value }))
                  }
                  style={textareaStyle}
                />
              </FieldGroup>
              <FieldGroup id="roomNpcDiscovery" label="Discovery message">
                <StyledInput
                  id="roomNpcDiscovery"
                  value={draft.npcDiscovery}
                  onChange={(event) =>
                    setDraft((current) => ({ ...current, npcDiscovery: event.target.value }))
                  }
                />
              </FieldGroup>
              <AdminImageField
                id="roomNpcImg"
                label="Portrait"
                category="npc"
                value={draft.npcImg}
                placeholder="/images/characters/npc/Merchant.png"
                hint="Stored on the NPC and shown when the party meets them."
                onChange={(npcImg) => setDraft((current) => ({ ...current, npcImg }))}
              />
            </>
          )}

          {draft.type === "chest" && (
            <>
              <FieldGroup id="roomChestItem" label="Item">
                <StyledSelect
                  id="roomChestItem"
                  value={draft.chestItemId}
                  onChange={(event) =>
                    setDraft((current) => ({ ...current, chestItemId: event.target.value }))
                  }
                >
                  <option value="">Select an item…</option>
                  {itemOptions.map((item) => (
                    <option key={item.id} value={item.id}>
                      {item.name}
                    </option>
                  ))}
                  {draft.chestItemId &&
                    !itemOptions.some((item) => item.id === draft.chestItemId) && (
                      <option value={draft.chestItemId}>{draft.chestItemId}</option>
                    )}
                </StyledSelect>
              </FieldGroup>
              <div style={twoColumnStyle}>
                <FieldGroup id="roomChestQuantity" label="Quantity">
                  <StyledInput
                    id="roomChestQuantity"
                    type="number"
                    value={draft.chestQuantity}
                    onChange={(event) =>
                      setDraft((current) => ({
                        ...current,
                        chestQuantity: Number(event.target.value) || 1,
                      }))
                    }
                  />
                </FieldGroup>
                <div>
                  <label style={labelStyle} htmlFor="roomChestLocked">
                    Lock state
                  </label>
                  <label style={checkboxStyle} htmlFor="roomChestLocked">
                    <input
                      id="roomChestLocked"
                      type="checkbox"
                      checked={draft.chestLocked}
                      onChange={(event) =>
                        setDraft((current) => ({
                          ...current,
                          chestLocked: event.target.checked,
                        }))
                      }
                    />
                    <span style={checkboxTextStyle}>Locked</span>
                  </label>
                </div>
              </div>
              <FieldGroup id="roomChestDiscovery" label="Discovery message">
                <StyledInput
                  id="roomChestDiscovery"
                  value={draft.chestDiscovery}
                  onChange={(event) =>
                    setDraft((current) => ({ ...current, chestDiscovery: event.target.value }))
                  }
                />
              </FieldGroup>
            </>
          )}

          {draft.type === "camp" && (
            <>
              <div style={twoColumnStyle}>
                <FieldGroup id="roomCampHeal" label="Heal amount">
                  <StyledInput
                    id="roomCampHeal"
                    type="number"
                    value={draft.campHeal}
                    onChange={(event) =>
                      setDraft((current) => ({
                        ...current,
                        campHeal: Number(event.target.value) || 0,
                      }))
                    }
                  />
                </FieldGroup>
                <FieldGroup id="roomCampCost" label="Cost (blank = free)">
                  <StyledInput
                    id="roomCampCost"
                    type="number"
                    value={draft.campCost}
                    onChange={(event) =>
                      setDraft((current) => ({ ...current, campCost: event.target.value }))
                    }
                  />
                </FieldGroup>
              </div>
              <label style={checkboxStyle}>
                <input
                  type="checkbox"
                  checked={draft.campMana}
                  onChange={(event) =>
                    setDraft((current) => ({ ...current, campMana: event.target.checked }))
                  }
                />
                <span style={checkboxTextStyle}>Also restores mana</span>
              </label>
              <FieldGroup id="roomCampDiscovery" label="Discovery message">
                <StyledInput
                  id="roomCampDiscovery"
                  value={draft.campDiscovery}
                  onChange={(event) =>
                    setDraft((current) => ({ ...current, campDiscovery: event.target.value }))
                  }
                />
              </FieldGroup>
            </>
          )}

          {draft.type === "transition" && (
            <>
              <FieldGroup id="roomTransitionDestination" label="Destination">
                <StyledSelect
                  id="roomTransitionDestination"
                  value={draft.transitionDestination}
                  onChange={(event) =>
                    setDraft((current) => ({
                      ...current,
                      transitionDestination: event.target.value as "next_dungeon" | "sanctuary",
                    }))
                  }
                >
                  <option value="next_dungeon">Next dungeon</option>
                  <option value="sanctuary">Sanctuary</option>
                </StyledSelect>
              </FieldGroup>
              <FieldGroup id="roomTransitionDiscovery" label="Discovery message">
                <StyledInput
                  id="roomTransitionDiscovery"
                  value={draft.transitionDiscovery}
                  onChange={(event) =>
                    setDraft((current) => ({
                      ...current,
                      transitionDiscovery: event.target.value,
                    }))
                  }
                />
              </FieldGroup>
            </>
          )}

          {draft.type === "cutscene" && (
            <>
              <FieldGroup id="roomCutsceneId" label="Cutscene id">
                <StyledInput
                  id="roomCutsceneId"
                  value={draft.cutsceneId}
                  onChange={(event) =>
                    setDraft((current) => ({ ...current, cutsceneId: event.target.value }))
                  }
                />
              </FieldGroup>
              <FieldGroup id="roomCutsceneDiscovery" label="Discovery message">
                <StyledInput
                  id="roomCutsceneDiscovery"
                  value={draft.cutsceneDiscovery}
                  onChange={(event) =>
                    setDraft((current) => ({
                      ...current,
                      cutsceneDiscovery: event.target.value,
                    }))
                  }
                />
              </FieldGroup>
            </>
          )}

          <div style={formActionsStyle}>
            <button
              type="button"
              onClick={() => void handleSaveInteraction()}
              disabled={isSavingInteraction}
              style={{
                ...primaryButtonStyle,
                opacity: isSavingInteraction ? 0.5 : 1,
                cursor: isSavingInteraction ? "not-allowed" : "pointer",
              }}
            >
              {isSavingInteraction
                ? "Saving…"
                : draft.type === "none"
                  ? "Clear interaction"
                  : "Save interaction"}
            </button>
          </div>
        </div>
      )}
    </>
  );
}

const panelStyle: CSSProperties = {
  background: "rgba(255,255,255,0.025)",
  border: `1px solid ${colors.goldBorder}`,
  borderRadius: 10,
  padding: 20,
};
const panelHeadingStyle: CSSProperties = {
  fontSize: 12,
  fontWeight: 700,
  letterSpacing: "0.1em",
  textTransform: "uppercase",
  color: colors.gold,
  fontFamily: fonts.display,
  marginBottom: 14,
};
const helperTextStyle: CSSProperties = {
  margin: "0 0 14px",
  fontSize: 12,
  lineHeight: 1.5,
  color: colors.muted,
};
const errorStyle: CSSProperties = {
  padding: "8px 10px",
  marginBottom: 12,
  background: "rgba(220,38,38,0.08)",
  border: "1px solid rgba(220,38,38,0.25)",
  borderRadius: 6,
  color: "#FCA5A5",
  fontSize: 12,
};
const emptyStyle: CSSProperties = {
  padding: "18px 12px",
  textAlign: "center",
  color: colors.muted,
  fontSize: 12,
  border: `1px dashed ${colors.subtleBorder}`,
  borderRadius: 7,
};
const enemyGridStyle: CSSProperties = {
  display: "grid",
  gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))",
  gap: 6,
  maxHeight: 200,
  overflowY: "auto",
};
const checkboxStyle: CSSProperties = {
  display: "flex",
  alignItems: "center",
  gap: 8,
  fontSize: 12,
  color: colors.textMuted,
  cursor: "pointer",
};
const checkboxTextStyle: CSSProperties = {
  display: "flex",
  flexDirection: "column",
  gap: 1,
  color: colors.text,
};
const checkboxMetaStyle: CSSProperties = {
  fontSize: 10,
  color: colors.muted,
  textTransform: "capitalize",
};
const formActionsStyle: CSSProperties = {
  display: "flex",
  justifyContent: "flex-end",
  marginTop: 16,
};
const primaryButtonStyle: CSSProperties = {
  padding: "9px 18px",
  background: "rgba(212,175,55,0.16)",
  border: `1px solid ${colors.goldBorder}`,
  borderRadius: 6,
  color: colors.gold,
  fontSize: 12,
  fontWeight: 700,
  fontFamily: fonts.display,
  letterSpacing: "0.05em",
};
const textareaStyle: CSSProperties = {
  width: "100%",
  boxSizing: "border-box",
  padding: "10px 12px",
  background: "rgba(0,0,0,0.4)",
  border: `1px solid ${colors.goldBorder}`,
  borderRadius: 6,
  color: colors.text,
  fontSize: 13,
  lineHeight: 1.5,
  fontFamily: fonts.body,
  resize: "vertical",
  outline: "none",
};
const twoColumnStyle: CSSProperties = {
  display: "grid",
  gridTemplateColumns: "1fr 1fr",
  gap: 14,
};
const labelStyle: CSSProperties = {
  display: "block",
  fontSize: 11,
  fontWeight: 600,
  letterSpacing: "0.08em",
  textTransform: "uppercase",
  color: colors.muted,
  marginBottom: 8,
  fontFamily: fonts.display,
};
