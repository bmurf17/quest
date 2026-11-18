import { useEffect, useMemo, useRef, useState } from "react";
import type { MutableRefObject } from "react";
import { useSearchParams } from "react-router-dom";
import { ImageIcon } from "lucide-react";
import { colors, fonts } from "@/theme";
import { resolveEntityImage } from "@/lib/entityImages";
import { Toast } from "./create-room/Toast";
import { DialogueNodeEditor } from "./dialogue-editor/DialogueNodeEditor";
import { buildFlow } from "./dialogue-editor/buildFlow";
import { dialogueNodeLabel } from "./dialogue-editor/nodeLabels";
import { AdminPageHeader } from "@/components/Admin/ui/AdminPrimitives";
import { AdminImageField } from "@/components/Admin/ui/AdminImageField";
import {
  createDialogueChoice,
  createDialogueNode,
  createDialogueTree,
  deleteDialogueChoice,
  deleteDialogueNode,
  getAdminNpcSummaries,
  getDialogueGraph,
  setChoiceOutcome,
  updateDialogueChoice,
  updateDialogueNode,
  updateDialogueTree,
  updateAdminNpc,
  type AdminDialogueChoice,
  type AdminDialogueGraph,
  type AdminDialogueNode,
  type AdminNpcSummary,
  type AdminNpcWrite,
  type ChoiceOutcomeInput,
} from "@/queries/AdminDialogueQueries";
import { DialogueOutcomeType } from "@/types/RoomInteractions";
import type { CSSProperties } from "react";

type ToastState = { type: "success" | "error"; message: string } | null;
type SaveState = "idle" | "saving" | "saved" | "error";

const errorMessage = (err: unknown) =>
  err instanceof Error ? err.message : "Something went wrong.";

export default function ManageDialogues() {
  const [searchParams, setSearchParams] = useSearchParams();
  const [npcs, setNpcs] = useState<AdminNpcSummary[]>([]);
  const [selectedNpcId, setSelectedNpcId] = useState<number | null>(() => {
    const raw = searchParams.get("npc");
    const id = Number(raw);
    return raw && Number.isFinite(id) && id > 0 ? id : null;
  });
  const [graph, setGraph] = useState<AdminDialogueGraph | null>(null);
  const [selectedNodeId, setSelectedNodeId] = useState<string | null>(null);
  const [query, setQuery] = useState("");
  const [isLoadingNpcs, setIsLoadingNpcs] = useState(true);
  const [isLoadingGraph, setIsLoadingGraph] = useState(false);
  const [isBusy, setIsBusy] = useState(false);
  const [saveState, setSaveState] = useState<SaveState>("idle");
  const [toast, setToast] = useState<ToastState>(null);

  const saveTimers = useRef(new Map<string, { timer: number; action: () => Promise<void> }>());
  const pendingSaveCount = useRef(0);
  const idleResetTimer = useRef<number | null>(null);
  const pendingNodes = useRef(new Map<string, Partial<AdminDialogueNode>>());
  const pendingNpcEdits = useRef(new Map<string, AdminNpcWrite>());
  const pendingChoices = useRef(new Map<string, Partial<AdminDialogueChoice>>());
  const pendingOutcomes = useRef(new Map<string, ChoiceOutcomeInput>());

  useEffect(() => {
    let cancelled = false;

    void (async () => {
      setIsLoadingNpcs(true);
      try {
        const data = await getAdminNpcSummaries();
        if (cancelled) return;
        setNpcs(data);
        setSelectedNpcId((current) =>
          data.some((npc) => npc.id === current) ? current : (data[0]?.id ?? null),
        );
      } catch (err) {
        if (!cancelled) showToast("error", errorMessage(err));
      } finally {
        if (!cancelled) setIsLoadingNpcs(false);
      }
    })();

    return () => {
      cancelled = true;
    };
    // Load the NPC index once; selection changes are handled by the effect below.
  }, []);

  useEffect(() => {
    const current = searchParams.get("npc");
    if ((selectedNpcId === null && current === null) || current === String(selectedNpcId)) return;

    const next = new URLSearchParams(searchParams);
    if (selectedNpcId !== null) next.set("npc", String(selectedNpcId));
    else next.delete("npc");
    setSearchParams(next, { replace: true });
  }, [selectedNpcId, searchParams, setSearchParams]);

  useEffect(() => {
    if (selectedNpcId === null) {
      setGraph(null);
      setSelectedNodeId(null);
      return;
    }

    let cancelled = false;
    setIsLoadingGraph(true);
    void getDialogueGraph(selectedNpcId)
      .then((next) => {
        if (cancelled) return;
        setGraph(next);
        setSelectedNodeId(next?.tree.root_node_id ?? null);
      })
      .catch((err) => {
        if (!cancelled) showToast("error", errorMessage(err));
      })
      .finally(() => {
        if (!cancelled) setIsLoadingGraph(false);
      });

    return () => {
      cancelled = true;
    };
  }, [selectedNpcId]);

  const filteredNpcs = useMemo(() => {
    const needle = query.trim().toLowerCase();
    if (!needle) return npcs;
    return npcs.filter(
      (npc) =>
        npc.name.toLowerCase().includes(needle) || npc.npc_type.toLowerCase().includes(needle),
    );
  }, [npcs, query]);

  const flow = useMemo(
    () => (graph ? buildFlow(graph) : { ordered: [], unreachable: [] }),
    [graph],
  );

  const selectedNpc = npcs.find((npc) => npc.id === selectedNpcId) ?? null;
  const selectedNode = graph?.nodes.find((node) => node.id === selectedNodeId) ?? null;

  function showToast(type: "success" | "error", message: string) {
    setToast({ type, message });
    window.setTimeout(() => setToast(null), 4000);
  }

  function settleSave(error?: unknown) {
    pendingSaveCount.current = Math.max(0, pendingSaveCount.current - 1);
    if (error) {
      setSaveState("error");
      showToast("error", errorMessage(error));
      return;
    }
    if (pendingSaveCount.current === 0) {
      setSaveState("saved");
      if (idleResetTimer.current) window.clearTimeout(idleResetTimer.current);
      idleResetTimer.current = window.setTimeout(() => setSaveState("idle"), 2000);
    }
  }

  function scheduleSave(key: string, action: () => Promise<void>) {
    const existing = saveTimers.current.get(key);
    if (existing) {
      window.clearTimeout(existing.timer);
    } else {
      pendingSaveCount.current += 1;
    }

    setSaveState("saving");
    if (idleResetTimer.current) {
      window.clearTimeout(idleResetTimer.current);
      idleResetTimer.current = null;
    }

    const timer = window.setTimeout(() => {
      const entry = saveTimers.current.get(key);
      if (!entry) return;
      saveTimers.current.delete(key);
      void entry
        .action()
        .then(() => settleSave())
        .catch((err) => settleSave(err));
    }, 500);
    saveTimers.current.set(key, { timer, action });
  }

  // Flush any debounced edits when leaving the page so nothing is lost.
  useEffect(() => {
    const timers = saveTimers.current;
    return () => {
      for (const { timer, action } of timers.values()) {
        window.clearTimeout(timer);
        void action().catch(() => undefined);
      }
      timers.clear();
      if (idleResetTimer.current) window.clearTimeout(idleResetTimer.current);
    };
  }, []);

  function queueSave<T extends object>(
    pending: MutableRefObject<Map<string, T>>,
    key: string,
    patch: Partial<T>,
    save: (values: T) => Promise<void>,
  ) {
    const merged = { ...(pending.current.get(key) ?? {}), ...patch } as T;
    pending.current.set(key, merged);

    scheduleSave(key, async () => {
      const values = pending.current.get(key);
      pending.current.delete(key);
      if (values) await save(values);
    });
  }

  async function reloadGraph(npcId: number, nextNodeId?: string) {
    const next = await getDialogueGraph(npcId);
    setGraph(next);
    setNpcs((current) =>
      current.map((npc) =>
        npc.id === npcId
          ? {
              ...npc,
              dialogueTreeId: next?.tree.id ?? null,
              dialogueTreeName: next?.tree.name ?? null,
            }
          : npc,
      ),
    );
    setSelectedNodeId((current) => {
      if (!next) return null;
      if (nextNodeId && next.nodes.some((node) => node.id === nextNodeId)) return nextNodeId;
      if (current && next.nodes.some((node) => node.id === current)) return current;
      return next.tree.root_node_id;
    });
  }

  function handleUpdateNpc(values: AdminNpcWrite) {
    if (!selectedNpcId) return;
    setNpcs((current) =>
      current.map((npc) => (npc.id === selectedNpcId ? { ...npc, ...values } : npc)),
    );
    queueSave(pendingNpcEdits, `npc:${selectedNpcId}`, values, (merged) =>
      updateAdminNpc(selectedNpcId, merged),
    );
  }

  function handleUpdateNode(
    nodeId: string,
    values: Partial<Pick<AdminDialogueNode, "npc_text" | "speaker" | "is_endpoint">>,
  ) {
    setGraph((current) =>
      current
        ? {
            ...current,
            nodes: current.nodes.map((node) =>
              node.id === nodeId ? { ...node, ...values } : node,
            ),
          }
        : current,
    );

    if (values.is_endpoint !== undefined) {
      const { is_endpoint, ...textValues } = values;
      if (Object.keys(textValues).length > 0) {
        queueSave(pendingNodes, nodeId, textValues, (merged) => updateDialogueNode(nodeId, merged));
      }
      void updateDialogueNode(nodeId, { is_endpoint }).catch((err) => {
        showToast("error", errorMessage(err));
      });
      return;
    }

    queueSave(pendingNodes, nodeId, values, (merged) => updateDialogueNode(nodeId, merged));
  }

  function handleUpdateChoice(choiceId: string, values: Partial<AdminDialogueChoice>) {
    setGraph((current) =>
      current
        ? {
            ...current,
            choices: current.choices.map((choice) =>
              choice.id === choiceId ? { ...choice, ...values } : choice,
            ),
          }
        : current,
    );

    const { choice_text, ...immediate } = values;
    if (choice_text !== undefined) {
      queueSave(pendingChoices, choiceId, { choice_text }, (merged) =>
        updateDialogueChoice(choiceId, merged),
      );
    }

    if (Object.keys(immediate).length > 0) {
      void updateDialogueChoice(choiceId, immediate).catch((err) => {
        showToast("error", errorMessage(err));
      });
    }
  }

  function handleUpdateChoiceOutcome(choiceId: string, outcome: ChoiceOutcomeInput) {
    setGraph((current) => {
      if (!current) return current;
      const others = current.outcomes.filter((entry) => entry.choice_id !== choiceId);
      if (outcome.type === DialogueOutcomeType.NONE) {
        return { ...current, outcomes: others };
      }
      return {
        ...current,
        outcomes: [
          ...others,
          {
            id: `local-${choiceId}`,
            node_id: null,
            choice_id: choiceId,
            outcome_type: outcome.type,
            outcome_value: outcome.value?.trim() || null,
            flag_key: outcome.flagKey?.trim() || null,
            flag_value: outcome.flagValue?.trim() || null,
          },
        ],
      };
    });

    queueSave(pendingOutcomes, choiceId, outcome, (merged) => setChoiceOutcome(choiceId, merged));
  }

  async function handleCreateTree() {
    if (!selectedNpc || !selectedNpcId) return;
    setIsBusy(true);
    try {
      await createDialogueTree(selectedNpcId, `${selectedNpc.name} Dialogue`);
      await reloadGraph(selectedNpcId);
      showToast("success", "Dialogue tree created.");
    } catch (err) {
      showToast("error", errorMessage(err));
    } finally {
      setIsBusy(false);
    }
  }

  async function handleAddNode() {
    if (!graph || !selectedNpcId) return;
    setIsBusy(true);
    try {
      const node = await createDialogueNode(graph.tree.id, { text: "New dialogue line…" });
      await reloadGraph(selectedNpcId, node.id);
      showToast("success", "Node added.");
    } catch (err) {
      showToast("error", errorMessage(err));
    } finally {
      setIsBusy(false);
    }
  }

  async function handleDeleteNode(node: AdminDialogueNode) {
    if (!selectedNpcId || graph?.tree.root_node_id === node.id) return;
    if (!window.confirm("Delete this node? Any choices pointing to it will become dead ends.")) {
      return;
    }

    setIsBusy(true);
    try {
      await deleteDialogueNode(node.id);
      await reloadGraph(selectedNpcId, graph?.tree.root_node_id);
      showToast("success", "Node deleted.");
    } catch (err) {
      showToast("error", errorMessage(err));
    } finally {
      setIsBusy(false);
    }
  }

  async function handleAddChoice(nodeId: string) {
    setIsBusy(true);
    try {
      await createDialogueChoice(nodeId, "New choice…");
      if (selectedNpcId) await reloadGraph(selectedNpcId, nodeId);
      showToast("success", "Choice added.");
    } catch (err) {
      showToast("error", errorMessage(err));
    } finally {
      setIsBusy(false);
    }
  }

  async function handleDeleteChoice(choice: AdminDialogueChoice) {
    if (!window.confirm("Delete this choice?")) return;
    setIsBusy(true);
    try {
      await deleteDialogueChoice(choice.id);
      if (selectedNpcId) await reloadGraph(selectedNpcId, choice.node_id ?? undefined);
      showToast("success", "Choice deleted.");
    } catch (err) {
      showToast("error", errorMessage(err));
    } finally {
      setIsBusy(false);
    }
  }

  async function handleCreateNodeAfterChoice(choice: AdminDialogueChoice) {
    if (!graph || !selectedNpcId) return;
    setIsBusy(true);
    try {
      const node = await createDialogueNode(graph.tree.id, { text: "New dialogue line…" });
      if (choice.required_skill) {
        await updateDialogueChoice(choice.id, {
          success_node_id: node.id,
          failure_node_id: choice.failure_node_id ?? node.id,
        });
      } else {
        await updateDialogueChoice(choice.id, { next_node_id: node.id });
      }
      await reloadGraph(selectedNpcId, node.id);
      showToast("success", "Node added after the choice.");
    } catch (err) {
      showToast("error", errorMessage(err));
    } finally {
      setIsBusy(false);
    }
  }

  const saveLabel =
    saveState === "saving"
      ? "Saving…"
      : saveState === "saved"
        ? "Saved"
        : saveState === "error"
          ? "Save failed"
          : "";

  return (
    <>
      <main style={pageStyle}>
        <div style={pageInnerStyle}>
          <AdminPageHeader
            eyebrow="Game Design"
            title="Dialogues"
            description="Build branching conversations, link choices to nodes, and attach outcomes."
            actions={
              saveLabel ? (
                <div
                  role="status"
                  style={{
                    ...saveBadgeStyle,
                    color:
                      saveState === "error"
                        ? "#FCA5A5"
                        : saveState === "saved"
                          ? "#6EE7B7"
                          : colors.textMuted,
                    borderColor: saveState === "error" ? "rgba(220,38,38,0.35)" : colors.goldBorder,
                  }}
                >
                  {saveLabel}
                </div>
              ) : undefined
            }
          />

          <div className="grid grid-cols-1 gap-5 lg:grid-cols-[230px_290px_minmax(0,1fr)]">
            <section style={panelStyle}>
              <div style={panelHeadingStyle}>NPCs</div>
              <input
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                placeholder="Search NPCs…"
                aria-label="Search NPCs"
                style={searchStyle}
              />
              <div style={npcListStyle}>
                {isLoadingNpcs && <div style={emptyTextStyle}>Loading…</div>}
                {!isLoadingNpcs && filteredNpcs.length === 0 && (
                  <div style={emptyTextStyle}>No NPCs found.</div>
                )}
                {filteredNpcs.map((npc) => {
                  const isSelected = npc.id === selectedNpcId;
                  return (
                    <button
                      key={npc.id}
                      type="button"
                      onClick={() => setSelectedNpcId(npc.id)}
                      style={{ ...npcRowStyle, ...(isSelected ? npcRowSelectedStyle : {}) }}
                    >
                      <span style={npcThumbStyle}>
                        {npc.img ? (
                          <img
                            src={resolveEntityImage(npc.img, "npc")}
                            alt=""
                            style={npcThumbImgStyle}
                          />
                        ) : (
                          <ImageIcon size={14} style={{ color: "#6B7280" }} />
                        )}
                      </span>
                      <span style={{ flex: 1, minWidth: 0 }}>
                        <span style={npcNameStyle}>{npc.name}</span>
                        <span style={npcMetaStyle}>
                          {npc.npc_type}
                          {npc.dialogueTreeId ? " · tree" : " · no tree"}
                        </span>
                      </span>
                    </button>
                  );
                })}
              </div>
            </section>

            <section style={panelStyle}>
              <div style={panelHeaderRowStyle}>
                <div style={panelHeadingStyle}>Nodes</div>
                {graph && (
                  <button
                    type="button"
                    onClick={() => void handleAddNode()}
                    disabled={isBusy}
                    style={addButtonStyle}
                  >
                    + Node
                  </button>
                )}
              </div>

              {graph ? (
                <>
                  <label htmlFor="tree-name" style={smallLabelStyle}>
                    Tree name
                  </label>
                  <input
                    id="tree-name"
                    value={graph.tree.name}
                    onChange={(event) => {
                      const name = event.target.value;
                      setGraph((current) =>
                        current ? { ...current, tree: { ...current.tree, name } } : current,
                      );
                      scheduleSave(`tree:${graph.tree.id}`, () =>
                        updateDialogueTree(graph.tree.id, { name }),
                      );
                    }}
                    style={treeNameStyle}
                  />

                  <div style={nodeListStyle}>
                    {flow.ordered.map(({ node, depth }) => {
                      const choiceCount = graph.choices.filter(
                        (choice) => choice.node_id === node.id,
                      ).length;
                      const isSelected = node.id === selectedNodeId;
                      return (
                        <button
                          key={node.id}
                          type="button"
                          onClick={() => setSelectedNodeId(node.id)}
                          style={{
                            ...nodeRowStyle,
                            paddingLeft: 10 + Math.min(depth, 6) * 9,
                            ...(isSelected ? nodeRowSelectedStyle : {}),
                          }}
                        >
                          <span style={nodeTextStyle}>
                            {dialogueNodeLabel(node, graph.tree.root_node_id)}
                          </span>
                          <span style={nodeBadgesStyle}>
                            {node.is_endpoint === 1 && <span style={endBadgeStyle}>end</span>}
                            {choiceCount > 0 && <span style={countBadgeStyle}>{choiceCount}</span>}
                          </span>
                        </button>
                      );
                    })}

                    {flow.unreachable.length > 0 && (
                      <>
                        <div style={unreachableLabelStyle}>Unreachable</div>
                        {flow.unreachable.map((node) => (
                          <button
                            key={node.id}
                            type="button"
                            onClick={() => setSelectedNodeId(node.id)}
                            style={{
                              ...nodeRowStyle,
                              ...nodeRowUnreachableStyle,
                              ...(node.id === selectedNodeId ? nodeRowSelectedStyle : {}),
                            }}
                          >
                            <span style={nodeTextStyle}>
                              {dialogueNodeLabel(node, graph.tree.root_node_id)}
                            </span>
                          </button>
                        ))}
                      </>
                    )}
                  </div>

                  <div style={nodeFooterStyle}>
                    {graph.nodes.length} nodes · {graph.choices.length} choices
                  </div>
                </>
              ) : (
                <div style={emptyTextStyle}>
                  {isLoadingGraph
                    ? "Loading tree…"
                    : selectedNpc
                      ? "This NPC has no dialogue tree yet."
                      : "Select an NPC."}
                </div>
              )}
            </section>

            <section style={{ minWidth: 0 }}>
              {selectedNpc && (
                <div style={npcDetailsStyle}>
                  <div style={npcDetailsHeaderStyle}>
                    <div style={npcPortraitStyle}>
                      {selectedNpc.img ? (
                        <img
                          src={resolveEntityImage(selectedNpc.img, "npc")}
                          alt=""
                          style={npcPortraitImgStyle}
                        />
                      ) : (
                        <ImageIcon size={28} style={{ color: "#6B7280" }} />
                      )}
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={npcDetailsTitleStyle}>NPC details</div>
                      <label htmlFor="npc-details-name" style={smallLabelStyle}>
                        Name
                      </label>
                      <input
                        id="npc-details-name"
                        value={selectedNpc.name}
                        onChange={(event) => handleUpdateNpc({ name: event.target.value })}
                        style={treeNameStyle}
                      />
                      <div style={npcDetailsFieldsStyle}>
                        <div style={{ flex: 1, minWidth: 110 }}>
                          <label htmlFor="npc-details-type" style={smallLabelStyle}>
                            Type
                          </label>
                          <input
                            id="npc-details-type"
                            value={selectedNpc.npc_type}
                            onChange={(event) => handleUpdateNpc({ npc_type: event.target.value })}
                            style={treeNameStyle}
                          />
                        </div>
                        <div style={{ flex: 1.4, minWidth: 150 }}>
                          <label htmlFor="npc-details-discovery" style={smallLabelStyle}>
                            Discovery message
                          </label>
                          <input
                            id="npc-details-discovery"
                            value={selectedNpc.discovery_message ?? ""}
                            placeholder="Shown when the party enters the room"
                            onChange={(event) =>
                              handleUpdateNpc({
                                discovery_message: event.target.value.trim() || null,
                              })
                            }
                            style={treeNameStyle}
                          />
                        </div>
                      </div>
                    </div>
                  </div>
                  <AdminImageField
                    id={`npc-img-${selectedNpc.id}`}
                    label="Portrait"
                    category="npc"
                    value={selectedNpc.img}
                    placeholder="/images/characters/npc/Merchant.png"
                    hint="Shown in the NPC list, room inspector, and conversations."
                    previewSize={46}
                    onChange={(img) => handleUpdateNpc({ img })}
                  />
                </div>
              )}

              {isLoadingGraph ? (
                <div style={emptyPanelStyle}>Loading dialogue tree…</div>
              ) : !selectedNpc ? (
                <div style={emptyPanelStyle}>Select an NPC to edit their dialogue.</div>
              ) : !graph ? (
                <div style={emptyPanelStyle}>
                  <div style={emptyTitleStyle}>No dialogue tree</div>
                  <p style={emptyCopyStyle}>
                    {selectedNpc.name} has no branching dialogue yet. Create a tree with a root
                    node, then add choices and child nodes.
                  </p>
                  <button
                    type="button"
                    onClick={() => void handleCreateTree()}
                    disabled={isBusy}
                    style={primaryButtonStyle}
                  >
                    {isBusy ? "Creating…" : "Create dialogue tree"}
                  </button>
                </div>
              ) : selectedNode ? (
                <DialogueNodeEditor
                  graph={graph}
                  node={selectedNode}
                  onUpdateNode={handleUpdateNode}
                  onDeleteNode={(node) => void handleDeleteNode(node)}
                  onAddChoice={(nodeId) => void handleAddChoice(nodeId)}
                  onUpdateChoice={handleUpdateChoice}
                  onDeleteChoice={(choice) => void handleDeleteChoice(choice)}
                  onCreateNodeAfterChoice={(choice) => void handleCreateNodeAfterChoice(choice)}
                  onUpdateChoiceOutcome={handleUpdateChoiceOutcome}
                />
              ) : (
                <div style={emptyPanelStyle}>Select a node to edit it.</div>
              )}
            </section>
          </div>
        </div>
      </main>

      {toast && <Toast type={toast.type} message={toast.message} onClose={() => setToast(null)} />}
    </>
  );
}

// Static style objects hoisted out of the render path.
const pageStyle: CSSProperties = {
  minHeight: "100%",
  padding: "36px 28px 72px",
  fontFamily: fonts.body,
};
const pageInnerStyle: CSSProperties = { maxWidth: 1300, margin: "0 auto" };
const saveBadgeStyle: CSSProperties = {
  padding: "4px 10px",
  border: `1px solid ${colors.goldBorder}`,
  borderRadius: 20,
  fontSize: 11,
  fontFamily: fonts.display,
  letterSpacing: "0.06em",
};
const panelStyle: CSSProperties = {
  background: "rgba(255,255,255,0.025)",
  border: `1px solid ${colors.goldBorder}`,
  borderRadius: 10,
  padding: 16,
  minWidth: 0,
};
const panelHeadingStyle: CSSProperties = {
  fontSize: 12,
  fontWeight: 700,
  letterSpacing: "0.1em",
  textTransform: "uppercase",
  color: colors.gold,
  fontFamily: fonts.display,
  marginBottom: 12,
};
const panelHeaderRowStyle: CSSProperties = {
  display: "flex",
  alignItems: "center",
  justifyContent: "space-between",
  gap: 8,
};
const searchStyle: CSSProperties = {
  width: "100%",
  boxSizing: "border-box",
  padding: "8px 10px",
  marginBottom: 10,
  background: "rgba(0,0,0,0.35)",
  border: `1px solid ${colors.goldBorder}`,
  borderRadius: 6,
  color: colors.text,
  fontSize: 12,
  fontFamily: fonts.body,
  outline: "none",
};
const npcListStyle: CSSProperties = {
  display: "flex",
  flexDirection: "column",
  gap: 4,
  maxHeight: "64vh",
  overflowY: "auto",
};
const npcRowStyle: CSSProperties = {
  display: "flex",
  flexDirection: "row",
  alignItems: "center",
  gap: 8,
  width: "100%",
  padding: "8px 10px",
  background: "transparent",
  border: "1px solid transparent",
  borderRadius: 6,
  cursor: "pointer",
  textAlign: "left",
  font: "inherit",
};
const npcThumbStyle: CSSProperties = {
  flexShrink: 0,
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  width: 32,
  height: 32,
  background: "rgba(0,0,0,0.35)",
  border: `1px solid ${colors.subtleBorder}`,
  borderRadius: 5,
  overflow: "hidden",
};
const npcThumbImgStyle: CSSProperties = {
  width: 28,
  height: 28,
  objectFit: "contain",
  imageRendering: "pixelated",
};
const npcDetailsStyle: CSSProperties = {
  padding: 14,
  marginBottom: 14,
  background: "rgba(255,255,255,0.025)",
  border: `1px solid ${colors.goldBorder}`,
  borderRadius: 9,
};
const npcDetailsHeaderStyle: CSSProperties = {
  display: "flex",
  alignItems: "flex-start",
  gap: 12,
};
const npcPortraitStyle: CSSProperties = {
  flexShrink: 0,
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  width: 68,
  height: 68,
  background: "rgba(0,0,0,0.4)",
  border: `1px solid ${colors.goldBorder}`,
  borderRadius: 8,
  overflow: "hidden",
};
const npcPortraitImgStyle: CSSProperties = {
  width: "100%",
  height: "100%",
  objectFit: "contain",
  imageRendering: "pixelated",
};
const npcDetailsTitleStyle: CSSProperties = {
  fontSize: 11,
  fontWeight: 700,
  letterSpacing: "0.1em",
  textTransform: "uppercase",
  color: colors.gold,
  fontFamily: fonts.display,
  marginBottom: 8,
};
const npcDetailsFieldsStyle: CSSProperties = { display: "flex", gap: 10, flexWrap: "wrap" };
const npcRowSelectedStyle: CSSProperties = {
  background: "rgba(212,175,55,0.1)",
  borderColor: colors.goldBorder,
};
const npcNameStyle: CSSProperties = {
  display: "block",
  fontSize: 13,
  color: colors.text,
  fontFamily: fonts.display,
  letterSpacing: "0.02em",
};
const npcMetaStyle: CSSProperties = { display: "block", fontSize: 10, color: "#6B7280" };
const smallLabelStyle: CSSProperties = {
  display: "block",
  fontSize: 10,
  fontWeight: 600,
  letterSpacing: "0.08em",
  textTransform: "uppercase",
  color: colors.muted,
  marginBottom: 5,
  fontFamily: fonts.display,
};
const treeNameStyle: CSSProperties = {
  width: "100%",
  boxSizing: "border-box",
  padding: "7px 9px",
  marginBottom: 12,
  background: "rgba(0,0,0,0.3)",
  border: `1px solid ${colors.goldBorder}`,
  borderRadius: 5,
  color: colors.text,
  fontSize: 12,
  fontFamily: fonts.body,
  outline: "none",
};
const nodeListStyle: CSSProperties = {
  display: "flex",
  flexDirection: "column",
  gap: 3,
  maxHeight: "54vh",
  overflowY: "auto",
};
const nodeRowStyle: CSSProperties = {
  display: "flex",
  alignItems: "center",
  justifyContent: "space-between",
  gap: 6,
  width: "100%",
  padding: "7px 10px",
  background: "transparent",
  border: "1px solid transparent",
  borderRadius: 5,
  cursor: "pointer",
  textAlign: "left",
  font: "inherit",
};
const nodeRowSelectedStyle: CSSProperties = {
  background: "rgba(212,175,55,0.1)",
  borderColor: colors.goldBorder,
};
const nodeRowUnreachableStyle: CSSProperties = {
  borderColor: "rgba(242,164,68,0.2)",
};
const nodeTextStyle: CSSProperties = {
  flex: 1,
  minWidth: 0,
  overflow: "hidden",
  textOverflow: "ellipsis",
  whiteSpace: "nowrap",
  fontSize: 11,
  color: colors.textMuted,
  fontFamily: fonts.body,
};
const nodeBadgesStyle: CSSProperties = { display: "flex", gap: 4, flexShrink: 0 };
const endBadgeStyle: CSSProperties = {
  padding: "1px 5px",
  background: "rgba(52,211,153,0.1)",
  border: "1px solid rgba(52,211,153,0.25)",
  borderRadius: 3,
  color: colors.success,
  fontSize: 8,
  textTransform: "uppercase",
  letterSpacing: "0.06em",
};
const countBadgeStyle: CSSProperties = {
  padding: "1px 5px",
  background: "rgba(212,175,55,0.1)",
  border: `1px solid ${colors.goldBorder}`,
  borderRadius: 3,
  color: colors.goldMuted,
  fontSize: 8,
};
const unreachableLabelStyle: CSSProperties = {
  marginTop: 8,
  marginBottom: 2,
  fontSize: 9,
  fontWeight: 700,
  letterSpacing: "0.1em",
  textTransform: "uppercase",
  color: colors.warning,
  fontFamily: fonts.display,
};
const nodeFooterStyle: CSSProperties = {
  marginTop: 10,
  paddingTop: 10,
  borderTop: `1px solid ${colors.subtleBorder}`,
  fontSize: 10,
  color: "#6B7280",
};
const addButtonStyle: CSSProperties = {
  padding: "4px 9px",
  background: "rgba(212,175,55,0.1)",
  border: "1px dashed rgba(212,175,55,0.4)",
  borderRadius: 4,
  color: colors.gold,
  fontSize: 10,
  fontFamily: fonts.display,
  cursor: "pointer",
};
const emptyTextStyle: CSSProperties = {
  padding: "14px 8px",
  textAlign: "center",
  color: colors.muted,
  fontSize: 12,
  lineHeight: 1.5,
};
const emptyPanelStyle: CSSProperties = {
  ...panelStyle,
  minHeight: 240,
  display: "flex",
  flexDirection: "column",
  alignItems: "center",
  justifyContent: "center",
  textAlign: "center",
  padding: 36,
};
const emptyTitleStyle: CSSProperties = {
  fontSize: 18,
  color: colors.text,
  fontFamily: fonts.display,
  letterSpacing: "0.03em",
  marginBottom: 8,
};
const emptyCopyStyle: CSSProperties = {
  maxWidth: 380,
  margin: "0 0 18px",
  fontSize: 13,
  lineHeight: 1.6,
  color: colors.muted,
};
const primaryButtonStyle: CSSProperties = {
  padding: "9px 18px",
  background: "rgba(212,175,55,0.16)",
  border: `1px solid ${colors.goldBorder}`,
  borderRadius: 6,
  color: colors.gold,
  fontSize: 12,
  fontWeight: 700,
  fontFamily: fonts.display,
  letterSpacing: "0.05em",
  cursor: "pointer",
};
