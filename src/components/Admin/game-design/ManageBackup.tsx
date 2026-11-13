import { useMemo, useRef, useState } from "react";
import { colors, fonts } from "@/theme";
import {
  backupFileName,
  buildBackup,
  deleteSnapshot,
  formatBytes,
  loadSnapshots,
  parseBackup,
  restoreBackup,
  saveSnapshot,
  tableCounts,
  type BackupFile,
  type BackupSnapshot,
  type RestoreReport,
} from "@/queries/AdminBackupQueries";
import { Toast } from "./create-room/Toast";
import { FieldGroup, StyledInput } from "./create-room/primitives";
import type { CSSProperties } from "react";

type ToastState = { type: "success" | "error"; message: string } | null;

const CONFIRM_PHRASE = "RESTORE";

const errorMessage = (err: unknown) =>
  err instanceof Error ? err.message : "Something went wrong.";

const downloadJson = (backup: BackupFile, name: string) => {
  const blob = new Blob([JSON.stringify(backup, null, 2)], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = name;
  anchor.click();
  URL.revokeObjectURL(url);
};

const totalRows = (backup: BackupFile) =>
  Object.values(tableCounts(backup)).reduce((sum, count) => sum + count, 0);

function CountGrid({ backup }: { backup: BackupFile }) {
  const counts = tableCounts(backup);
  return (
    <div style={countGridStyle}>
      {Object.entries(counts).map(([table, count]) => (
        <div key={table} style={countCellStyle}>
          <span style={countTableStyle}>{table}</span>
          <span style={countValueStyle}>{count}</span>
        </div>
      ))}
    </div>
  );
}

function RestoreReportView({ report }: { report: RestoreReport }) {
  return (
    <div style={reportStyle}>
      <div style={reportHeadingStyle}>Restore report</div>
      <div style={reportSummaryStyle}>
        {report.restoredTables.length} table{report.restoredTables.length === 1 ? "" : "s"} restored
        {report.failed.length > 0 ? ` · ${report.failed.length} failed` : " · no errors"}
      </div>
      {report.failed.length > 0 && (
        <ul style={reportListStyle}>
          {report.failed.map((failure) => (
            <li key={failure.table} style={reportFailureStyle}>
              <strong>{failure.table}</strong>: {failure.message}
            </li>
          ))}
        </ul>
      )}
      {report.sequenceWarning && <p style={reportWarningStyle}>{report.sequenceWarning}</p>}
    </div>
  );
}

export default function ManageBackup() {
  const [isExporting, setIsExporting] = useState(false);
  const [exportSummary, setExportSummary] = useState<string | null>(null);
  const [snapshotLabel, setSnapshotLabel] = useState("");
  const [snapshots, setSnapshots] = useState<BackupSnapshot[]>(() => loadSnapshots());

  const [pendingBackup, setPendingBackup] = useState<BackupFile | null>(null);
  const [pendingSource, setPendingSource] = useState<string>("");
  const [importError, setImportError] = useState<string | null>(null);
  const [confirmText, setConfirmText] = useState("");
  const [isRestoring, setIsRestoring] = useState(false);
  const [report, setReport] = useState<RestoreReport | null>(null);
  const [toast, setToast] = useState<ToastState>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const canRestore = pendingBackup !== null && confirmText.trim() === CONFIRM_PHRASE && !isRestoring;
  const pendingTotal = useMemo(
    () => (pendingBackup ? totalRows(pendingBackup) : 0),
    [pendingBackup],
  );

  function showToast(type: "success" | "error", message: string) {
    setToast({ type, message });
    window.setTimeout(() => setToast(null), 4500);
  }

  function stageRestore(backup: BackupFile, source: string) {
    setPendingBackup(backup);
    setPendingSource(source);
    setConfirmText("");
    setReport(null);
  }

  async function handleDownload() {
    setIsExporting(true);
    setExportSummary(null);
    try {
      const { backup, skippedTables, totalRows: rows } = await buildBackup();
      downloadJson(backup, backupFileName());
      setExportSummary(
        `Downloaded ${rows} rows across ${Object.keys(tableCounts(backup)).length} tables.` +
          (skippedTables.length ? ` Skipped: ${skippedTables.join(", ")}.` : ""),
      );
      showToast("success", "Backup downloaded.");
    } catch (err) {
      showToast("error", errorMessage(err));
    } finally {
      setIsExporting(false);
    }
  }

  async function handleSnapshot() {
    setIsExporting(true);
    try {
      const { backup, totalRows: rows } = await buildBackup();
      const snapshot = saveSnapshot(backup, snapshotLabel);
      if (!snapshot) {
        showToast("error", "That backup is too large to keep in browser storage. Download it instead.");
      } else {
        setSnapshots(loadSnapshots());
        setSnapshotLabel("");
        showToast("success", `Snapshot saved (${rows} rows).`);
      }
    } catch (err) {
      showToast("error", errorMessage(err));
    } finally {
      setIsExporting(false);
    }
  }

  function handleRemoveSnapshot(snapshot: BackupSnapshot) {
    if (!window.confirm(`Delete the snapshot “${snapshot.label}”?`)) return;
    setSnapshots(deleteSnapshot(snapshot.id));
    if (pendingBackup && pendingSource === `snapshot:${snapshot.id}`) {
      setPendingBackup(null);
      setPendingSource("");
      setConfirmText("");
    }
    showToast("success", "Snapshot deleted.");
  }

  function handleDownloadSnapshot(snapshot: BackupSnapshot) {
    downloadJson(snapshot.payload, backupFileName(new Date(snapshot.createdAt)));
  }

  async function handleFile(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    if (!file) return;

    setImportError(null);
    try {
      const text = await file.text();
      const result = parseBackup(text);
      if (!result.ok || !result.backup) {
        setImportError(result.error ?? "That backup could not be read.");
        setPendingBackup(null);
        return;
      }
      stageRestore(result.backup, `file:${file.name}`);
    } catch (err) {
      setImportError(errorMessage(err));
    } finally {
      // Allow re-selecting the same file after a failed attempt.
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  }

  async function handleRestore() {
    if (!canRestore || !pendingBackup) return;

    setIsRestoring(true);
    setReport(null);
    try {
      const result = await restoreBackup(pendingBackup);
      setReport(result);
      if (result.failed.length === 0) {
        showToast("success", "Backup restored.");
      } else {
        showToast("error", "Restore finished with errors. See the report.");
      }
      setConfirmText("");
    } catch (err) {
      showToast("error", errorMessage(err));
    } finally {
      setIsRestoring(false);
    }
  }

  return (
    <>
      <main style={pageStyle}>
        <div style={pageInnerStyle}>
          <header style={headerStyle}>
            <div>
              <div style={eyebrowStyle}>Game Design</div>
              <h1 style={titleStyle}>Backup &amp; Restore</h1>
              <p style={subtitleStyle}>
                Export core content, keep local snapshots, and restore with an explicit
                confirmation.
              </p>
            </div>
          </header>

          <div className="grid grid-cols-1 gap-5 lg:grid-cols-[minmax(0,1fr)_360px]">
            <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
              <section style={panelStyle}>
                <div style={panelHeadingStyle}>Export</div>
                <p style={helperCopyStyle}>
                  Downloads a JSON file containing items, enemies, rooms, quests, NPCs,
                  dialogue, and shop stock. Save it somewhere outside the browser for a real
                  backup.
                </p>
                <div style={actionRowStyle}>
                  <button
                    type="button"
                    onClick={() => void handleDownload()}
                    disabled={isExporting}
                    style={primaryButtonStyle}
                  >
                    {isExporting ? "Preparing…" : "Download backup"}
                  </button>
                  <span style={helperTextStyle}>Includes every core table.</span>
                </div>
                {exportSummary && <p style={successTextStyle}>{exportSummary}</p>}
              </section>

              <section style={panelStyle}>
                <div style={panelHeadingStyle}>Snapshots</div>
                <p style={helperCopyStyle}>
                  Snapshots live in this browser only. They are handy for quick rollbacks but
                  are not a substitute for a downloaded file.
                </p>
                <div style={snapshotCreateStyle}>
                  <StyledInput
                    value={snapshotLabel}
                    onChange={(event) => setSnapshotLabel(event.target.value)}
                    placeholder="Snapshot label (optional)"
                    aria-label="Snapshot label"
                  />
                  <button
                    type="button"
                    onClick={() => void handleSnapshot()}
                    disabled={isExporting}
                    style={secondaryButtonStyle}
                  >
                    Save snapshot
                  </button>
                </div>

                {snapshots.length === 0 ? (
                  <div style={emptyTextStyle}>No snapshots yet.</div>
                ) : (
                  <div style={snapshotListStyle}>
                    {snapshots.map((snapshot) => (
                      <div key={snapshot.id} style={snapshotRowStyle}>
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <div style={snapshotNameStyle}>{snapshot.label}</div>
                          <div style={snapshotMetaStyle}>
                            {new Date(snapshot.createdAt).toLocaleString()} ·{" "}
                            {formatBytes(snapshot.bytes)} ·{" "}
                            {Object.values(snapshot.tableCounts).reduce((a, b) => a + b, 0)} rows
                          </div>
                        </div>
                        <button
                          type="button"
                          onClick={() => stageRestore(snapshot.payload, `snapshot:${snapshot.id}`)}
                          style={smallButtonStyle}
                        >
                          Restore
                        </button>
                        <button
                          type="button"
                          onClick={() => handleDownloadSnapshot(snapshot)}
                          style={smallButtonStyle}
                        >
                          Download
                        </button>
                        <button
                          type="button"
                          onClick={() => handleRemoveSnapshot(snapshot)}
                          style={dangerSmallButtonStyle}
                        >
                          Delete
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </section>

              <section style={panelStyle}>
                <div style={panelHeadingStyle}>Import a backup</div>
                <p style={helperCopyStyle}>
                  Load a downloaded backup file, review what it contains, then type{" "}
                  <code>{CONFIRM_PHRASE}</code> to enable the restore button.
                </p>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="application/json,.json"
                  onChange={(event) => void handleFile(event)}
                  aria-label="Backup file"
                  style={fileInputStyle}
                />
                {importError && <p style={errorTextStyle}>{importError}</p>}
              </section>

              {pendingBackup && (
                <section style={restorePanelStyle}>
                  <div style={restoreHeadingStyle}>Review restore</div>
                  <p style={helperCopyStyle}>
                    Source: <strong>{pendingSource}</strong>. This replaces the current rows in
                    every table included below. It cannot be undone unless you exported a
                    backup first.
                  </p>
                  <div style={restoreStatsStyle}>
                    <span>{pendingTotal} rows</span>
                    <span>{Object.keys(tableCounts(pendingBackup)).length} tables</span>
                    <span>made {new Date(pendingBackup.createdAt).toLocaleString()}</span>
                  </div>
                  <CountGrid backup={pendingBackup} />

                  <div style={confirmBlockStyle}>
                    <FieldGroup
                      id="restore-confirm"
                      label={`Type ${CONFIRM_PHRASE} to confirm`}
                    >
                      <StyledInput
                        id="restore-confirm"
                        value={confirmText}
                        onChange={(event) => setConfirmText(event.target.value)}
                        placeholder={CONFIRM_PHRASE}
                        autoComplete="off"
                        spellCheck={false}
                      />
                    </FieldGroup>
                    <div style={actionRowStyle}>
                      <button
                        type="button"
                        onClick={() => void handleRestore()}
                        disabled={!canRestore}
                        style={{
                          ...dangerButtonStyle,
                          opacity: canRestore ? 1 : 0.45,
                          cursor: canRestore ? "pointer" : "not-allowed",
                        }}
                      >
                        {isRestoring ? "Restoring…" : "Restore this backup"}
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          setPendingBackup(null);
                          setPendingSource("");
                          setConfirmText("");
                        }}
                        disabled={isRestoring}
                        style={secondaryButtonStyle}
                      >
                        Cancel
                      </button>
                    </div>
                  </div>
                </section>
              )}

              {report && (
                <section style={panelStyle}>
                  <RestoreReportView report={report} />
                </section>
              )}
            </div>

            <section style={panelStyle}>
              <div style={panelHeadingStyle}>How restore works</div>
              <ol style={orderedListStyle}>
                <li>Clear the tables included in the backup, children first.</li>
                <li>Insert the backup rows, parents first, preserving original ids.</li>
                <li>Reset identity sequences so new rows keep working.</li>
              </ol>
              <p style={helperCopyStyle}>
                A fresh snapshot is the safest first step before importing anything.
              </p>
              <p style={warningCopyStyle}>
                Migration <code>004_backup_sequences.sql</code> must be applied for the sequence
                reset. Without it, restore still works but you may need to fix duplicate-id
                errors when creating new content.
              </p>
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
const pageInnerStyle: CSSProperties = { maxWidth: 1180, margin: "0 auto" };
const headerStyle: CSSProperties = {
  display: "flex",
  alignItems: "flex-end",
  justifyContent: "space-between",
  gap: 16,
  flexWrap: "wrap",
  marginBottom: 24,
};
const eyebrowStyle: CSSProperties = {
  fontSize: 11,
  fontWeight: 700,
  letterSpacing: "0.14em",
  textTransform: "uppercase",
  color: colors.goldMuted,
  fontFamily: fonts.display,
  marginBottom: 6,
};
const titleStyle: CSSProperties = {
  margin: 0,
  fontSize: 30,
  fontWeight: 700,
  color: colors.text,
  fontFamily: fonts.display,
  letterSpacing: "0.04em",
};
const subtitleStyle: CSSProperties = { margin: "6px 0 0", fontSize: 14, color: colors.muted };
const panelStyle: CSSProperties = {
  background: "rgba(255,255,255,0.025)",
  border: `1px solid ${colors.goldBorder}`,
  borderRadius: 10,
  padding: 18,
  minWidth: 0,
};
const restorePanelStyle: CSSProperties = {
  ...panelStyle,
  background: "rgba(242,164,68,0.04)",
  border: "1px solid rgba(242,164,68,0.28)",
};
const panelHeadingStyle: CSSProperties = {
  fontSize: 12,
  fontWeight: 700,
  letterSpacing: "0.1em",
  textTransform: "uppercase",
  color: colors.gold,
  fontFamily: fonts.display,
  marginBottom: 10,
};
const restoreHeadingStyle: CSSProperties = {
  ...panelHeadingStyle,
  color: colors.warning,
};
const helperCopyStyle: CSSProperties = {
  margin: "0 0 14px",
  fontSize: 12,
  lineHeight: 1.6,
  color: colors.muted,
};
const warningCopyStyle: CSSProperties = {
  margin: "14px 0 0",
  padding: 12,
  background: "rgba(242,164,68,0.06)",
  border: "1px solid rgba(242,164,68,0.22)",
  borderRadius: 7,
  fontSize: 11,
  lineHeight: 1.6,
  color: colors.muted,
};
const actionRowStyle: CSSProperties = {
  display: "flex",
  alignItems: "center",
  gap: 12,
  flexWrap: "wrap",
};
const helperTextStyle: CSSProperties = { fontSize: 11, color: colors.muted };
const successTextStyle: CSSProperties = { margin: "12px 0 0", fontSize: 12, color: colors.success };
const errorTextStyle: CSSProperties = { margin: "10px 0 0", fontSize: 12, color: colors.danger };
const snapshotCreateStyle: CSSProperties = {
  display: "flex",
  gap: 8,
  alignItems: "stretch",
  marginBottom: 14,
  flexWrap: "wrap",
};
const snapshotListStyle: CSSProperties = { display: "flex", flexDirection: "column", gap: 6 };
const snapshotRowStyle: CSSProperties = {
  display: "flex",
  alignItems: "center",
  gap: 8,
  padding: "9px 10px",
  background: "rgba(0,0,0,0.18)",
  border: `1px solid ${colors.subtleBorder}`,
  borderRadius: 6,
  flexWrap: "wrap",
};
const snapshotNameStyle: CSSProperties = {
  fontSize: 12,
  color: colors.text,
  fontFamily: fonts.display,
  letterSpacing: "0.02em",
};
const snapshotMetaStyle: CSSProperties = { fontSize: 10, color: "#6B7280" };
const emptyTextStyle: CSSProperties = {
  padding: "16px 8px",
  textAlign: "center",
  color: colors.muted,
  fontSize: 12,
};
const fileInputStyle: CSSProperties = {
  width: "100%",
  padding: "9px 10px",
  background: "rgba(0,0,0,0.35)",
  border: `1px solid ${colors.goldBorder}`,
  borderRadius: 6,
  color: colors.text,
  fontSize: 12,
  fontFamily: fonts.body,
};
const restoreStatsStyle: CSSProperties = {
  display: "flex",
  gap: 14,
  flexWrap: "wrap",
  marginBottom: 12,
  fontSize: 12,
  color: colors.goldMuted,
  fontFamily: fonts.display,
};
const countGridStyle: CSSProperties = {
  display: "grid",
  gridTemplateColumns: "repeat(auto-fit, minmax(150px, 1fr))",
  gap: 5,
  maxHeight: 220,
  overflowY: "auto",
  padding: 10,
  background: "rgba(0,0,0,0.22)",
  border: `1px solid ${colors.subtleBorder}`,
  borderRadius: 7,
};
const countCellStyle: CSSProperties = {
  display: "flex",
  justifyContent: "space-between",
  gap: 8,
  fontSize: 11,
  color: colors.textMuted,
};
const countTableStyle: CSSProperties = { fontFamily: "monospace", color: "#7A6A52" };
const countValueStyle: CSSProperties = { color: colors.text };
const confirmBlockStyle: CSSProperties = {
  marginTop: 16,
  paddingTop: 14,
  borderTop: "1px solid rgba(242,164,68,0.2)",
};
const reportStyle: CSSProperties = { display: "flex", flexDirection: "column", gap: 8 };
const reportHeadingStyle: CSSProperties = {
  fontSize: 12,
  fontWeight: 700,
  letterSpacing: "0.1em",
  textTransform: "uppercase",
  color: colors.gold,
  fontFamily: fonts.display,
};
const reportSummaryStyle: CSSProperties = { fontSize: 12, color: colors.textMuted };
const reportListStyle: CSSProperties = {
  margin: 0,
  paddingLeft: 18,
  display: "flex",
  flexDirection: "column",
  gap: 4,
};
const reportFailureStyle: CSSProperties = { fontSize: 11, color: "#FCA5A5", lineHeight: 1.5 };
const reportWarningStyle: CSSProperties = {
  margin: 0,
  fontSize: 11,
  lineHeight: 1.5,
  color: colors.warning,
};
const orderedListStyle: CSSProperties = {
  margin: "0 0 14px",
  paddingLeft: 18,
  fontSize: 12,
  lineHeight: 1.9,
  color: colors.muted,
};
const primaryButtonStyle: CSSProperties = {
  padding: "8px 16px",
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
const secondaryButtonStyle: CSSProperties = {
  padding: "8px 14px",
  background: "rgba(255,255,255,0.03)",
  border: "1px solid rgba(255,255,255,0.1)",
  borderRadius: 6,
  color: "#A8916A",
  fontSize: 11,
  fontFamily: fonts.display,
  cursor: "pointer",
};
const smallButtonStyle: CSSProperties = {
  padding: "5px 9px",
  background: "rgba(255,255,255,0.03)",
  border: "1px solid rgba(255,255,255,0.1)",
  borderRadius: 4,
  color: "#A8916A",
  fontSize: 10,
  fontFamily: fonts.display,
  cursor: "pointer",
};
const dangerButtonStyle: CSSProperties = {
  padding: "8px 14px",
  background: "rgba(220,38,38,0.12)",
  border: "1px solid rgba(220,38,38,0.35)",
  borderRadius: 6,
  color: "#FCA5A5",
  fontSize: 11,
  fontWeight: 700,
  fontFamily: fonts.display,
  cursor: "pointer",
};
const dangerSmallButtonStyle: CSSProperties = {
  padding: "5px 9px",
  background: "rgba(220,38,38,0.07)",
  border: "1px solid rgba(220,38,38,0.25)",
  borderRadius: 4,
  color: "#FCA5A5",
  fontSize: 10,
  fontFamily: fonts.display,
  cursor: "pointer",
};
