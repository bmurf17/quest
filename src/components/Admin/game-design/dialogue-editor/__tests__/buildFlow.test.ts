import { describe, expect, it } from "vitest";
import { buildFlow } from "@/components/Admin/game-design/dialogue-editor/buildFlow";
import type {
  AdminDialogueChoice,
  AdminDialogueGraph,
  AdminDialogueNode,
} from "@/queries/AdminDialogueQueries";

const node = (id: string, text = id): AdminDialogueNode => ({
  id,
  dialogue_id: "tree-1",
  npc_text: text,
  speaker: "NPC",
  is_endpoint: 0,
  sort_order: 0,
});

const choice = (overrides: Partial<AdminDialogueChoice> & { id: string }): AdminDialogueChoice => ({
  node_id: "root",
  choice_text: overrides.id,
  next_node_id: null,
  required_skill: null,
  skill_check_dc: null,
  success_node_id: null,
  failure_node_id: null,
  sort_order: 0,
  ...overrides,
});

const graph = ({
  nodes,
  choices,
}: {
  nodes: AdminDialogueNode[];
  choices: AdminDialogueChoice[];
}): AdminDialogueGraph => ({
  tree: {
    id: "tree-1",
    npc_id: 1,
    root_node_id: "root",
    name: "Test tree",
    default_outcome: null,
  },
  nodes,
  choices,
  outcomes: [],
});

describe("buildFlow", () => {
  it("walks branching choices breadth-first and tracks depth", () => {
    const flow = buildFlow(
      graph({
        nodes: [node("root"), node("a"), node("b"), node("c")],
        choices: [
          choice({ id: "to-a", next_node_id: "a" }),
          choice({ id: "to-b", next_node_id: "b" }),
          choice({ id: "a-to-c", node_id: "a", next_node_id: "c" }),
        ],
      }),
    );

    expect(flow.ordered.map(({ node: n, depth }) => [n.id, depth])).toEqual([
      ["root", 0],
      ["a", 1],
      ["b", 1],
      ["c", 2],
    ]);
    expect(flow.unreachable).toEqual([]);
  });

  it("follows both success and failure targets for skill checks", () => {
    const flow = buildFlow(
      graph({
        nodes: [node("root"), node("pass"), node("fail")],
        choices: [
          choice({
            id: "check",
            required_skill: "Persuasion",
            success_node_id: "pass",
            failure_node_id: "fail",
            next_node_id: "ignored",
          }),
        ],
      }),
    );

    expect(flow.ordered.map(({ node: n }) => n.id)).toEqual(["root", "pass", "fail"]);
  });

  it("lists nodes that cannot be reached from the root", () => {
    const flow = buildFlow(
      graph({
        nodes: [node("root"), node("linked"), node("orphan")],
        choices: [choice({ id: "to-linked", next_node_id: "linked" })],
      }),
    );

    expect(flow.ordered.map(({ node: n }) => n.id)).toEqual(["root", "linked"]);
    expect(flow.unreachable.map((n) => n.id)).toEqual(["orphan"]);
  });

  it("handles a missing root without throwing", () => {
    const flow = buildFlow(
      graph({
        nodes: [node("orphan")],
        choices: [],
      }),
    );

    expect(flow.ordered).toEqual([]);
    expect(flow.unreachable.map((n) => n.id)).toEqual(["orphan"]);
  });

  it("does not loop forever on cycles", () => {
    const flow = buildFlow(
      graph({
        nodes: [node("root"), node("a")],
        choices: [
          choice({ id: "to-a", next_node_id: "a" }),
          choice({ id: "back", node_id: "a", next_node_id: "root" }),
        ],
      }),
    );

    expect(flow.ordered.map(({ node: n }) => n.id)).toEqual(["root", "a"]);
  });
});
