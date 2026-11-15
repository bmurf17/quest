import { colors, fonts } from "@/theme";
import type { Enemy } from "@/types/Enemy";
import type { EnemyMove, EnemyMoveEffect } from "@/types/EnemyMove";
import type { EnemyRewardItem } from "@/types/Enemy";
import type { Item } from "@/types/Item";
import { FieldGroup, StyledInput, StyledSelect } from "./create-room/primitives";
import type { CSSProperties } from "react";

const EFFECT_TYPES: EnemyMoveEffect["type"][] = [
  "damage",
  "heal",
  "buff",
  "debuff",
  "spawn",
];

const defaultBossMove = (): EnemyMove => ({
  name: "Attack",
  description: "",
  cooldown: 0,
  weight: 10,
  effect: {
    type: "damage",
    target: "single",
    damageDice: { numDice: 1, dieSize: 6, bonus: 0 },
  },
});

function defaultEffect(type: EnemyMoveEffect["type"]): EnemyMoveEffect {
  switch (type) {
    case "heal":
      return { type, target: "self", healDice: { numDice: 1, dieSize: 8, bonus: 0 } };
    case "buff":
      return { type, stat: "strength", amount: 2, duration: 2, target: "self" };
    case "debuff":
      return { type, stat: "defense", amount: 2, duration: 2, target: "single" };
    case "spawn":
      return { type, spawnIndex: 0, count: 1 };
    default:
      return {
        type: "damage",
        target: "single",
        damageDice: { numDice: 1, dieSize: 6, bonus: 0 },
      };
  }
}

const effectSummary = (move: EnemyMove): string => {
  const effect = move.effect;
  switch (effect.type) {
    case "damage":
      return effect.damageDice
        ? `${effect.damageDice.numDice}d${effect.damageDice.dieSize}${
            effect.damageDice.bonus >= 0 ? "+" : ""
          }${effect.damageDice.bonus} damage`
        : `strength-based damage`;
    case "heal":
      return effect.healDice
        ? `heals ${effect.healDice.numDice}d${effect.healDice.dieSize}`
        : "heals";
    case "buff":
      return `+${effect.amount} ${effect.stat} for ${effect.duration}t`;
    case "debuff":
      return `-${effect.amount} ${effect.stat} for ${effect.duration}t`;
    case "spawn":
      return `spawns ${effect.count} (index ${effect.spawnIndex})`;
    default:
      return "no effect";
  }
};

interface BossEditorProps {
  thresholds: string;
  onThresholdsChange: (value: string) => void;
  moves: EnemyMove[];
  onMovesChange: (moves: EnemyMove[]) => void;
  spawns: Enemy[];
  spawnLibrary: Enemy[];
  onSpawnsChange: (spawns: Enemy[]) => void;
  goldReward: number;
  onGoldRewardChange: (value: number) => void;
  rewardItems: EnemyRewardItem[];
  itemLibrary: Item[];
  onRewardItemsChange: (items: EnemyRewardItem[]) => void;
}

export function BossEditor({
  thresholds,
  onThresholdsChange,
  moves,
  onMovesChange,
  spawns,
  spawnLibrary,
  onSpawnsChange,
  goldReward,
  onGoldRewardChange,
  rewardItems,
  itemLibrary,
  onRewardItemsChange,
}: BossEditorProps) {
  const updateMove = (index: number, patch: Partial<EnemyMove>) => {
    onMovesChange(moves.map((move, i) => (i === index ? { ...move, ...patch } : move)));
  };

  const updateEffect = (index: number, patch: Partial<EnemyMoveEffect>) => {
    const move = moves[index];
    updateMove(index, { effect: { ...move.effect, ...patch } as EnemyMoveEffect });
  };

  const availableRewardItems = itemLibrary.filter(
    (item) => !rewardItems.some((reward) => reward.item.name === item.name),
  );

  return (
    <div style={sectionStyle}>
      <div style={headingStyle}>Boss configuration</div>

      <div style={formGridStyle}>
        <FieldGroup id="enemy-thresholds" label="Phase thresholds (HP %, descending)">
          <StyledInput
            id="enemy-thresholds"
            value={thresholds}
            placeholder="50, 25"
            onChange={(event) => onThresholdsChange(event.target.value)}
          />
        </FieldGroup>
      </div>
      <p style={hintStyle}>
        Each threshold adds a phase. Moves tagged with a phase only run in that phase; leave the
        phase blank for every phase.
      </p>

      <div style={subheadingRowStyle}>
        <div style={subheadingStyle}>Moves ({moves.length})</div>
        <button
          type="button"
          onClick={() => onMovesChange([...moves, defaultBossMove()])}
          style={addButtonStyle}
        >
          + Add move
        </button>
      </div>

      {moves.length === 0 ? (
        <p style={hintStyle}>No moves yet. The boss will fall back to a basic attack.</p>
      ) : (
        <div style={listStyle}>
          {moves.map((move, index) => (
            <div key={index} style={moveCardStyle}>
              <div style={moveHeaderStyle}>
                <span style={moveIndexStyle}>Move {index + 1}</span>
                <span style={moveSummaryStyle}>{effectSummary(move)}</span>
                <button
                  type="button"
                  onClick={() => onMovesChange(moves.filter((_, i) => i !== index))}
                  style={dangerSmallStyle}
                >
                  Remove
                </button>
              </div>

              <div style={formGridStyle}>
                <FieldGroup id={`move-name-${index}`} label="Name">
                  <StyledInput
                    id={`move-name-${index}`}
                    value={move.name}
                    onChange={(event) => updateMove(index, { name: event.target.value })}
                  />
                </FieldGroup>
                <FieldGroup id={`move-cooldown-${index}`} label="Cooldown (turns)">
                  <StyledInput
                    id={`move-cooldown-${index}`}
                    type="number"
                    value={move.cooldown}
                    onChange={(event) =>
                      updateMove(index, { cooldown: Math.max(0, Number(event.target.value) || 0) })
                    }
                  />
                </FieldGroup>
                <FieldGroup id={`move-weight-${index}`} label="Weight">
                  <StyledInput
                    id={`move-weight-${index}`}
                    type="number"
                    value={move.weight}
                    onChange={(event) =>
                      updateMove(index, { weight: Math.max(0, Number(event.target.value) || 0) })
                    }
                  />
                </FieldGroup>
                <FieldGroup id={`move-phase-${index}`} label="Phase (blank = all)">
                  <StyledInput
                    id={`move-phase-${index}`}
                    type="number"
                    value={move.phase ?? ""}
                    placeholder="all"
                    onChange={(event) =>
                      updateMove(index, {
                        phase:
                          event.target.value.trim() === ""
                            ? undefined
                            : Math.max(1, Number(event.target.value) || 1),
                      })
                    }
                  />
                </FieldGroup>
              </div>

              <FieldGroup id={`move-description-${index}`} label="Description">
                <StyledInput
                  id={`move-description-${index}`}
                  value={move.description}
                  onChange={(event) => updateMove(index, { description: event.target.value })}
                />
              </FieldGroup>

              <div style={formGridStyle}>
                <FieldGroup id={`move-effect-${index}`} label="Effect">
                  <StyledSelect
                    id={`move-effect-${index}`}
                    value={move.effect.type}
                    onChange={(event) =>
                      updateMove(index, {
                        effect: defaultEffect(event.target.value as EnemyMoveEffect["type"]),
                      })
                    }
                  >
                    {EFFECT_TYPES.map((type) => (
                      <option key={type} value={type}>
                        {type}
                      </option>
                    ))}
                  </StyledSelect>
                </FieldGroup>

                <EffectFields
                  index={index}
                  effect={move.effect}
                  onChange={(patch) => updateEffect(index, patch)}
                />
              </div>
            </div>
          ))}
        </div>
      )}

      <div style={subheadingRowStyle}>
        <div style={subheadingStyle}>Spawns ({spawns.length})</div>
        <StyledSelect
          aria-label="Add spawn from library"
          defaultValue=""
          onChange={(event) => {
            const picked = spawnLibrary.find((enemy) => String(enemy.id) === event.target.value);
            if (picked) onSpawnsChange([...spawns, { ...picked, phase: undefined }]);
            event.target.value = "";
          }}
          style={{ maxWidth: 240 }}
        >
          <option value="">Add from library…</option>
          {spawnLibrary.map((enemy) => (
            <option key={enemy.id} value={enemy.id}>
              {enemy.name} · {enemy.health} HP
            </option>
          ))}
        </StyledSelect>
      </div>

      {spawns.length === 0 ? (
        <p style={hintStyle}>
          No spawns. Add library enemies here, then use a spawn move to summon them.
        </p>
      ) : (
        <div style={listStyle}>
          {spawns.map((spawn, index) => (
            <div key={`${spawn.id}-${index}`} style={spawnRowStyle}>
              <span style={spawnIndexStyle}>#{index}</span>
              <span style={spawnNameStyle}>{spawn.name}</span>
              <span style={spawnMetaStyle}>
                {spawn.health} HP · {spawn.strength} STR · {spawn.defense} DEF
              </span>
              <button
                type="button"
                onClick={() => onSpawnsChange(spawns.filter((_, i) => i !== index))}
                style={dangerSmallStyle}
              >
                Remove
              </button>
            </div>
          ))}
        </div>
      )}

      <div style={rewardsStyle}>
        <div style={subheadingStyle}>Rewards on defeat</div>
        <p style={hintStyle}>
          Gold and items are granted once, when this enemy is defeated.
        </p>
        <div style={formGridStyle}>
          <FieldGroup id="enemy-gold-reward" label="Gold reward">
            <StyledInput
              id="enemy-gold-reward"
              type="number"
              value={goldReward}
              onChange={(event) =>
                onGoldRewardChange(Math.max(0, Number(event.target.value) || 0))
              }
            />
          </FieldGroup>
          <FieldGroup id="enemy-reward-item" label="Add reward item">
            <StyledSelect
              id="enemy-reward-item"
              value=""
              onChange={(event) => {
                const picked = availableRewardItems.find(
                  (item) => item.name === event.target.value,
                );
                if (picked) onRewardItemsChange([...rewardItems, { item: picked, quantity: 1 }]);
                event.target.value = "";
              }}
            >
              <option value="">Choose an item…</option>
              {availableRewardItems.map((item) => (
                <option key={item.name} value={item.name}>
                  {item.name}
                </option>
              ))}
            </StyledSelect>
          </FieldGroup>
        </div>

        {rewardItems.length > 0 && (
          <div style={listStyle}>
            {rewardItems.map((reward, index) => (
              <div key={reward.item.name} style={spawnRowStyle}>
                <span style={spawnNameStyle}>{reward.item.name}</span>
                <span style={spawnMetaStyle}>×</span>
                <input
                  type="number"
                  min={1}
                  value={reward.quantity}
                  aria-label={`Quantity for ${reward.item.name}`}
                  onChange={(event) =>
                    onRewardItemsChange(
                      rewardItems.map((entry, i) =>
                        i === index
                          ? { ...entry, quantity: Math.max(1, Number(event.target.value) || 1) }
                          : entry,
                      ),
                    )
                  }
                  style={quantityInputStyle}
                />
                <button
                  type="button"
                  onClick={() =>
                    onRewardItemsChange(rewardItems.filter((_, i) => i !== index))
                  }
                  style={dangerSmallStyle}
                >
                  Remove
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function EffectFields({
  index,
  effect,
  onChange,
}: {
  index: number;
  effect: EnemyMoveEffect;
  onChange: (patch: Partial<EnemyMoveEffect>) => void;
}) {
  if (effect.type === "damage") {
    const dice = effect.damageDice ?? { numDice: 1, dieSize: 6, bonus: 0 };
    return (
      <>
        <FieldGroup id={`move-target-${index}`} label="Target">
          <StyledSelect
            id={`move-target-${index}`}
            value={effect.target}
            onChange={(event) =>
              onChange({ target: event.target.value as "single" | "all" | "random" })
            }
          >
            <option value="single">Single</option>
            <option value="all">All</option>
            <option value="random">Random</option>
          </StyledSelect>
        </FieldGroup>
        <DiceFields
          idPrefix={`move-damage-${index}`}
          label="Damage dice"
          dice={dice}
          onChange={(damageDice) => onChange({ damageDice })}
        />
      </>
    );
  }

  if (effect.type === "heal") {
    const dice = effect.healDice ?? { numDice: 1, dieSize: 8, bonus: 0 };
    return (
      <>
        <FieldGroup id={`move-target-${index}`} label="Target">
          <StyledSelect
            id={`move-target-${index}`}
            value={effect.target}
            onChange={(event) =>
              onChange({
                target: event.target.value as "self" | "all_allies" | "lowest_hp_ally",
              })
            }
          >
            <option value="self">Self</option>
            <option value="all_allies">All allies</option>
            <option value="lowest_hp_ally">Lowest HP ally</option>
          </StyledSelect>
        </FieldGroup>
        <DiceFields
          idPrefix={`move-heal-${index}`}
          label="Heal dice"
          dice={dice}
          onChange={(healDice) => onChange({ healDice })}
        />
      </>
    );
  }

  if (effect.type === "buff" || effect.type === "debuff") {
    return (
      <>
        <FieldGroup id={`move-stat-${index}`} label="Stat">
          <StyledSelect
            id={`move-stat-${index}`}
            value={effect.stat}
            onChange={(event) =>
              onChange({ stat: event.target.value as typeof effect.stat })
            }
          >
            <option value="strength">Strength</option>
            <option value="defense">Defense</option>
            <option value="dex">Dexterity</option>
          </StyledSelect>
        </FieldGroup>
        <FieldGroup id={`move-amount-${index}`} label="Amount">
          <StyledInput
            id={`move-amount-${index}`}
            type="number"
            value={effect.amount}
            onChange={(event) =>
              onChange({ amount: Math.max(0, Number(event.target.value) || 0) })
            }
          />
        </FieldGroup>
        <FieldGroup id={`move-duration-${index}`} label="Duration (turns)">
          <StyledInput
            id={`move-duration-${index}`}
            type="number"
            value={effect.duration}
            onChange={(event) =>
              onChange({ duration: Math.max(1, Number(event.target.value) || 1) })
            }
          />
        </FieldGroup>
        <FieldGroup id={`move-target-${index}`} label="Target">
          <StyledSelect
            id={`move-target-${index}`}
            value={effect.target}
            onChange={(event) =>
              onChange({ target: event.target.value as typeof effect.target })
            }
          >
            {effect.type === "buff" ? (
              <>
                <option value="self">Self</option>
                <option value="all_allies">All allies</option>
              </>
            ) : (
              <option value="single">Single</option>
            )}
          </StyledSelect>
        </FieldGroup>
      </>
    );
  }

  return (
    <>
      <FieldGroup id={`move-spawn-index-${index}`} label="Spawn index">
        <StyledInput
          id={`move-spawn-index-${index}`}
          type="number"
          value={effect.spawnIndex}
          onChange={(event) =>
            onChange({ spawnIndex: Math.max(0, Number(event.target.value) || 0) })
          }
        />
      </FieldGroup>
      <FieldGroup id={`move-spawn-count-${index}`} label="Count">
        <StyledInput
          id={`move-spawn-count-${index}`}
          type="number"
          value={effect.count}
          onChange={(event) =>
            onChange({ count: Math.max(1, Number(event.target.value) || 1) })
          }
        />
      </FieldGroup>
    </>
  );
}

function DiceFields({
  idPrefix,
  label,
  dice,
  onChange,
}: {
  idPrefix: string;
  label: string;
  dice: { numDice: number; dieSize: number; bonus: number };
  onChange: (dice: { numDice: number; dieSize: number; bonus: number }) => void;
}) {
  return (
    <div style={{ gridColumn: "1 / -1" }}>
      <div style={diceLabelStyle}>{label}</div>
      <div style={diceRowStyle}>
        <StyledInput
          aria-label={`${label} count`}
          id={`${idPrefix}-count`}
          type="number"
          value={dice.numDice}
          onChange={(event) =>
            onChange({ ...dice, numDice: Math.max(0, Number(event.target.value) || 0) })
          }
          style={{ maxWidth: 80 }}
        />
        <span style={diceJoinStyle}>d</span>
        <StyledInput
          aria-label={`${label} die size`}
          id={`${idPrefix}-size`}
          type="number"
          value={dice.dieSize}
          onChange={(event) =>
            onChange({ ...dice, dieSize: Math.max(2, Number(event.target.value) || 2) })
          }
          style={{ maxWidth: 80 }}
        />
        <span style={diceJoinStyle}>+</span>
        <StyledInput
          aria-label={`${label} bonus`}
          id={`${idPrefix}-bonus`}
          type="number"
          value={dice.bonus}
          onChange={(event) => onChange({ ...dice, bonus: Number(event.target.value) || 0 })}
          style={{ maxWidth: 80 }}
        />
      </div>
    </div>
  );
}

const sectionStyle: CSSProperties = {
  marginTop: 8,
  padding: 14,
  background: "rgba(139,92,246,0.05)",
  border: "1px solid rgba(139,92,246,0.2)",
  borderRadius: 8,
};
const headingStyle: CSSProperties = {
  fontSize: 11,
  fontWeight: 700,
  letterSpacing: "0.1em",
  textTransform: "uppercase",
  color: "#C4B5FD",
  fontFamily: fonts.display,
  marginBottom: 12,
};
const subheadingRowStyle: CSSProperties = {
  display: "flex",
  alignItems: "center",
  justifyContent: "space-between",
  gap: 12,
  flexWrap: "wrap",
  margin: "16px 0 8px",
  paddingTop: 12,
  borderTop: "1px solid rgba(139,92,246,0.18)",
};
const subheadingStyle: CSSProperties = {
  fontSize: 10,
  fontWeight: 700,
  letterSpacing: "0.09em",
  textTransform: "uppercase",
  color: "#A78BFA",
  fontFamily: fonts.display,
};
const hintStyle: CSSProperties = {
  margin: "0 0 10px",
  fontSize: 11,
  lineHeight: 1.5,
  color: colors.muted,
};
const formGridStyle: CSSProperties = {
  display: "grid",
  gridTemplateColumns: "repeat(auto-fit, minmax(150px, 1fr))",
  gap: "0 12px",
};
const listStyle: CSSProperties = { display: "flex", flexDirection: "column", gap: 8 };
const moveCardStyle: CSSProperties = {
  padding: 12,
  background: "rgba(0,0,0,0.22)",
  border: "1px solid rgba(139,92,246,0.18)",
  borderRadius: 7,
};
const moveHeaderStyle: CSSProperties = {
  display: "flex",
  alignItems: "center",
  gap: 10,
  marginBottom: 10,
  flexWrap: "wrap",
};
const moveIndexStyle: CSSProperties = {
  fontSize: 10,
  fontWeight: 700,
  letterSpacing: "0.08em",
  textTransform: "uppercase",
  color: "#C4B5FD",
  fontFamily: fonts.display,
};
const moveSummaryStyle: CSSProperties = { flex: 1, fontSize: 10, color: colors.muted };
const addButtonStyle: CSSProperties = {
  padding: "4px 9px",
  background: "rgba(139,92,246,0.12)",
  border: "1px dashed rgba(139,92,246,0.4)",
  borderRadius: 4,
  color: "#C4B5FD",
  fontSize: 10,
  fontFamily: fonts.display,
  cursor: "pointer",
};
const dangerSmallStyle: CSSProperties = {
  padding: "4px 8px",
  background: "rgba(220,38,38,0.07)",
  border: "1px solid rgba(220,38,38,0.25)",
  borderRadius: 4,
  color: "#FCA5A5",
  fontSize: 10,
  fontFamily: fonts.display,
  cursor: "pointer",
};
const spawnRowStyle: CSSProperties = {
  display: "flex",
  alignItems: "center",
  gap: 10,
  padding: "7px 10px",
  background: "rgba(0,0,0,0.2)",
  border: "1px solid rgba(139,92,246,0.15)",
  borderRadius: 6,
  flexWrap: "wrap",
};
const spawnIndexStyle: CSSProperties = {
  fontFamily: "monospace",
  fontSize: 11,
  color: "#A78BFA",
};
const spawnNameStyle: CSSProperties = {
  fontSize: 12,
  color: colors.text,
  fontFamily: fonts.display,
};
const spawnMetaStyle: CSSProperties = { flex: 1, fontSize: 10, color: colors.muted };
const rewardsStyle: CSSProperties = {
  marginTop: 16,
  paddingTop: 14,
  borderTop: "1px solid rgba(139,92,246,0.18)",
};
const quantityInputStyle: CSSProperties = {
  width: 62,
  padding: "5px 7px",
  background: "rgba(0,0,0,0.35)",
  border: `1px solid ${colors.goldBorder}`,
  borderRadius: 4,
  color: colors.text,
  fontSize: 11,
  textAlign: "right",
  fontFamily: fonts.body,
  outline: "none",
};
const diceLabelStyle: CSSProperties = {
  fontSize: 10,
  letterSpacing: "0.06em",
  textTransform: "uppercase",
  color: colors.goldMuted,
  marginBottom: 5,
};
const diceRowStyle: CSSProperties = {
  display: "flex",
  alignItems: "center",
  gap: 8,
  marginBottom: 10,
};
const diceJoinStyle: CSSProperties = { fontSize: 11, color: colors.muted };
