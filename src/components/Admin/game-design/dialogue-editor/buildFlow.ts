import type {
  AdminDialogueChoice,
  AdminDialogueGraph,
  AdminDialogueNode,
} from "@/queries/AdminDialogueQueries";

export interface FlowEntry {
  node: AdminDialogueNode;
  depth: number;
}

export interface DialogueFlow {
  ordered: FlowEntry[];
  unreachable: AdminDialogueNode[];
}

/**
 * Breadth-first walk of the choice graph, starting at the tree root.
 *
 * A choice with a skill check branches into its success and failure targets;
 * otherwise it follows `next_node_id`. Nodes that cannot be reached from the
 * root are returned separately so the editor can flag orphaned content.
 */
export function buildFlow(graph: AdminDialogueGraph): DialogueFlow {
  const byId = new Map(graph.nodes.map((node) => [node.id, node]));
  const choicesByNode = new Map<string, AdminDialogueChoice[]>();
  for (const choice of graph.choices) {
    if (!choice.node_id) continue;
    const list = choicesByNode.get(choice.node_id) ?? [];
    list.push(choice);
    choicesByNode.set(choice.node_id, list);
  }

  const seen = new Set<string>();
  const queue: FlowEntry[] = [];
  const root = byId.get(graph.tree.root_node_id);
  if (root) queue.push({ node: root, depth: 0 });

  const ordered: FlowEntry[] = [];

  while (queue.length > 0) {
    const entry = queue.shift()!;
    if (seen.has(entry.node.id)) continue;
    seen.add(entry.node.id);
    ordered.push(entry);

    for (const choice of choicesByNode.get(entry.node.id) ?? []) {
      const targets = choice.required_skill
        ? [choice.success_node_id, choice.failure_node_id]
        : [choice.next_node_id];
      for (const targetId of targets) {
        if (!targetId || seen.has(targetId)) continue;
        const node = byId.get(targetId);
        if (node) queue.push({ node, depth: entry.depth + 1 });
      }
    }
  }

  return {
    ordered,
    unreachable: graph.nodes.filter((node) => !seen.has(node.id)),
  };
}
