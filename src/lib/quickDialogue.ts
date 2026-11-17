/**
 * Turns the compact dialogue builder used by the room creator into rows for
 * `dialogue_nodes`, `dialogue_choices`, and `dialogue_outcomes`.
 *
 * The builder is intentionally linear: every line flows into the next one.
 * A line with no explicit choices gets an automatic "Continue" choice so the
 * runtime advances, because the dialogue view only moves when a choice is
 * selected. The final line is marked as an endpoint. Anything more elaborate
 * belongs in the full dialogue graph editor.
 */

export interface QuickDialogueChoiceInput {
  text: string;
  outcomeType?: string;
  outcomeValue?: string;
  flagKey?: string;
  flagValue?: string;
}

export interface QuickDialogueLineInput {
  text: string;
  choices: QuickDialogueChoiceInput[];
}

export interface QuickDialogueOutcomePlan {
  type: string;
  value?: string;
  flagKey?: string;
  flagValue?: string;
}

export interface QuickDialogueNodePlan {
  id: string;
  text: string;
  isEndpoint: boolean;
  sortOrder: number;
}

export interface QuickDialogueChoicePlan {
  id: string;
  nodeId: string;
  text: string;
  nextNodeId: string | null;
  sortOrder: number;
  outcome: QuickDialogueOutcomePlan | null;
}

export interface QuickDialoguePlan {
  rootNodeId: string | null;
  nodes: QuickDialogueNodePlan[];
  choices: QuickDialogueChoicePlan[];
}

const clean = (value: string | undefined) => (value ?? "").trim();
const cleanOptional = (value: string | undefined) => {
  const trimmed = clean(value);
  return trimmed === "" ? undefined : trimmed;
};

const outcomeFor = (choice: QuickDialogueChoiceInput): QuickDialogueOutcomePlan | null => {
  const type = clean(choice.outcomeType);
  if (!type || type === "none") return null;

  return {
    type,
    value: cleanOptional(choice.outcomeValue),
    flagKey: cleanOptional(choice.flagKey),
    flagValue: cleanOptional(choice.flagValue),
  };
};

/**
 * Builds the node/choice plan. `createId` is injectable so tests can assert on
 * stable ids instead of mocking crypto.
 */
export function planQuickDialogue(
  lines: QuickDialogueLineInput[],
  createId: () => string = () => crypto.randomUUID(),
): QuickDialoguePlan {
  const kept = lines
    .map((line) => ({
      text: clean(line.text),
      choices: line.choices
        .map((choice) => ({ ...choice, text: clean(choice.text) }))
        .filter((choice) => choice.text.length > 0),
    }))
    .filter((line) => line.text.length > 0);

  const nodes: QuickDialogueNodePlan[] = kept.map((line, index) => ({
    id: createId(),
    text: line.text,
    isEndpoint: index === kept.length - 1,
    sortOrder: index,
  }));

  const choices: QuickDialogueChoicePlan[] = [];

  kept.forEach((line, index) => {
    const node = nodes[index];
    const nextNode = nodes[index + 1] ?? null;

    if (line.choices.length === 0) {
      if (nextNode) {
        choices.push({
          id: createId(),
          nodeId: node.id,
          text: "Continue",
          nextNodeId: nextNode.id,
          sortOrder: 0,
          outcome: null,
        });
      }
      return;
    }

    line.choices.forEach((choice, choiceIndex) => {
      const outcome = outcomeFor(choice);
      choices.push({
        id: createId(),
        nodeId: node.id,
        text: choice.text,
        nextNodeId: outcome?.type === "end_conversation" ? null : (nextNode?.id ?? null),
        sortOrder: choiceIndex,
        outcome,
      });
    });
  });

  return {
    rootNodeId: nodes[0]?.id ?? null,
    nodes,
    choices,
  };
}
