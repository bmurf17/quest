import type { AdminDialogueNode } from "@/queries/AdminDialogueQueries";

export function dialogueNodeLabel(node: AdminDialogueNode, rootNodeId: string): string {
  const text = node.npc_text.trim().replace(/\s+/g, " ");
  const snippet = text.length > 42 ? `${text.slice(0, 42)}…` : text || "Empty node";
  return `${node.id === rootNodeId ? "★ " : ""}${snippet}`;
}
