import { Page } from "@playwright/test";
import {
  GameLogger,
  createParty,
  moveDirection,
  moveToTown,
  attackEnemy,
  handleLevelUp,
  speakToNPC,
  openChest,
  restAtCamp,
  leaveTavern,
  selectSection,
  restAtInn,
  isGameOver,
  isInCombat,
  isInTown,
  isExploring,
  isTavernOpen,
  hasChest,
  hasNPC,
  hasCamp,
  getPartyState,
  takeScreenshot,
} from "../game-helpers";
import { RunResult, ScenarioConfig } from "./types";

export async function runDungeonCrawl(
  page: Page,
  config: ScenarioConfig,
): Promise<RunResult> {
  const logger = new GameLogger(config.verbose);
  let combatsWon = 0;
  let combatsLost = 0;
  let npcInteractCount = 0;
  let chestInteractCount = 0;

  logger.banner("═══ Starting Dungeon Crawl ═══");

  await page.goto("http://localhost:5173/party-selection");
  await page.waitForTimeout(2000);

  await createParty(page, logger, config.party);
  await page.waitForTimeout(1500);

  if (config.screenshotDir) {
    await takeScreenshot(page, config.screenshotDir, "01-game-start");
  }

  let turn = 0;
  while (turn < config.maxTurns) {
    turn++;
    logger.nextTurn();

    if (await isGameOver(page)) {
      logger.log("GAME OVER — all party members defeated");
      combatsLost++;
      if (config.screenshotDir) {
        await takeScreenshot(page, config.screenshotDir, "game-over");
      }
      return {
        outcome: "defeat",
        turnsTaken: turn,
        combatsWon,
        combatsLost,
        partyState: await getPartyState(page),
        gold: 0,
        log: logger.getMessages(),
      };
    }

    await handleLevelUp(page, logger);

    if (await isInCombat(page)) {
      await attackEnemy(page, logger);
      await page.waitForTimeout(800); 

      await handleLevelUp(page, logger);

      if (!(await isInCombat(page))) {
        combatsWon++;
        logger.log("Combat victory!");
        if (config.screenshotDir) {
          await takeScreenshot(page, config.screenshotDir, `combat-win-${combatsWon}`);
        }
      }
      continue;
    }

    if (await isInTown(page)) {
      if (await isTavernOpen(page)) {
        await leaveTavern(page, logger);
        await page.waitForTimeout(300);
      }

      const party = await getPartyState(page);
      const needsRest = party.some((p) => p.alive && p.hp < p.maxHp * 0.5);
      if (needsRest) {
        await restAtInn(page, logger);
        await page.waitForTimeout(300);
      }

      await selectSection(page, logger);
      await page.waitForTimeout(500);
      continue;
    }

    if (await isExploring(page)) {
      if ((await hasChest(page)) && chestInteractCount < 3) {
        await openChest(page, logger);
        chestInteractCount++;
        await page.waitForTimeout(300);
        continue;
      }
      if ((await hasNPC(page)) && npcInteractCount < 3) {
        await speakToNPC(page, logger);
        npcInteractCount++;
        await page.waitForTimeout(300);
        continue;
      }
      if (await hasCamp(page)) {
        await restAtCamp(page, logger);
        await page.waitForTimeout(300);
        continue;
      }

      const wentToTown = await moveToTown(page, logger);
      if (wentToTown) {
        logger.log("Returned to town");
        continue;
      }

      let moved = false;
      for (const dir of ["north", "east", "south", "west"] as const) {
        if (await moveDirection(page, logger, dir)) {
          moved = true;
          npcInteractCount = 0;
          chestInteractCount = 0;
          break;
        }
      }

      if (!moved) {
        const townMoved = await moveToTown(page, logger);
        if (!townMoved) {
          logger.log("Stuck — no moves available");
        }
      }
      continue;
    }

    await page.waitForTimeout(500);
  }

  logger.log(`Timed out after ${config.maxTurns} turns`);
  if (config.screenshotDir) {
    await takeScreenshot(page, config.screenshotDir, "timeout");
  }

  return {
    outcome: "timeout",
    turnsTaken: turn,
    combatsWon,
    combatsLost,
    partyState: await getPartyState(page),
    gold: 0,
    log: logger.getMessages(),
  };
}
