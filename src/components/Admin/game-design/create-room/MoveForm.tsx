import { EnemyMoveEffect } from "@/types/EnemyMove";
import { fonts } from "@/theme";
import { MoveEntry } from "./formTypes";
import { Label, StyledInput, StyledSelect } from "./primitives";

export function MoveForm({
  move,
  index,
  onChange,
  onRemove,
}: {
  move: MoveEntry;
  index: number;
  onChange: (move: MoveEntry) => void;
  onRemove: () => void;
}) {
  const updateMove = <K extends keyof MoveEntry>(
    field: K,
    value: MoveEntry[K],
  ) => {
    onChange({ ...move, [field]: value });
  };

  type EffectDraft = {
    type: EnemyMoveEffect["type"];
    target?: string;
    stat?: string;
    amount?: number;
    duration?: number;
    spawnIndex?: number;
    count?: number;
    damageDice?: string;
    healDice?: string;
  };

  const effectDraft = move.effect as unknown as EffectDraft;

  const updateEffect = (field: string, value: unknown) => {
    onChange({
      ...move,
      effect: { ...effectDraft, [field]: value } as unknown as EnemyMoveEffect,
    });
  };

  const effectType = effectDraft.type;

  return (
    <div
      style={{
        marginBottom: 12,
        padding: 12,
        background: "rgba(0,0,0,0.2)",
        borderRadius: 6,
        border: "1px solid rgba(180,140,80,0.15)",
      }}
    >
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          marginBottom: 8,
        }}
      >
        <span
          style={{
            fontSize: 11,
            fontWeight: 600,
            color: "#F87171",
            fontFamily: fonts.display,
          }}
        >
          Move {index + 1}
        </span>
        <button
          type="button"
          onClick={onRemove}
          style={{
            background: "rgba(220,38,38,0.15)",
            border: "1px solid rgba(220,38,38,0.4)",
            borderRadius: 4,
            color: "#FCA5A5",
            fontSize: 11,
            cursor: "pointer",
            padding: "2px 8px",
          }}
        >
          Remove
        </button>
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
        <div style={{ gridColumn: "1 / -1" }}>
          <Label htmlFor={`moveName-${index}`}>Name</Label>
          <StyledInput
            id={`moveName-${index}`}
            placeholder="e.g. Fire Breath"
            value={move.name}
            onChange={(e) => updateMove("name", e.target.value)}
          />
        </div>
        <div style={{ gridColumn: "1 / -1" }}>
          <Label htmlFor={`moveDesc-${index}`}>Description</Label>
          <StyledInput
            id={`moveDesc-${index}`}
            placeholder="Brief description"
            value={move.description}
            onChange={(e) => updateMove("description", e.target.value)}
          />
        </div>
        <div>
          <Label htmlFor={`moveCooldown-${index}`}>Cooldown</Label>
          <StyledInput
            id={`moveCooldown-${index}`}
            type="number"
            value={move.cooldown}
            onChange={(e) =>
              updateMove("cooldown", parseInt(e.target.value) || 0)
            }
          />
        </div>
        <div>
          <Label htmlFor={`moveWeight-${index}`}>Weight</Label>
          <StyledInput
            id={`moveWeight-${index}`}
            type="number"
            value={move.weight}
            onChange={(e) => updateMove("weight", parseInt(e.target.value) || 1)}
          />
        </div>
        <div>
          <Label htmlFor={`movePhase-${index}`}>Phase (optional)</Label>
          <StyledInput
            id={`movePhase-${index}`}
            type="number"
            placeholder="e.g. 2"
            value={move.phase ?? ""}
            onChange={(e) =>
              updateMove(
                "phase",
                e.target.value ? parseInt(e.target.value) : undefined,
              )
            }
          />
        </div>
        <div>
          <Label htmlFor={`moveEffectType-${index}`}>Effect Type</Label>
          <StyledSelect
            id={`moveEffectType-${index}`}
            value={effectType}
            onChange={(e) => {
              const newType = e.target.value as EnemyMoveEffect["type"];
              let effect: EnemyMoveEffect;
              switch (newType) {
                case "damage":
                  effect = { type: "damage", target: "single" };
                  break;
                case "heal":
                  effect = { type: "heal", target: "self" };
                  break;
                case "buff":
                  effect = {
                    type: "buff",
                    stat: "strength",
                    amount: 2,
                    duration: 3,
                    target: "self",
                  };
                  break;
                case "debuff":
                  effect = {
                    type: "debuff",
                    stat: "defense",
                    amount: 2,
                    duration: 3,
                    target: "single",
                  };
                  break;
                case "spawn":
                  effect = { type: "spawn", spawnIndex: 0, count: 1 };
                  break;
              }
              updateMove("effect", effect);
            }}
          >
            <option value="damage">Damage</option>
            <option value="heal">Heal</option>
            <option value="buff">Buff</option>
            <option value="debuff">Debuff</option>
            <option value="spawn">Spawn</option>
          </StyledSelect>
        </div>
        {effectType === "damage" && (
          <>
            <div>
              <Label htmlFor={`moveTarget-${index}`}>Target</Label>
              <StyledSelect
                id={`moveTarget-${index}`}
                value={effectDraft.target}
                onChange={(e) => updateEffect("target", e.target.value)}
              >
                <option value="single">Single</option>
                <option value="all">All</option>
                <option value="random">Random</option>
              </StyledSelect>
            </div>
            <div>
              <Label htmlFor={`moveDice-${index}`}>Damage Dice</Label>
              <StyledInput
                id={`moveDice-${index}`}
                placeholder="e.g. 1d8+2"
                value={effectDraft.damageDice ?? ""}
                onChange={(e) =>
                  updateEffect("damageDice", e.target.value || undefined)
                }
              />
            </div>
          </>
        )}
        {effectType === "heal" && (
          <>
            <div>
              <Label htmlFor={`healTarget-${index}`}>Target</Label>
              <StyledSelect
                id={`healTarget-${index}`}
                value={effectDraft.target}
                onChange={(e) => updateEffect("target", e.target.value)}
              >
                <option value="self">Self</option>
                <option value="all_allies">All Allies</option>
                <option value="lowest_hp_ally">Lowest HP Ally</option>
              </StyledSelect>
            </div>
            <div>
              <Label htmlFor={`healDice-${index}`}>Heal Dice</Label>
              <StyledInput
                id={`healDice-${index}`}
                placeholder="e.g. 2d6"
                value={effectDraft.healDice ?? ""}
                onChange={(e) =>
                  updateEffect("healDice", e.target.value || undefined)
                }
              />
            </div>
          </>
        )}
        {effectType === "buff" && (
          <>
            <div>
              <Label htmlFor={`buffStat-${index}`}>Stat</Label>
              <StyledSelect
                id={`buffStat-${index}`}
                value={effectDraft.stat}
                onChange={(e) => updateEffect("stat", e.target.value)}
              >
                <option value="strength">Strength</option>
                <option value="defense">Defense</option>
                <option value="dex">Dexterity</option>
              </StyledSelect>
            </div>
            <div>
              <Label htmlFor={`buffTarget-${index}`}>Target</Label>
              <StyledSelect
                id={`buffTarget-${index}`}
                value={effectDraft.target}
                onChange={(e) => updateEffect("target", e.target.value)}
              >
                <option value="self">Self</option>
                <option value="all_allies">All Allies</option>
              </StyledSelect>
            </div>
            <div>
              <Label htmlFor={`buffAmount-${index}`}>Amount</Label>
              <StyledInput
                id={`buffAmount-${index}`}
                type="number"
                value={effectDraft.amount}
                onChange={(e) =>
                  updateEffect("amount", parseInt(e.target.value) || 0)
                }
              />
            </div>
            <div>
              <Label htmlFor={`buffDuration-${index}`}>Duration (turns)</Label>
              <StyledInput
                id={`buffDuration-${index}`}
                type="number"
                value={effectDraft.duration}
                onChange={(e) =>
                  updateEffect("duration", parseInt(e.target.value) || 1)
                }
              />
            </div>
          </>
        )}
        {effectType === "debuff" && (
          <>
            <div>
              <Label htmlFor={`debuffStat-${index}`}>Stat</Label>
              <StyledSelect
                id={`debuffStat-${index}`}
                value={effectDraft.stat}
                onChange={(e) => updateEffect("stat", e.target.value)}
              >
                <option value="strength">Strength</option>
                <option value="defense">Defense</option>
                <option value="dex">Dexterity</option>
              </StyledSelect>
            </div>
            <div>
              <Label htmlFor={`debuffAmount-${index}`}>Amount</Label>
              <StyledInput
                id={`debuffAmount-${index}`}
                type="number"
                value={effectDraft.amount}
                onChange={(e) =>
                  updateEffect("amount", parseInt(e.target.value) || 0)
                }
              />
            </div>
            <div>
              <Label htmlFor={`debuffDuration-${index}`}>
                Duration (turns)
              </Label>
              <StyledInput
                id={`debuffDuration-${index}`}
                type="number"
                value={effectDraft.duration}
                onChange={(e) =>
                  updateEffect("duration", parseInt(e.target.value) || 1)
                }
              />
            </div>
          </>
        )}
        {effectType === "spawn" && (
          <>
            <div>
              <Label htmlFor={`spawnIndex-${index}`}>
                Spawn Template Index
              </Label>
              <StyledInput
                id={`spawnIndex-${index}`}
                type="number"
                value={effectDraft.spawnIndex}
                onChange={(e) =>
                  updateEffect("spawnIndex", parseInt(e.target.value) || 0)
                }
              />
            </div>
            <div>
              <Label htmlFor={`spawnCount-${index}`}>Count</Label>
              <StyledInput
                id={`spawnCount-${index}`}
                type="number"
                value={effectDraft.count}
                onChange={(e) =>
                  updateEffect("count", parseInt(e.target.value) || 1)
                }
              />
            </div>
          </>
        )}
      </div>
    </div>
  );
}
