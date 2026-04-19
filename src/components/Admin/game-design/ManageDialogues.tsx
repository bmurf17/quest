import { useEffect, useState } from "react";
import { supabase } from "@/queries/RoomQueries";
import { colors, fonts } from "@/theme";

interface NPC {
  id: number;
  name: string;
  npc_type: string;
}

interface DialogueNode {
  id: string;
  dialogue_id: string;
  npc_text: string;
  speaker: string;
  is_endpoint: boolean;
}

interface DialogueChoice {
  id: string;
  node_id: string;
  choice_text: string;
  next_node_id: string | null;
  required_skill: string | null;
  skill_check_dc: number | null;
}

export default function ManageDialogues() {
  const [npcs, setNpcs] = useState<NPC[]>([]);
  const [selectedNpc, setSelectedNpc] = useState<NPC | null>(null);
  const [nodes, setNodes] = useState<Map<string, DialogueNode>>(new Map());
  const [choices, setChoices] = useState<Map<string, DialogueChoice[]>>(new Map());
  const [editingNode, setEditingNode] = useState<DialogueNode | null>(null);

  useEffect(() => {
    loadNpcs();
  }, []);

  async function loadNpcs() {
    const { data } = await supabase.from("npcs").select("id, name, npc_type");
    if (data) setNpcs(data);
  }

  async function loadDialogueTree(npcId: number) {
    const { data: treeData } = await supabase
      .from("npc_dialogues")
      .select("*")
      .eq("npc_id", npcId)
      .limit(1);

    if (treeData && treeData.length > 0) {
      const tree = treeData[0];

      const { data: nodeData } = await supabase
        .from("dialogue_nodes")
        .select("*")
        .eq("dialogue_id", tree.id);

      if (nodeData) {
        const nodeMap = new Map<string, DialogueNode>();
        nodeData.forEach((n) => nodeMap.set(n.id, n));
        setNodes(nodeMap);

        const { data: choiceData } = await supabase
          .from("dialogue_choices")
          .select("*")
          .in("node_id", nodeData.map((n) => n.id));

        const choiceMap = new Map<string, DialogueChoice[]>();
        choiceData?.forEach((c) => {
          const existing = choiceMap.get(c.node_id) || [];
          existing.push(c);
          choiceMap.set(c.node_id, existing);
        });
        setChoices(choiceMap);

        if (tree.root_node_id) {
          const root = nodeMap.get(tree.root_node_id);
          if (root) setEditingNode(root);
        }
      }
    } else {
      setNodes(new Map());
      setChoices(new Map());
    }
  }

  async function selectNpc(npc: NPC) {
    setSelectedNpc(npc);
    await loadDialogueTree(npc.id);
  }

  async function createNewDialogue() {
    if (!selectedNpc) return;

    const rootNodeId = crypto.randomUUID();
    const dialogueId = crypto.randomUUID();

    await supabase.from("dialogue_nodes").insert({
      id: rootNodeId,
      dialogue_id: dialogueId,
      npc_text: "Hello!",
      speaker: "NPC",
      is_endpoint: false,
    });

    await supabase.from("npc_dialogues").insert({
      id: dialogueId,
      npc_id: selectedNpc.id,
      root_node_id: rootNodeId,
      name: `${selectedNpc.name} Dialogue`,
    });

    await loadDialogueTree(selectedNpc.id);
  }

  async function addChoice() {
    if (!editingNode) return;

    await supabase.from("dialogue_choices").insert({
      id: crypto.randomUUID(),
      node_id: editingNode.id,
      choice_text: "New choice...",
    });

    await loadDialogueTree(selectedNpc!.id);
  }

  async function updateNodeText(text: string) {
    if (!editingNode) return;

    await supabase
      .from("dialogue_nodes")
      .update({ npc_text: text })
      .eq("id", editingNode.id);

    setEditingNode({ ...editingNode, npc_text: text });
    const newNodes = new Map(nodes);
    newNodes.set(editingNode.id, { ...editingNode, npc_text: text });
    setNodes(newNodes);
  }

  async function updateChoiceText(choiceId: string, text: string) {
    const currentNode = editingNode;
    if (!currentNode) return;

    await supabase
      .from("dialogue_choices")
      .update({ choice_text: text })
      .eq("id", choiceId);

    const newChoices = new Map(choices);
    const nodeChoices = newChoices.get(currentNode.id) || [];
    const idx = nodeChoices.findIndex((c) => c.id === choiceId);
    if (idx >= 0) {
      nodeChoices[idx] = { ...nodeChoices[idx], choice_text: text };
      newChoices.set(currentNode.id, nodeChoices);
      setChoices(newChoices);
    }
  }

  return (
    <main style={{
      minHeight: "100vh",
      background: "linear-gradient(160deg, #0d0b07 0%, #1a1209 50%, #0f0e09 100%)",
      padding: "24px 32px",
      fontFamily: fonts.body,
    }}>
      <div style={{ maxWidth: 900, margin: "0 auto" }}>
        <div style={{ marginBottom: 24, display: "flex", alignItems: "center", gap: 16 }}>
          <a href="/admin/game-design" style={{ color: colors.gold, textDecoration: "none" }}>
            ← Back
          </a>
          <div style={{ flex: 1 }} />
        </div>

        <h1 style={{ fontSize: 24, fontWeight: 700, color: colors.text, marginBottom: 24 }}>
          Dialogue Trees
        </h1>

        <div style={{ display: "grid", gridTemplateColumns: "280px 1fr", gap: 24 }}>
          <div>
            <div style={{ 
              background: "rgba(255,255,255,0.03)", 
              border: "1px solid rgba(212,175,55,0.2)",
              borderRadius: 8,
              padding: 12,
            }}>
              <div style={{ fontSize: 12, color: colors.gold, marginBottom: 12, textTransform: "uppercase", letterSpacing: "0.1em" }}>
                Select NPC
              </div>
              {npcs.map((npc) => (
                <button
                  key={npc.id}
                  onClick={() => selectNpc(npc)}
                  style={{
                    width: "100%",
                    padding: "10px 12px",
                    marginBottom: 4,
                    background: selectedNpc?.id === npc.id ? colors.gold + "22" : "transparent",
                    border: `1px solid ${selectedNpc?.id === npc.id ? colors.gold : "transparent"}`,
                    borderRadius: 6,
                    color: colors.text,
                    cursor: "pointer",
                    textAlign: "left",
                  }}
                >
                  {npc.name}
                </button>
              ))}
            </div>

            {selectedNpc && (
              <button
                onClick={createNewDialogue}
                style={{
                  width: "100%",
                  marginTop: 12,
                  padding: "12px",
                  background: "transparent",
                  border: `1px dashed ${colors.gold}55`,
                  borderRadius: 8,
                  color: colors.gold,
                  cursor: "pointer",
                }}
              >
                + Create New Dialogue Tree
              </button>
            )}
          </div>

          <div>
            {selectedNpc && editingNode && (
              <div style={{
                background: "rgba(255,255,255,0.03)",
                border: "1px solid rgba(212,175,55,0.2)",
                borderRadius: 8,
                padding: 20,
              }}>
                <div style={{ marginBottom: 16 }}>
                  <label style={{ display: "block", fontSize: 11, color: colors.gold, marginBottom: 6, textTransform: "uppercase" }}>
                    NPC Says
                  </label>
                  <textarea
                    value={editingNode.npc_text}
                    onChange={(e) => updateNodeText(e.target.value)}
                    style={{
                      width: "100%",
                      minHeight: 80,
                      padding: 12,
                      background: "rgba(0,0,0,0.3)",
                      border: "1px solid rgba(212,175,55,0.3)",
                      borderRadius: 6,
                      color: colors.text,
                      fontSize: 14,
                      fontFamily: fonts.body,
                      resize: "vertical",
                    }}
                  />
                </div>

                <div style={{ marginBottom: 16 }}>
                  <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 8 }}>
                    <label style={{ fontSize: 11, color: colors.gold, textTransform: "uppercase" }}>
                      Player Choices
                    </label>
                    <button
                      onClick={addChoice}
                      style={{
                        padding: "4px 10px",
                        fontSize: 12,
                        background: "transparent",
                        border: `1px solid ${colors.gold}55`,
                        borderRadius: 4,
                        color: colors.gold,
                        cursor: "pointer",
                      }}
                    >
                      + Add Choice
                    </button>
                  </div>

                  {(choices.get(editingNode.id) || []).map((choice) => (
                    <div key={choice.id} style={{ marginBottom: 12, padding: 12, background: "rgba(0,0,0,0.2)", borderRadius: 6 }}>
                      <input
                        value={choice.choice_text}
                        onChange={(e) => updateChoiceText(choice.id, e.target.value)}
                        style={{
                          width: "100%",
                          padding: "8px 10px",
                          background: "rgba(0,0,0,0.3)",
                          border: "1px solid rgba(255,255,255,0.1)",
                          borderRadius: 4,
                          color: colors.text,
                          fontSize: 13,
                        }}
                      />
                      {choice.required_skill && (
                        <div style={{ marginTop: 8, fontSize: 12, color: "#8B5CF6" }}>
                          Skill check: {choice.required_skill} DC{choice.skill_check_dc}
                        </div>
                      )}
                    </div>
                  ))}
                </div>

                {editingNode && choices.get(editingNode.id)?.length === 0 && (
                  <button
                    onClick={addChoice}
                    style={{
                      width: "100%",
                      padding: "12px",
                      background: "transparent",
                      border: `1px dashed ${colors.gold}55`,
                      borderRadius: 6,
                      color: colors.muted,
                      cursor: "pointer",
                    }}
                  >
                    + Add a choice for this dialogue
                  </button>
                )}
              </div>
            )}

            {selectedNpc && !editingNode && (
              <div style={{ textAlign: "center", padding: 40, color: colors.muted }}>
                No dialogue tree yet. Create one to get started.
              </div>
            )}
          </div>
        </div>
      </div>
    </main>
  );
}