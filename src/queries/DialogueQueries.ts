import { createClient } from "@supabase/supabase-js";
import {
  DialogueChoice,
  DialogueNode,
  DialogueOutcome,
  DialogueOutcomeType,
} from "@/types/RoomInteractions";

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

interface OutcomeRow {
  id: string;
  node_id: string;
  choice_id: string | null;
  outcome_type: string;
  outcome_value: string | null;
  flag_key: string | null;
  flag_value: string | null;
}

export async function getDialogueForNPC(npcId: number): Promise<DialogueNode | null> {
  const { data: dialogueData, error: dialogueError } = await supabase
    .from("npc_dialogues")
    .select("id, root_node_id, name")
    .eq("npc_id", npcId)
    .limit(1);

  if (dialogueError || !dialogueData || dialogueData.length === 0) {
    return null;
  }

  const dialogue = dialogueData[0];
  return getDialogueNode(dialogue.root_node_id);
}

export async function getDialogueNode(nodeId: string): Promise<DialogueNode | null> {
  const { data: nodeData, error: nodeError } = await supabase
    .from("dialogue_nodes")
    .select("*")
    .eq("id", nodeId)
    .limit(1);

  if (nodeError || !nodeData || nodeData.length === 0) {
    return null;
  }

  const node = nodeData[0];

  const choices = await getChoicesForNode(node.id);
  const outcomes = await getOutcomesForNode(node.id);

  let outcome: DialogueOutcome | undefined;
  if (outcomes.length > 0) {
    const o = outcomes[0];
    outcome = {
      type: o.outcome_type as DialogueOutcomeType,
      value: o.outcome_value || undefined,
      flagKey: o.flag_key || undefined,
      flagValue: o.flag_value || undefined,
    };
  }

  return {
    id: node.id,
    text: node.npc_text,
    speaker: node.speaker as "NPC",
    choices: choices.length > 0 ? choices : undefined,
    outcome,
    isEndpoint: node.is_endpoint === 1,
  };
}

async function getChoicesForNode(nodeId: string): Promise<DialogueChoice[]> {
  const { data: choicesData, error } = await supabase
    .from("dialogue_choices")
    .select("*")
    .eq("node_id", nodeId)
    .order("sort_order");

  if (error || !choicesData) {
    return [];
  }

  const choices: DialogueChoice[] = [];

  for (const choice of choicesData) {
    let skillCondition;
    if (choice.required_skill) {
      skillCondition = {
        skill: choice.required_skill,
        dc: choice.skill_check_dc || 10,
        successNodeId: choice.success_node_id || undefined,
        failureNodeId: choice.failure_node_id || undefined,
      };
    }

    // Fetch outcome for this choice
    let outcome: DialogueOutcome | undefined;
    const { data: outcomeData } = await supabase
      .from("dialogue_outcomes")
      .select("*")
      .eq("choice_id", choice.id)
      .limit(1);

    if (outcomeData && outcomeData.length > 0) {
      const o = outcomeData[0];
      outcome = {
        type: o.outcome_type as DialogueOutcomeType,
        value: o.outcome_value || undefined,
        flagKey: o.flag_key || undefined,
        flagValue: o.flag_value || undefined,
      };
    }

    choices.push({
      id: choice.id,
      text: choice.choice_text,
      nextNodeId: choice.next_node_id,
      skillCondition,
      outcome,
    });
  }

  return choices;
}

async function getOutcomesForNode(nodeId: string): Promise<OutcomeRow[]> {
  const { data, error } = await supabase
    .from("dialogue_outcomes")
    .select("*")
    .eq("node_id", nodeId);

  if (error || !data) {
    return [];
  }

  return data;
}

export async function getNPCDisposition(npcId: number): Promise<string> {
  const { data, error } = await supabase
    .from("npcs")
    .select("disposition")
    .eq("id", npcId)
    .limit(1);

  if (error || !data || data.length === 0) {
    return "neutral";
  }

  return data[0].disposition || "neutral";
}

export async function setNPCDisposition(
  npcId: number,
  disposition: string
): Promise<void> {
  await supabase
    .from("npcs")
    .update({ disposition })
    .eq("id", npcId);
}