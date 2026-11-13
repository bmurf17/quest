import { DialogueOutcomeType } from "@/types/RoomInteractions";
import { FieldGroup, StyledInput, StyledSelect } from "@/components/Admin/game-design/create-room/primitives";
import { dialogueNodeLabel } from "./nodeLabels";
import type {
  AdminDialogueChoice,
  AdminDialogueGraph,
  AdminDialogueNode,
  ChoiceOutcomeInput,
} from "@/queries/AdminDialogueQueries";
import type { CSSProperties } from "react";

const SKILL_OPTIONS = [
  "Acrobatics",
  "Animal Handling",
  "Arcana",
  "Athletics",
  "Deception",
  "Insight",
  "Intimidation",
  "Investigation",
  "Perception",
  "Persuasion",
  "Stealth",
];

const OUTCOME_OPTIONS = Object.values(DialogueOutcomeType).map((value) => ({
  value,
  label: value
    .split("_")
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" "),
}));

export function DialogueNodeEditor({
  graph,
  node,
  onUpdateNode,
  onDeleteNode,
  onAddChoice,
  onUpdateChoice,
  onDeleteChoice,
  onCreateNodeAfterChoice,
  onUpdateChoiceOutcome,
}: {
  graph: AdminDialogueGraph;
  node: AdminDialogueNode;
  onUpdateNode: (nodeId: string, values: { npc_text?: string; speaker?: string; is_endpoint?: number }) => void;
  onDeleteNode: (node: AdminDialogueNode) => void;
  onAddChoice: (nodeId: string) => void;
  onUpdateChoice: (choiceId: string, values: Partial<AdminDialogueChoice>) => void;
  onDeleteChoice: (choice: AdminDialogueChoice) => void;
  onCreateNodeAfterChoice: (choice: AdminDialogueChoice) => void;
  onUpdateChoiceOutcome: (choiceId: string, outcome: ChoiceOutcomeInput) => void;
}) {
  const nodeChoices = graph.choices.filter((choice) => choice.node_id === node.id);
  const isRoot = graph.tree.root_node_id === node.id;

  const outcomeFor = (choiceId: string) =>
    graph.outcomes.find((outcome) => outcome.choice_id === choiceId) ?? null;

  return (
    <div style={panelStyle}>
      <div style={headerStyle}>
        <div>
          <div style={eyebrowStyle}>{isRoot ? "Root node" : "Dialogue node"}</div>
          <div style={nodeIdStyle}>#{node.id.slice(0, 8)}</div>
        </div>
        <div style={headerActionsStyle}>
          <button
            type="button"
            onClick={() => onDeleteNode(node)}
            disabled={isRoot}
            style={{
              ...dangerButtonStyle,
              opacity: isRoot ? 0.35 : 1,
              cursor: isRoot ? "not-allowed" : "pointer",
            }}
            title={isRoot ? "The root node cannot be deleted" : "Delete this node"}
          >
            Delete node
          </button>
        </div>
      </div>

      <label style={labelStyle} htmlFor="node-text">
        NPC says
      </label>
      <textarea
        id="node-text"
        value={node.npc_text}
        onChange={(event) => onUpdateNode(node.id, { npc_text: event.target.value })}
        style={textareaStyle}
      />

      <div style={twoColumnStyle}>
        <FieldGroup id="node-speaker" label="Speaker label">
          <StyledInput
            id="node-speaker"
            value={node.speaker}
            onChange={(event) => onUpdateNode(node.id, { speaker: event.target.value })}
          />
        </FieldGroup>
        <FieldGroup id="node-endpoint" label="Endpoint">
          <StyledSelect
            id="node-endpoint"
            value={node.is_endpoint ? "yes" : "no"}
            onChange={(event) =>
              onUpdateNode(node.id, { is_endpoint: event.target.value === "yes" ? 1 : 0 })
            }
          >
            <option value="no">No — player must choose</option>
            <option value="yes">Yes — conversation can end here</option>
          </StyledSelect>
        </FieldGroup>
      </div>

      <div style={choicesHeaderStyle}>
        <div style={sectionHeadingStyle}>Player choices ({nodeChoices.length})</div>
        <button type="button" onClick={() => onAddChoice(node.id)} style={addButtonStyle}>
          + Add choice
        </button>
      </div>

      {nodeChoices.length === 0 && (
        <p style={helperTextStyle}>
          No choices. The player will see this line and the conversation stays put. Add a choice,
          or mark the node as an endpoint and attach an “End conversation” outcome.
        </p>
      )}

      <div style={choiceListStyle}>
        {nodeChoices.map((choice) => {
          const outcome = outcomeFor(choice.id);
          const outcomeType =
            (outcome?.outcome_type as DialogueOutcomeType) ?? DialogueOutcomeType.NONE;
          const hasSkillCheck = choice.required_skill !== null;
          const targetOptions = graph.nodes.map((candidate) => (
            <option key={candidate.id} value={candidate.id}>
              {dialogueNodeLabel(candidate, graph.tree.root_node_id)}
            </option>
          ));
          const updateOutcome = (patch: Partial<ChoiceOutcomeInput>) => {
            onUpdateChoiceOutcome(choice.id, {
              type: outcomeType,
              value: outcome?.outcome_value ?? "",
              flagKey: outcome?.flag_key ?? "",
              flagValue: outcome?.flag_value ?? "",
              ...patch,
            });
          };

          return (
            <div key={choice.id} style={choiceCardStyle}>
              <div style={choiceTopStyle}>
                <input
                  value={choice.choice_text}
                  onChange={(event) =>
                    onUpdateChoice(choice.id, { choice_text: event.target.value })
                  }
                  aria-label="Choice text"
                  style={choiceTextStyle}
                />
                <button
                  type="button"
                  onClick={() => onDeleteChoice(choice)}
                  style={dangerSmallButtonStyle}
                >
                  Delete
                </button>
              </div>

              <div style={choiceGridStyle}>
                <FieldGroup id={`choice-target-${choice.id}`} label="If chosen, go to">
                  <StyledSelect
                    id={`choice-target-${choice.id}`}
                    value={choice.next_node_id ?? ""}
                    disabled={hasSkillCheck}
                    onChange={(event) =>
                      onUpdateChoice(choice.id, { next_node_id: event.target.value || null })
                    }
                  >
                    <option value="">End of conversation</option>
                    {targetOptions}
                  </StyledSelect>
                </FieldGroup>

                <FieldGroup id={`choice-skill-${choice.id}`} label="Skill check">
                  <StyledSelect
                    id={`choice-skill-${choice.id}`}
                    value={hasSkillCheck ? "yes" : "no"}
                    onChange={(event) => {
                      if (event.target.value === "yes") {
                        onUpdateChoice(choice.id, {
                          required_skill: "Deception",
                          skill_check_dc: 10,
                          success_node_id: choice.next_node_id,
                          failure_node_id: choice.next_node_id,
                        });
                      } else {
                        onUpdateChoice(choice.id, {
                          required_skill: null,
                          skill_check_dc: null,
                          success_node_id: null,
                          failure_node_id: null,
                        });
                      }
                    }}
                  >
                    <option value="no">None</option>
                    <option value="yes">Required</option>
                  </StyledSelect>
                </FieldGroup>
              </div>

              {hasSkillCheck && (
                <div style={skillRowStyle}>
                  <FieldGroup id={`choice-skill-name-${choice.id}`} label="Skill">
                    <StyledInput
                      id={`choice-skill-name-${choice.id}`}
                      list="dialogue-skill-options"
                      value={choice.required_skill ?? ""}
                      onChange={(event) =>
                        onUpdateChoice(choice.id, { required_skill: event.target.value })
                      }
                    />
                  </FieldGroup>
                  <FieldGroup id={`choice-skill-dc-${choice.id}`} label="DC">
                    <StyledInput
                      id={`choice-skill-dc-${choice.id}`}
                      type="number"
                      value={choice.skill_check_dc ?? 10}
                      onChange={(event) =>
                        onUpdateChoice(choice.id, {
                          skill_check_dc: Number(event.target.value) || 10,
                        })
                      }
                    />
                  </FieldGroup>
                  <FieldGroup id={`choice-success-${choice.id}`} label="Success goes to">
                    <StyledSelect
                      id={`choice-success-${choice.id}`}
                      value={choice.success_node_id ?? ""}
                      onChange={(event) =>
                        onUpdateChoice(choice.id, {
                          success_node_id: event.target.value || null,
                        })
                      }
                    >
                      <option value="">End of conversation</option>
                      {targetOptions}
                    </StyledSelect>
                  </FieldGroup>
                  <FieldGroup id={`choice-failure-${choice.id}`} label="Failure goes to">
                    <StyledSelect
                      id={`choice-failure-${choice.id}`}
                      value={choice.failure_node_id ?? ""}
                      onChange={(event) =>
                        onUpdateChoice(choice.id, {
                          failure_node_id: event.target.value || null,
                        })
                      }
                    >
                      <option value="">End of conversation</option>
                      {targetOptions}
                    </StyledSelect>
                  </FieldGroup>
                </div>
              )}

              <div style={outcomeSectionStyle}>
                <FieldGroup id={`choice-outcome-${choice.id}`} label="Outcome when chosen">
                  <StyledSelect
                    id={`choice-outcome-${choice.id}`}
                    value={outcomeType}
                    onChange={(event) => {
                      const type = event.target.value as DialogueOutcomeType;
                      if (type === DialogueOutcomeType.NONE) {
                        updateOutcome({ type, value: "", flagKey: "", flagValue: "" });
                      } else {
                        updateOutcome({ type });
                      }
                    }}
                  >
                    {OUTCOME_OPTIONS.map((option) => (
                      <option key={option.value} value={option.value}>
                        {option.label}
                      </option>
                    ))}
                  </StyledSelect>
                </FieldGroup>

                {outcomeType !== DialogueOutcomeType.NONE && (
                  <div style={outcomeFieldsStyle}>
                    <FieldGroup id={`choice-outcome-value-${choice.id}`} label="Value">
                      <StyledInput
                        id={`choice-outcome-value-${choice.id}`}
                        value={outcome?.outcome_value ?? ""}
                        placeholder="Item, quest, or message"
                        onChange={(event) => updateOutcome({ value: event.target.value })}
                      />
                    </FieldGroup>
                    <FieldGroup id={`choice-flag-key-${choice.id}`} label="Flag key">
                      <StyledInput
                        id={`choice-flag-key-${choice.id}`}
                        value={outcome?.flag_key ?? ""}
                        onChange={(event) => updateOutcome({ flagKey: event.target.value })}
                      />
                    </FieldGroup>
                    <FieldGroup id={`choice-flag-value-${choice.id}`} label="Flag value">
                      <StyledInput
                        id={`choice-flag-value-${choice.id}`}
                        value={outcome?.flag_value ?? ""}
                        onChange={(event) => updateOutcome({ flagValue: event.target.value })}
                      />
                    </FieldGroup>
                  </div>
                )}
              </div>

              <div style={choiceFooterStyle}>
                <button
                  type="button"
                  onClick={() => onCreateNodeAfterChoice(choice)}
                  style={secondaryButtonStyle}
                >
                  + New node after this choice
                </button>
              </div>
            </div>
          );
        })}
      </div>

      <datalist id="dialogue-skill-options">
        {SKILL_OPTIONS.map((skill) => (
          <option key={skill} value={skill} />
        ))}
      </datalist>
    </div>
  );
}

const panelStyle: CSSProperties = {
  background: "rgba(255,255,255,0.025)",
  border: `1px solid rgba(180,140,80,0.18)`,
  borderRadius: 10,
  padding: 20,
};
const headerStyle: CSSProperties = {
  display: "flex",
  alignItems: "flex-start",
  justifyContent: "space-between",
  gap: 12,
  marginBottom: 16,
};
const eyebrowStyle: CSSProperties = {
  fontSize: 10,
  fontWeight: 700,
  letterSpacing: "0.12em",
  textTransform: "uppercase",
  color: "#C9A84C",
  marginBottom: 3,
};
const nodeIdStyle: CSSProperties = {
  fontFamily: "monospace",
  fontSize: 12,
  color: "#6B7280",
};
const headerActionsStyle: CSSProperties = { display: "flex", gap: 8 };
const labelStyle: CSSProperties = {
  display: "block",
  fontSize: 11,
  fontWeight: 600,
  letterSpacing: "0.08em",
  textTransform: "uppercase",
  color: "#9CA3AF",
  marginBottom: 6,
  fontFamily: "'Cinzel', Georgia, serif",
};
const textareaStyle: CSSProperties = {
  width: "100%",
  minHeight: 90,
  padding: 12,
  background: "rgba(0,0,0,0.35)",
  border: "1px solid rgba(180,140,80,0.18)",
  borderRadius: 6,
  color: "#E8DCC8",
  fontSize: 14,
  fontFamily: "'Lato', sans-serif",
  resize: "vertical",
  boxSizing: "border-box",
  outline: "none",
  marginBottom: 14,
};
const twoColumnStyle: CSSProperties = {
  display: "grid",
  gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))",
  gap: 14,
};
const choicesHeaderStyle: CSSProperties = {
  display: "flex",
  alignItems: "center",
  justifyContent: "space-between",
  gap: 12,
  paddingTop: 16,
  marginTop: 4,
  borderTop: "1px solid rgba(255,255,255,0.07)",
};
const sectionHeadingStyle: CSSProperties = {
  fontSize: 11,
  fontWeight: 700,
  letterSpacing: "0.1em",
  textTransform: "uppercase",
  color: "#D4AF37",
  fontFamily: "'Cinzel', Georgia, serif",
};
const addButtonStyle: CSSProperties = {
  padding: "6px 12px",
  background: "rgba(212,175,55,0.1)",
  border: "1px dashed rgba(212,175,55,0.4)",
  borderRadius: 5,
  color: "#D4AF37",
  fontSize: 11,
  fontFamily: "'Cinzel', Georgia, serif",
  cursor: "pointer",
};
const helperTextStyle: CSSProperties = {
  margin: "12px 0 0",
  fontSize: 12,
  lineHeight: 1.5,
  color: "#9CA3AF",
};
const choiceListStyle: CSSProperties = {
  display: "flex",
  flexDirection: "column",
  gap: 12,
  marginTop: 12,
};
const choiceCardStyle: CSSProperties = {
  padding: 14,
  background: "rgba(0,0,0,0.22)",
  border: "1px solid rgba(255,255,255,0.07)",
  borderRadius: 8,
};
const choiceTopStyle: CSSProperties = {
  display: "flex",
  alignItems: "center",
  gap: 8,
  marginBottom: 12,
};
const choiceTextStyle: CSSProperties = {
  flex: 1,
  padding: "8px 10px",
  background: "rgba(0,0,0,0.35)",
  border: "1px solid rgba(255,255,255,0.12)",
  borderRadius: 4,
  color: "#E8DCC8",
  fontSize: 13,
  fontFamily: "'Lato', sans-serif",
  outline: "none",
};
const choiceGridStyle: CSSProperties = {
  display: "grid",
  gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))",
  gap: 12,
};
const skillRowStyle: CSSProperties = {
  display: "grid",
  gridTemplateColumns: "repeat(auto-fit, minmax(140px, 1fr))",
  gap: 12,
  padding: 12,
  background: "rgba(139,92,246,0.06)",
  border: "1px solid rgba(139,92,246,0.2)",
  borderRadius: 6,
  marginTop: 2,
};
const outcomeSectionStyle: CSSProperties = {
  marginTop: 12,
  paddingTop: 12,
  borderTop: "1px solid rgba(255,255,255,0.05)",
};
const outcomeFieldsStyle: CSSProperties = {
  display: "grid",
  gridTemplateColumns: "repeat(auto-fit, minmax(140px, 1fr))",
  gap: 12,
};
const choiceFooterStyle: CSSProperties = { display: "flex", justifyContent: "flex-end" };
const dangerButtonStyle: CSSProperties = {
  padding: "6px 12px",
  background: "rgba(220,38,38,0.1)",
  border: "1px solid rgba(220,38,38,0.3)",
  borderRadius: 5,
  color: "#FCA5A5",
  fontSize: 11,
  fontFamily: "'Cinzel', Georgia, serif",
};
const dangerSmallButtonStyle: CSSProperties = {
  padding: "5px 10px",
  background: "rgba(220,38,38,0.07)",
  border: "1px solid rgba(220,38,38,0.25)",
  borderRadius: 4,
  color: "#FCA5A5",
  fontSize: 10,
  fontFamily: "'Cinzel', Georgia, serif",
  cursor: "pointer",
};
const secondaryButtonStyle: CSSProperties = {
  padding: "6px 12px",
  background: "rgba(255,255,255,0.03)",
  border: "1px solid rgba(255,255,255,0.1)",
  borderRadius: 5,
  color: "#A8916A",
  fontSize: 11,
  fontFamily: "'Cinzel', Georgia, serif",
  cursor: "pointer",
};
