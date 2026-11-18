import { supabase } from "@/lib/supabase";
import { planQuickDialogue, type QuickDialogueLineInput } from "@/lib/quickDialogue";
import { DialogueOutcomeType } from "@/types/RoomInteractions";

export interface AdminNpc {
  id: number;
  name: string;
  npc_type: string;
  dialogue: string[];
  discovery_message: string | null;
  img: string;
  disposition: string | null;
}

export interface AdminNpcSummary extends AdminNpc {
  dialogueTreeId: string | null;
  dialogueTreeName: string | null;
}

export type AdminNpcWrite = Partial<{
  name: string;
  npc_type: string;
  discovery_message: string | null;
  img: string;
}>;

export interface AdminDialogueTree {
  id: string;
  npc_id: number | null;
  root_node_id: string;
  name: string;
  default_outcome: string | null;
}

export interface AdminDialogueNode {
  id: string;
  dialogue_id: string | null;
  npc_text: string;
  speaker: string;
  is_endpoint: number;
  sort_order: number;
}

export interface AdminDialogueChoice {
  id: string;
  node_id: string | null;
  choice_text: string;
  next_node_id: string | null;
  required_skill: string | null;
  skill_check_dc: number | null;
  success_node_id: string | null;
  failure_node_id: string | null;
  sort_order: number;
}

export interface AdminDialogueOutcome {
  id: string;
  node_id: string | null;
  choice_id: string | null;
  outcome_type: string;
  outcome_value: string | null;
  flag_key: string | null;
  flag_value: string | null;
}

export interface AdminDialogueGraph {
  tree: AdminDialogueTree;
  nodes: AdminDialogueNode[];
  choices: AdminDialogueChoice[];
  outcomes: AdminDialogueOutcome[];
}

export async function getAdminNpcSummaries(): Promise<AdminNpcSummary[]> {
  const [npcResult, treeResult] = await Promise.all([
    supabase
      .from("npcs")
      .select("id, name, npc_type, dialogue, discovery_message, img, disposition")
      .order("name"),
    supabase.from("npc_dialogues").select("id, npc_id, name"),
  ]);

  if (npcResult.error) throw npcResult.error;
  if (treeResult.error) throw treeResult.error;

  const treeByNpc = new Map<number, { id: string; name: string }>();
  for (const tree of treeResult.data ?? []) {
    if (tree.npc_id !== null) treeByNpc.set(tree.npc_id, { id: tree.id, name: tree.name });
  }

  return (npcResult.data ?? []).map((npc) => ({
    ...npc,
    dialogueTreeId: treeByNpc.get(npc.id)?.id ?? null,
    dialogueTreeName: treeByNpc.get(npc.id)?.name ?? null,
  }));
}

/** Update the NPC row itself: name, type, discovery message, portrait, etc. */
export async function updateAdminNpc(npcId: number, values: AdminNpcWrite): Promise<void> {
  if (Object.keys(values).length === 0) return;
  const { error } = await supabase.from("npcs").update(values).eq("id", npcId);
  if (error) throw error;
}

export async function getDialogueGraph(npcId: number): Promise<AdminDialogueGraph | null> {
  const { data: treeRows, error: treeError } = await supabase
    .from("npc_dialogues")
    .select("*")
    .eq("npc_id", npcId)
    .limit(1);

  if (treeError) throw treeError;
  const tree = treeRows?.[0];
  if (!tree) return null;

  const { data: nodes, error: nodeError } = await supabase
    .from("dialogue_nodes")
    .select("*")
    .eq("dialogue_id", tree.id)
    .order("sort_order");

  if (nodeError) throw nodeError;

  const nodeIds = (nodes ?? []).map((node) => node.id);
  const choices =
    nodeIds.length > 0
      ? ((
          await supabase
            .from("dialogue_choices")
            .select("*")
            .in("node_id", nodeIds)
            .order("sort_order")
        ).data ?? [])
      : [];

  const choiceIds = choices.map((choice) => choice.id);
  const [nodeOutcomeResult, choiceOutcomeResult] = await Promise.all([
    nodeIds.length > 0
      ? supabase.from("dialogue_outcomes").select("*").in("node_id", nodeIds)
      : Promise.resolve({ data: [], error: null }),
    choiceIds.length > 0
      ? supabase.from("dialogue_outcomes").select("*").in("choice_id", choiceIds)
      : Promise.resolve({ data: [], error: null }),
  ]);

  if (nodeOutcomeResult.error) throw nodeOutcomeResult.error;
  if (choiceOutcomeResult.error) throw choiceOutcomeResult.error;

  const outcomesById = new Map<string, AdminDialogueOutcome>();
  for (const outcome of [...(nodeOutcomeResult.data ?? []), ...(choiceOutcomeResult.data ?? [])]) {
    outcomesById.set(outcome.id, outcome);
  }

  return {
    tree,
    nodes: nodes ?? [],
    choices,
    outcomes: [...outcomesById.values()],
  };
}

export async function createDialogueTree(npcId: number, name: string): Promise<AdminDialogueTree> {
  const dialogueId = crypto.randomUUID();
  const rootNodeId = crypto.randomUUID();

  const { data: tree, error: treeError } = await supabase
    .from("npc_dialogues")
    .insert({ id: dialogueId, npc_id: npcId, root_node_id: rootNodeId, name })
    .select()
    .single();

  if (treeError) throw treeError;

  const { error: nodeError } = await supabase.from("dialogue_nodes").insert({
    id: rootNodeId,
    dialogue_id: dialogueId,
    npc_text: "Hello, traveller.",
    speaker: "NPC",
    is_endpoint: 0,
    sort_order: 0,
  });

  if (nodeError) throw nodeError;

  return tree;
}

/**
 * Creates a complete linear dialogue tree from the compact room-creation
 * builder. The tree row is removed again if a child insert fails so a partial
 * conversation is never left behind.
 */
export async function createQuickDialogueTree(
  npcId: number,
  name: string,
  lines: QuickDialogueLineInput[],
): Promise<AdminDialogueTree> {
  const plan = planQuickDialogue(lines);
  if (!plan.rootNodeId) {
    throw new Error("Add at least one dialogue line before creating the tree.");
  }

  const dialogueId = crypto.randomUUID();

  const { data: tree, error: treeError } = await supabase
    .from("npc_dialogues")
    .insert({
      id: dialogueId,
      npc_id: npcId,
      root_node_id: plan.rootNodeId,
      name,
    })
    .select()
    .single();

  if (treeError) throw treeError;

  try {
    const { error: nodeError } = await supabase.from("dialogue_nodes").insert(
      plan.nodes.map((node) => ({
        id: node.id,
        dialogue_id: dialogueId,
        npc_text: node.text,
        speaker: "NPC",
        is_endpoint: node.isEndpoint ? 1 : 0,
        sort_order: node.sortOrder,
      })),
    );

    if (nodeError) throw nodeError;

    if (plan.choices.length > 0) {
      const { error: choiceError } = await supabase.from("dialogue_choices").insert(
        plan.choices.map((choice) => ({
          id: choice.id,
          node_id: choice.nodeId,
          choice_text: choice.text,
          next_node_id: choice.nextNodeId,
          sort_order: choice.sortOrder,
        })),
      );

      if (choiceError) throw choiceError;
    }

    const outcomes = plan.choices
      .filter((choice) => choice.outcome !== null)
      .map((choice) => ({
        id: crypto.randomUUID(),
        choice_id: choice.id,
        outcome_type: choice.outcome!.type,
        outcome_value: choice.outcome!.value ?? null,
        flag_key: choice.outcome!.flagKey ?? null,
        flag_value: choice.outcome!.flagValue ?? null,
      }));

    if (outcomes.length > 0) {
      const { error: outcomeError } = await supabase.from("dialogue_outcomes").insert(outcomes);

      if (outcomeError) throw outcomeError;
    }
  } catch (err) {
    await supabase.from("npc_dialogues").delete().eq("id", dialogueId);
    throw err;
  }

  return tree;
}

export async function updateDialogueTree(
  dialogueId: string,
  values: { name?: string; default_outcome?: string | null },
): Promise<void> {
  const { error } = await supabase.from("npc_dialogues").update(values).eq("id", dialogueId);
  if (error) throw error;
}

export async function updateDialogueNode(
  nodeId: string,
  values: Partial<Pick<AdminDialogueNode, "npc_text" | "speaker" | "is_endpoint" | "sort_order">>,
): Promise<void> {
  const { error } = await supabase.from("dialogue_nodes").update(values).eq("id", nodeId);
  if (error) throw error;
}

export async function createDialogueNode(
  dialogueId: string,
  values: { text: string; isEndpoint?: boolean },
): Promise<AdminDialogueNode> {
  const { data, error } = await supabase
    .from("dialogue_nodes")
    .insert({
      id: crypto.randomUUID(),
      dialogue_id: dialogueId,
      npc_text: values.text,
      speaker: "NPC",
      is_endpoint: values.isEndpoint ? 1 : 0,
    })
    .select()
    .single();

  if (error) throw error;
  return data;
}

export async function deleteDialogueNode(nodeId: string): Promise<void> {
  const { error } = await supabase.from("dialogue_nodes").delete().eq("id", nodeId);
  if (error) throw error;
}

async function nextChoiceOrder(nodeId: string): Promise<number> {
  const { data, error } = await supabase
    .from("dialogue_choices")
    .select("sort_order")
    .eq("node_id", nodeId)
    .order("sort_order", { ascending: false })
    .limit(1);

  if (error) throw error;
  return (data?.[0]?.sort_order ?? -1) + 1;
}

export async function createDialogueChoice(
  nodeId: string,
  text: string,
): Promise<AdminDialogueChoice> {
  const sortOrder = await nextChoiceOrder(nodeId);

  const { data, error } = await supabase
    .from("dialogue_choices")
    .insert({
      id: crypto.randomUUID(),
      node_id: nodeId,
      choice_text: text,
      sort_order: sortOrder,
    })
    .select()
    .single();

  if (error) throw error;
  return data;
}

export async function updateDialogueChoice(
  choiceId: string,
  values: Partial<
    Pick<
      AdminDialogueChoice,
      | "choice_text"
      | "next_node_id"
      | "required_skill"
      | "skill_check_dc"
      | "success_node_id"
      | "failure_node_id"
      | "sort_order"
    >
  >,
): Promise<void> {
  const { error } = await supabase.from("dialogue_choices").update(values).eq("id", choiceId);
  if (error) throw error;
}

export async function deleteDialogueChoice(choiceId: string): Promise<void> {
  const { error } = await supabase.from("dialogue_choices").delete().eq("id", choiceId);
  if (error) throw error;
}

export interface ChoiceOutcomeInput {
  type: DialogueOutcomeType;
  value?: string;
  flagKey?: string;
  flagValue?: string;
}

/** Replaces the outcome attached to a choice (one per choice). */
export async function setChoiceOutcome(
  choiceId: string,
  outcome: ChoiceOutcomeInput | null,
): Promise<void> {
  const { error: deleteError } = await supabase
    .from("dialogue_outcomes")
    .delete()
    .eq("choice_id", choiceId);

  if (deleteError) throw deleteError;
  if (!outcome || outcome.type === DialogueOutcomeType.NONE) return;

  const { error } = await supabase.from("dialogue_outcomes").insert({
    id: crypto.randomUUID(),
    choice_id: choiceId,
    outcome_type: outcome.type,
    outcome_value: outcome.value?.trim() || null,
    flag_key: outcome.flagKey?.trim() || null,
    flag_value: outcome.flagValue?.trim() || null,
  });

  if (error) throw error;
}
