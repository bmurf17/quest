import { describe, expect, it } from "vitest";
import { planQuickDialogue, type QuickDialogueLineInput } from "@/lib/quickDialogue";

function ids() {
  let index = 0;
  return () => `id-${++index}`;
}

const line = (text: string, choices: QuickDialogueLineInput["choices"] = []) => ({
  text,
  choices,
});

describe("planQuickDialogue", () => {
  it("chains plain lines with automatic Continue choices", () => {
    const plan = planQuickDialogue([line("Hello"), line("Goodbye")], ids());

    expect(plan.rootNodeId).toBe("id-1");
    expect(plan.nodes).toEqual([
      { id: "id-1", text: "Hello", isEndpoint: false, sortOrder: 0 },
      { id: "id-2", text: "Goodbye", isEndpoint: true, sortOrder: 1 },
    ]);
    expect(plan.choices).toEqual([
      {
        id: "id-3",
        nodeId: "id-1",
        text: "Continue",
        nextNodeId: "id-2",
        sortOrder: 0,
        outcome: null,
      },
    ]);
  });

  it("uses explicit choices and attaches their outcomes", () => {
    const plan = planQuickDialogue(
      [
        line("Will you help?", [
          { text: "Yes", outcomeType: "quest_start", outcomeValue: "lost-cat" },
          { text: "No", outcomeType: "end_conversation" },
        ]),
        line("Thank you."),
      ],
      ids(),
    );

    expect(plan.choices).toHaveLength(2);
    expect(plan.choices[0]).toMatchObject({
      nodeId: "id-1",
      text: "Yes",
      nextNodeId: "id-2",
      outcome: { type: "quest_start", value: "lost-cat" },
    });
    expect(plan.choices[1]).toMatchObject({
      text: "No",
      nextNodeId: null,
      outcome: { type: "end_conversation" },
    });
  });

  it("drops blank lines and blank choices", () => {
    const plan = planQuickDialogue(
      [line("   "), line("  First  "), line("Second", [{ text: "   " }, { text: "  Pick me  " }])],
      ids(),
    );

    expect(plan.nodes.map((node) => node.text)).toEqual(["First", "Second"]);
    expect(plan.choices.map((choice) => choice.text)).toEqual(["Continue", "Pick me"]);
    expect(plan.choices[1]).toMatchObject({
      text: "Pick me",
      nextNodeId: null,
      outcome: null,
    });
  });

  it("returns an empty plan when there is no text", () => {
    const plan = planQuickDialogue([line(" ")], ids());

    expect(plan.rootNodeId).toBeNull();
    expect(plan.nodes).toEqual([]);
    expect(plan.choices).toEqual([]);
  });
});
