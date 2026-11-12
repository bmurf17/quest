import { fonts } from "@/theme";
import { EnemyEntry, MoveEntry, defaultEnemy, defaultMove } from "./formTypes";
import { FieldGroup, StyledInput, StyledSelect } from "./primitives";
import { MoveForm } from "./MoveForm";

export function CombatForm({
  enemyImgs,
  enemies,
  onChange,
}: {
  enemyImgs: string[];
  enemies: EnemyEntry[];
  onChange: (enemies: EnemyEntry[]) => void;
}) {
  const updateEnemy = <K extends keyof EnemyEntry>(
    index: number,
    field: K,
    value: EnemyEntry[K],
  ) => {
    const updated = enemies.map((e, i) =>
      i === index ? { ...e, [field]: value } : e,
    );
    onChange(updated);
  };

  const addEnemy = () => {
    onChange([...enemies, defaultEnemy(enemyImgs)]);
  };

  const removeEnemy = (index: number) => {
    if (enemies.length <= 1) return;
    onChange(enemies.filter((_, i) => i !== index));
  };

  const updateMove = (enemyIndex: number, moveIndex: number, move: MoveEntry) => {
    const enemy = enemies[enemyIndex];
    const moves = [...enemy.moves];
    moves[moveIndex] = move;
    updateEnemy(enemyIndex, "moves", moves);
  };

  const addMove = (enemyIndex: number) => {
    const enemy = enemies[enemyIndex];
    updateEnemy(enemyIndex, "moves", [...enemy.moves, defaultMove()]);
  };

  const removeMove = (enemyIndex: number, moveIndex: number) => {
    const enemy = enemies[enemyIndex];
    updateEnemy(
      enemyIndex,
      "moves",
      enemy.moves.filter((_, i) => i !== moveIndex),
    );
  };

  return (
    <>
      {enemies.map((enemy, index) => (
        <div
          key={index}
          style={{
            position: "relative",
            marginBottom:
              enemies.length > 1 && index < enemies.length - 1 ? 20 : 4,
            paddingBottom:
              enemies.length > 1 && index < enemies.length - 1 ? 20 : 0,
            borderBottom:
              enemies.length > 1 && index < enemies.length - 1
                ? "1px solid rgba(180,140,80,0.15)"
                : "none",
          }}
        >
          {enemies.length > 1 && (
            <div
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                marginBottom: 12,
              }}
            >
              <span
                style={{
                  fontSize: 12,
                  fontWeight: 600,
                  color: "#DC2626",
                  fontFamily: fonts.display,
                  letterSpacing: "0.06em",
                }}
              >
                Enemy {index + 1}
              </span>
              <button
                type="button"
                onClick={() => removeEnemy(index)}
                style={{
                  background: "rgba(220,38,38,0.15)",
                  border: "1px solid rgba(220,38,38,0.4)",
                  borderRadius: 4,
                  color: "#FCA5A5",
                  fontSize: 12,
                  cursor: "pointer",
                  padding: "3px 10px",
                  fontFamily: fonts.display,
                }}
              >
                Remove
              </button>
            </div>
          )}
          <div
            style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}
          >
            <div style={{ gridColumn: "1 / -1" }}>
              <FieldGroup id={`enemyName-${index}`} label="Enemy Name">
                <StyledInput
                  id={`enemyName-${index}`}
                  placeholder="e.g. Goblin Scout"
                  value={enemy.name}
                  onChange={(e) => updateEnemy(index, "name", e.target.value)}
                />
              </FieldGroup>
            </div>
            <FieldGroup id={`health-${index}`} label="Health">
              <StyledInput
                id={`health-${index}`}
                type="number"
                value={enemy.health}
                onChange={(e) =>
                  updateEnemy(index, "health", parseInt(e.target.value) || 0)
                }
              />
            </FieldGroup>
            <FieldGroup id={`enemyImg-${index}`} label="Enemy Sprite">
              <StyledSelect
                id={`enemyImg-${index}`}
                value={enemy.img}
                onChange={(e) => updateEnemy(index, "img", e.target.value)}
              >
                {enemyImgs.map((img, i) => (
                  <option key={i} value={img}>
                    {img.split("/").pop()?.replace(".png", "") ?? img}
                  </option>
                ))}
              </StyledSelect>
            </FieldGroup>
          </div>
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "1fr 1fr 1fr",
              gap: 12,
            }}
          >
            <FieldGroup id={`strength-${index}`} label="Strength">
              <StyledInput
                id={`strength-${index}`}
                type="number"
                value={enemy.strength}
                onChange={(e) =>
                  updateEnemy(index, "strength", parseInt(e.target.value) || 0)
                }
              />
            </FieldGroup>
            <FieldGroup id={`dex-${index}`} label="Dexterity">
              <StyledInput
                id={`dex-${index}`}
                type="number"
                value={enemy.dex}
                onChange={(e) =>
                  updateEnemy(index, "dex", parseInt(e.target.value) || 0)
                }
              />
            </FieldGroup>
            <FieldGroup id={`defense-${index}`} label="Defense">
              <StyledInput
                id={`defense-${index}`}
                type="number"
                value={enemy.defense}
                onChange={(e) =>
                  updateEnemy(index, "defense", parseInt(e.target.value) || 0)
                }
              />
            </FieldGroup>
          </div>

          <div
            style={{
              display: "grid",
              gridTemplateColumns: "1fr 1fr 1fr",
              gap: 12,
              marginTop: 12,
            }}
          >
            <FieldGroup id={`expGain-${index}`} label="Exp Gain">
              <StyledInput
                id={`expGain-${index}`}
                type="number"
                value={enemy.expGain}
                onChange={(e) =>
                  updateEnemy(index, "expGain", parseInt(e.target.value) || 0)
                }
              />
            </FieldGroup>
            <FieldGroup id={`maxHealth-${index}`} label="Max Health (optional)">
              <StyledInput
                id={`maxHealth-${index}`}
                type="number"
                placeholder="Same as Health if blank"
                value={enemy.maxHealth ?? ""}
                onChange={(e) =>
                  updateEnemy(
                    index,
                    "maxHealth",
                    e.target.value ? parseInt(e.target.value) : undefined,
                  )
                }
              />
            </FieldGroup>
            <FieldGroup id={`type-${index}`} label="Type">
              <StyledSelect
                id={`type-${index}`}
                value={enemy.type}
                onChange={(e) =>
                  updateEnemy(
                    index,
                    "type",
                    e.target.value as "enemy" | "boss",
                  )
                }
              >
                <option value="enemy">Enemy</option>
                <option value="boss">Boss</option>
              </StyledSelect>
            </FieldGroup>
          </div>

          {enemy.type === "boss" && (
            <div style={{ marginTop: 8 }}>
              <FieldGroup
                id={`phaseThresholds-${index}`}
                label="Phase Thresholds (% , separated)"
              >
                <StyledInput
                  id={`phaseThresholds-${index}`}
                  placeholder="e.g. 70, 40"
                  value={enemy.phaseThresholds.join(", ")}
                  onChange={(e) => {
                    const vals = e.target.value
                      .split(",")
                      .map((s) => parseFloat(s.trim()))
                      .filter((n) => !isNaN(n));
                    updateEnemy(index, "phaseThresholds", vals);
                  }}
                />
              </FieldGroup>
            </div>
          )}

          <div style={{ marginTop: 16 }}>
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: 8,
                marginBottom: 8,
              }}
            >
              <span
                style={{
                  fontSize: 11,
                  fontWeight: 700,
                  letterSpacing: "0.1em",
                  textTransform: "uppercase",
                  color: "#DC2626",
                  fontFamily: fonts.display,
                }}
              >
                Moves ({enemy.moves.length})
              </span>
              <button
                type="button"
                onClick={() => addMove(index)}
                style={{
                  background: "rgba(220,38,38,0.1)",
                  border: "1px dashed rgba(220,38,38,0.4)",
                  borderRadius: 4,
                  color: "#F87171",
                  fontSize: 11,
                  cursor: "pointer",
                  padding: "2px 10px",
                  fontFamily: fonts.display,
                }}
              >
                + Add Move
              </button>
            </div>
            {enemy.moves.map((move, moveIndex) => (
              <MoveForm
                key={moveIndex}
                move={move}
                index={moveIndex}
                onChange={(m) => updateMove(index, moveIndex, m)}
                onRemove={() => removeMove(index, moveIndex)}
              />
            ))}
            {enemy.moves.length === 0 && (
              <p
                style={{
                  margin: 0,
                  fontSize: 12,
                  color: "#6B7280",
                  fontStyle: "italic",
                }}
              >
                No custom moves. Enemy will use a basic attack.
              </p>
            )}
          </div>
        </div>
      ))}
      <button
        type="button"
        onClick={addEnemy}
        style={{
          display: "flex",
          alignItems: "center",
          gap: 6,
          marginTop: 8,
          padding: "8px 16px",
          background: "rgba(220,38,38,0.1)",
          border: "1px dashed rgba(220,38,38,0.4)",
          borderRadius: 6,
          color: "#F87171",
          fontSize: 13,
          fontWeight: 600,
          cursor: "pointer",
          fontFamily: fonts.display,
          letterSpacing: "0.04em",
          width: "100%",
          justifyContent: "center",
        }}
      >
        + Add Enemy
      </button>
    </>
  );
}
