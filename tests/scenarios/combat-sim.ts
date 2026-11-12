import type { Page } from "@playwright/test";
import {
  GameLogger,
  createParty,
  moveDirection,
  attackEnemy,
  handleLevelUp,
  getPartyState,
  isGameOver,
  isInCombat,
  takeScreenshot,
} from "../game-helpers";
import type { RunResult, ScenarioConfig } from "./types";

export async function runCombatSim(
  page: Page,
  config: ScenarioConfig,
): Promise<RunResult> {
  const logger = new GameLogger(config.verbose);
  let combatsWon = 0;
  let combatsLost = 0;

  logger.banner("═══ Starting Combat Simulation ═══");

  await page.goto("http://localhost:5173/party-selection");
  await page.waitForTimeout(2000);

  await createParty(page, logger, config.party);
  await page.waitForTimeout(1500);

  if (config.screenshotDir) {
    await takeScreenshot(page, config.screenshotDir, "01-combat-sim-start");
  }

  let foundCombat = false;
  for (let attempt = 0; attempt < 10; attempt++) {
    if (await isInCombat(page)) {
      foundCombat = true;
      break;
    }
    for (const dir of ["north", "east", "south", "west"] as const) {
      if (await moveDirection(page, logger, dir)) {
        if (await isInCombat(page)) {
          foundCombat = true;
          break;
        }
      }
    }
    if (foundCombat) break;
    await page.waitForTimeout(300);
  }

  if (!foundCombat) {
    logger.log("No enemies found — scenario complete");
    return {
      outcome: "victory",
      turnsTaken: 0,
      combatsWon: 0,
      combatsLost: 0,
      partyState: await getPartyState(page),
      gold: 0,
      log: logger.getMessages(),
    };
  }

  logger.log("Engaged enemies — combat begins!");

  let combatTurns = 0;
  const maxCombatTurns = config.maxTurns;

  while (combatTurns < maxCombatTurns) {
    combatTurns++;

    if (await isGameOver(page)) {
      combatsLost++;
      logger.log("Party defeated in combat");
      if (config.screenshotDir) {
        await takeScreenshot(page, config.screenshotDir, "combat-defeat");
      }
      break;
    }

    await handleLevelUp(page, logger);

    if (!(await isInCombat(page))) {
      combatsWon++;
      logger.log(`Combat won after ${combatTurns} rounds!`);
      if (config.screenshotDir) {
        await takeScreenshot(page, config.screenshotDir, `combat-win-${combatsWon}`);
      }
      break;
    }

    await attackEnemy(page, logger);
    await page.waitForTimeout(800);

    await handleLevelUp(page, logger);
  }

  if (combatTurns >= maxCombatTurns) {
    logger.log(`Combat timed out after ${maxCombatTurns} rounds`);
  }

  return {
    outcome: combatsLost > 0 ? "defeat" : combatsWon > 0 ? "victory" : "timeout",
    turnsTaken: combatTurns,
    combatsWon,
    combatsLost,
    partyState: await getPartyState(page),
    gold: 0,
    log: logger.getMessages(),
  };
}
