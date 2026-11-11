import { chromium } from "@playwright/test";
import { parseArgs } from "node:util";
import { spawn, ChildProcess } from "node:child_process";
import { runDungeonCrawl } from "./scenarios/dungeon-crawl";
import { runCombatSim } from "./scenarios/combat-sim";
import { RunResult, ScenarioConfig } from "./scenarios/types";

const { values } = parseArgs({
  options: {
    scenario: { type: "string", default: "dungeon" },
    party: { type: "string", default: "Warrior,Cleric,Wizard" },
    "max-turns": { type: "string", default: "200" },
    batch: { type: "string", default: "1" },
    seed: { type: "string", default: "" },
    verbose: { type: "boolean", default: true },
    quiet: { type: "boolean", default: false },
    timeout: { type: "string", default: "120" },
    screenshot: { type: "string", default: "" },
    help: { type: "boolean", short: "h", default: false },
  },
  strict: false,
});

if (values.help) {
  process.stdout.write(`
Qwest Test Runner — Play the game from the CLI

Usage:
  pnpm test:game [options]

Options:
  --scenario <name>      Scenario: "dungeon" (default) or "combat"
  --party <classes>      Comma-separated class names (default: "Warrior,Cleric,Wizard")
  --max-turns <n>        Max turns per game (default: 200)
  --batch <n>            Run N simulations and show aggregate stats (default: 1)
  --seed <n>             Random seed (reserved for future use)
  --verbose              Print every action (default)
  --quiet                Only print summary
  --timeout <seconds>    Max wall-clock seconds per game (default: 120)
  --screenshot <dir>     Save screenshots to directory at key moments
  --help, -h             Show this help

Examples:
  pnpm test:game
  pnpm test:game --party "Warrior,Cleric,Wizard"
  pnpm test:game --batch 20 --quiet
  pnpm test:game --scenario combat --batch 50 --screenshot ./shots
`);
  process.exit(0);
}

const config: ScenarioConfig = {
  party: (values.party ?? "Warrior,Cleric,Wizard")
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean),
  maxTurns: parseInt(values["max-turns"] ?? "200", 10),
  verbose: !values.quiet,
  screenshotDir: values.screenshot || undefined,
  timeoutSeconds: parseInt(values.timeout ?? "120", 10),
};

const batchSize = parseInt(values.batch ?? "1", 10);
const scenario = values.scenario ?? "dungeon";

process.stdout.write("\n");
process.stdout.write("═══════════════════════════════════════════\n");
process.stdout.write("            Qwest  Test  Runner            \n");
process.stdout.write("═══════════════════════════════════════════\n");
process.stdout.write(`  Scenario:  ${scenario}\n`);
process.stdout.write(`  Party:     ${config.party.join(", ")}\n`);
process.stdout.write(`  Max turns: ${config.maxTurns}\n`);
process.stdout.write(`  Batch:     ${batchSize}\n`);
if (config.screenshotDir) {
  process.stdout.write(`  Screenshots: ${config.screenshotDir}\n`);
}
process.stdout.write("───────────────────────────────────────────\n\n");

interface GameSummary {
  index: number;
  outcome: string;
  turns: number;
  combatsWon: number;
  combatsLost: number;
  partyState: string;
}

const summaries: GameSummary[] = [];

async function runOneGame(index: number): Promise<RunResult> {
  const browser = await chromium.launch({ headless: true, args: ["--no-sandbox"] });
  const context = await browser.newContext({
    viewport: { width: 1280, height: 800 },
  });
  const page = await context.newPage();

  page.setDefaultTimeout(config.timeoutSeconds * 1000);

  let result: RunResult;

  try {
    const runScenario =
      scenario === "combat" ? runCombatSim : runDungeonCrawl;
    result = await runScenario(page, config);
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    process.stdout.write(`  [${index}/${batchSize}] ✗ ERROR: ${msg}\n`);
    result = {
      outcome: "defeat",
      turnsTaken: 0,
      combatsWon: 0,
      combatsLost: 1,
      partyState: [],
      gold: 0,
      log: [],
    };
  } finally {
    await browser.close();
  }

  return result;
}

function formatPartyShort(
  party: Array<{ name: string; hp: number; maxHp: number; alive: boolean }>,
): string {
  if (party.length === 0) return "N/A";
  return party
    .map((p) => {
      const initials = p.name
        .split(/\s+/)
        .map((w) => w[0])
        .join("")
        .slice(0, 2);
      return `${initials}(${p.hp}/${p.maxHp}${p.alive ? "" : "†"})`;
    })
    .join(" ");
}


let devServer: ChildProcess | null = null;

async function startDevServer(): Promise<void> {
  try {
    const res = await fetch("http://localhost:5173/", { signal: AbortSignal.timeout(2000) });
    if (res.ok) {
      process.stdout.write("  Dev server already running on :5173\n\n");
      return;
    }
  } catch {
    // Dev server is not already running; start one below.
  }

  process.stdout.write("  Starting Vite dev server...\n");
  devServer = spawn("pnpm", ["dev"], {
    stdio: "pipe",
    shell: true,
  });

  await new Promise<void>((resolve, reject) => {
    const timeout = setTimeout(() => reject(new Error("Dev server start timeout")), 30_000);
    const onData = (data: Buffer) => {
      const text = data.toString();
      if (text.includes("Local:") || text.includes("ready")) {
        clearTimeout(timeout);
        devServer?.stdout?.off("data", onData);
        process.stdout.write("  Dev server ready on :5173\n\n");
        resolve();
      }
    };
    devServer?.stdout?.on("data", onData);
    devServer?.stderr?.on("data", onData);
  });
}

function stopDevServer(): void {
  if (devServer) {
    devServer.kill("SIGTERM");
    devServer = null;
  }
}

async function main(): Promise<void> {
  await startDevServer();
  const startTime = Date.now();

  for (let i = 1; i <= batchSize; i++) {
    const result = await runOneGame(i);
    const icon = result.outcome === "victory" ? "✓" : "✗";
    const partyStr = formatPartyShort(result.partyState);

    const summaryLine = `[${String(i).padStart(String(batchSize).length)}/${batchSize}] ${icon} ${result.outcome.padEnd(8)} Turn ${String(result.turnsTaken).padStart(3)}  Party: ${partyStr}`;
    process.stdout.write(`  ${summaryLine}\n`);

    summaries.push({
      index: i,
      outcome: result.outcome,
      turns: result.turnsTaken,
      combatsWon: result.combatsWon,
      combatsLost: result.combatsLost,
      partyState: partyStr,
    });
  }

  const elapsed = ((Date.now() - startTime) / 1000).toFixed(1);

  process.stdout.write("\n");
  process.stdout.write("═══════════════════════════════════════════\n");
  process.stdout.write("            AGGREGATE  RESULTS             \n");
  process.stdout.write("═══════════════════════════════════════════\n");

  const wins = summaries.filter((s) => s.outcome === "victory").length;
  const losses = summaries.filter((s) => s.outcome === "defeat").length;
  const timeouts = summaries.filter((s) => s.outcome === "timeout").length;
  const winRate = batchSize > 0 ? ((wins / batchSize) * 100).toFixed(1) : "0";

  const avgTurns =
    summaries.length > 0
      ? (summaries.reduce((sum, s) => sum + s.turns, 0) / summaries.length).toFixed(1)
      : "0";
  const avgWins =
    summaries.length > 0
      ? (
          summaries.reduce((sum, s) => sum + s.combatsWon, 0) / summaries.length
        ).toFixed(1)
      : "0";
  const avgLosses =
    summaries.length > 0
      ? (
          summaries.reduce((sum, s) => sum + s.combatsLost, 0) / summaries.length
        ).toFixed(1)
      : "0";

  process.stdout.write(`  Games played:      ${batchSize}\n`);
  process.stdout.write(`  Win rate:          ${winRate}% (${wins} won, ${losses} lost`);
  if (timeouts > 0) process.stdout.write(`, ${timeouts} timed out`);
  process.stdout.write(`)\n`);
  process.stdout.write(`  Avg turns/game:    ${avgTurns}\n`);
  process.stdout.write(`  Avg combats won:   ${avgWins}\n`);
  process.stdout.write(`  Avg combats lost:  ${avgLosses}\n`);
  process.stdout.write(`  Time elapsed:      ${elapsed}s\n`);
  process.stdout.write("═══════════════════════════════════════════\n\n");

  stopDevServer();
  process.exit(wins > 0 ? 0 : 1);
}

main().catch((err) => {
  process.stderr.write(`Fatal error: ${err}\n`);
  stopDevServer();
  process.exit(2);
});

process.on("SIGINT", () => { stopDevServer(); process.exit(130); });
process.on("SIGTERM", () => { stopDevServer(); process.exit(143); });
