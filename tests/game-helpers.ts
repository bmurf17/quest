import { Page } from "@playwright/test";
import path from "node:path";
import fs from "node:fs";

export class GameLogger {
  private turn = 0;
  private messages: string[] = [];
  private verbose: boolean;

  constructor(verbose: boolean) {
    this.verbose = verbose;
  }

  nextTurn(): number {
    this.turn++;
    return this.turn;
  }

  log(action: string): void {
    const line = `Turn ${String(this.turn).padStart(3)}:  ${action}`;
    this.messages.push(line);
    if (this.verbose) {
      process.stdout.write(`  ${line}\n`);
    }
  }

  logRaw(text: string): void {
    this.messages.push(text);
    if (this.verbose) {
      process.stdout.write(`  ${text}\n`);
    }
  }

  banner(text: string): void {
    if (this.verbose) {
      process.stdout.write(`\n${text}\n`);
    }
  }

  getMessages(): string[] {
    return [...this.messages];
  }

  getTurn(): number {
    return this.turn;
  }
}

export const CLASS_PRIMARY_STAT: Record<string, string> = {
  warrior: "str",
  ranger: "dex",
  cleric: "wis",
  wizard: "int",
  assassin: "dex",
  barbarian: "str",
  bard: "cha",
};

export async function createParty(
  page: Page,
  logger: GameLogger,
  classNames: string[],
): Promise<void> {
  logger.nextTurn();
  logger.log(`Creating party: ${classNames.join(", ")}`);

  const chooseClassHeading = page.getByText("Choose Class");
  await chooseClassHeading.waitFor({ state: "visible", timeout: 10000 });
  await page.waitForTimeout(500);

  for (const cls of classNames) {
    const row = page.locator(".char-row").filter({ hasText: cls }).first();
    await row.waitFor({ state: "visible", timeout: 5000 });
    await row.click();
    await page.waitForTimeout(300);

    // The button text includes a Unicode prefix: "⊕  Add to Party"
    // It changes to "Already in Party" if class is already in party
    const addBtn = page.getByText(/Add to Party/).first();
    const alreadyBtn = page.getByText("Already in Party").first();
    
    if ((await addBtn.count()) > 0 && !(await addBtn.isDisabled().catch(() => true))) {
      await addBtn.click();
      await page.waitForTimeout(400);
    } else if ((await alreadyBtn.count()) > 0) {
      // Character class already in party, skip
      logger.log(`  ${cls} already in party, skipping`);
    }
  }

  const beginBtn = page.getByRole("link", { name: "Begin Adventure" });
  await beginBtn.waitFor({ state: "visible", timeout: 5000 });
  await beginBtn.click();

  await page.getByText("Chronicle").waitFor({ state: "visible", timeout: 10000 });
  await page.waitForTimeout(500);
}

const DIR_SELECTORS: Record<string, string> = {
  north: ".lucide-chevron-up",
  south: ".lucide-chevron-down",
  west: ".lucide-chevron-left",
  east: ".lucide-chevron-right",
};

export async function moveDirection(
  page: Page,
  logger: GameLogger,
  dir: "north" | "south" | "west" | "east",
): Promise<boolean> {
  const selector = DIR_SELECTORS[dir];
  const btn = page.locator(`button:has(${selector})`);
  const count = await btn.count();
  if (count === 0) return false;

  const isDisabled = await btn.first().isDisabled().catch(() => true);
  if (isDisabled) return false;

  logger.nextTurn();
  logger.log(`Moving ${dir}`);
  await btn.first().click();
  await page.waitForTimeout(800);
  return true;
}

export async function moveToTown(page: Page, logger: GameLogger): Promise<boolean> {
  const tBtn = page.getByText("T", { exact: true });
  const count = await tBtn.count();
  if (count === 0) return false;

  logger.nextTurn();
  logger.log("Traveling to town");
  await tBtn.first().click();
  await page.waitForTimeout(800);
  return true;
}

export async function attackEnemy(
  page: Page,
  logger: GameLogger,
  targetName?: string,
): Promise<boolean> {
  const actionMenu = page.locator("div").filter({ hasText: /^Actions$/ }).first();
  const weaponSlot = page.locator('img[title*="Hit:"]').first();
  const count = await weaponSlot.count();
  if (count === 0) {
    const abilitySlot = page.locator('div[title*="Hit:"]').first();
    if ((await abilitySlot.count()) === 0) return false;
    await abilitySlot.click();
  } else {
    await weaponSlot.click();
  }
  await page.waitForTimeout(300);

  if (targetName) {
    const enemy = page.getByAltText(`Enemy ${targetName}`);
    if ((await enemy.count()) > 0) {
      await enemy.first().click();
      await page.waitForTimeout(300);
    }
  } else {
    const targetingMsg = page.getByText(/Select an enemy/);
    if ((await targetingMsg.count()) > 0) {
      const enemyImgs = page.locator('div:has(img[alt^="Enemy "]) img[alt^="Enemy "]');
      const enemyCount = await enemyImgs.count();
      if (enemyCount > 0) {
        await enemyImgs.first().click();
        await page.waitForTimeout(300);
      }
    }
  }

  logger.nextTurn();
  logger.log("Attacked enemy");
  return true;
}

export async function castSpell(
  page: Page,
  logger: GameLogger,
  spellName: string,
): Promise<boolean> {
  const spellSlot = page.locator(`img[alt="${spellName}"], img[title*="${spellName}"]`).first();
  const count = await spellSlot.count();
  if (count === 0) return false;

  await spellSlot.click();
  await page.waitForTimeout(300);

  const targetingMsg = page.getByText(/Select an enemy to cast/);
  if ((await targetingMsg.count()) > 0) {
    const enemyImgs = page.locator('div:has(img[alt^="Enemy "]) img[alt^="Enemy "]');
    if ((await enemyImgs.count()) > 0) {
      await enemyImgs.first().click();
      await page.waitForTimeout(300);
    }
  }

  const healTargetMsg = page.getByText(/Select a party member to heal/);
  if ((await healTargetMsg.count()) > 0) {
    const partyCards = page.locator(".party-card");
    if ((await partyCards.count()) > 0) {
      await partyCards.first().click();
      await page.waitForTimeout(300);
    }
  }

  logger.nextTurn();
  logger.log(`Cast ${spellName}`);
  return true;
}

export async function handleLevelUp(page: Page, logger: GameLogger): Promise<boolean> {
  const heading = page.getByRole("heading", { name: "Level Up!" });
  if ((await heading.count()) === 0) return false;

  logger.log("Level up detected — allocating stats");

  let maxAttempts = 10;
  while (maxAttempts-- > 0) {
    let pointsRemaining = true;
    while (pointsRemaining) {
      const plusBtn = page.locator('button:has(.lucide-plus)').first();
      if ((await plusBtn.count()) === 0) break;

      const isDisabled = await plusBtn.isDisabled().catch(() => false);
      const allAllocated = page.getByText("All points allocated");
      if ((await allAllocated.count()) > 0) break;

      const confirmBtn = page.getByText("Confirm Level Up");
      const nextCharBtn = page.getByText(/Next Character/);
      if ((await confirmBtn.count()) > 0 && !(await confirmBtn.isDisabled().catch(() => true))) {
        pointsRemaining = false;
        break;
      }
      if ((await nextCharBtn.count()) > 0 && !(await nextCharBtn.isDisabled().catch(() => true))) {
        pointsRemaining = false;
        break;
      }

      if (!isDisabled) {
        await plusBtn.click();
        await page.waitForTimeout(100);
      } else {
        break;
      }
    }

    const confirmBtn = page.getByText("Confirm Level Up");
    const nextCharBtn = page.getByText(/Next Character/);

    if ((await confirmBtn.count()) > 0 && !(await confirmBtn.isDisabled().catch(() => true))) {
      await confirmBtn.click();
      await page.waitForTimeout(300);
      logger.log("Level up confirmed");
      break;
    }
    if ((await nextCharBtn.count()) > 0 && !(await nextCharBtn.isDisabled().catch(() => true))) {
      await nextCharBtn.click();
      await page.waitForTimeout(300);
      logger.log("Level up — next character");
      continue;
    }

    await page.waitForTimeout(200);
  }

  return true;
}

export async function speakToNPC(page: Page, logger: GameLogger): Promise<boolean> {
  const speakBtn = page.getByText("Speak").first();
  const continueBtn = page.getByText("Continue Dialogue").first();

  if ((await speakBtn.count()) > 0) {
    await speakBtn.click();
    await page.waitForTimeout(500);
    logger.nextTurn();
    logger.log("Spoke to NPC");
    return true;
  }
  if ((await continueBtn.count()) > 0) {
    await continueBtn.click();
    await page.waitForTimeout(500);
    logger.nextTurn();
    logger.log("Continued NPC dialogue");
    return true;
  }

  const dialogueChoices = page.locator("button").filter({ hasText: /^[A-Z]/ });
  const dialoguePanel = page.locator("div").filter({ has: page.locator("p") }).first();
  const choices = dialoguePanel.locator("button");
  if ((await choices.count()) > 0) {
    await choices.first().click();
    await page.waitForTimeout(500);
    logger.nextTurn();
    logger.log("Selected dialogue choice");
    return true;
  }

  return false;
}

export async function openChest(page: Page, logger: GameLogger): Promise<boolean> {
  const openBtn = page.getByText("Open Chest").first();
  const takeAllBtn = page.getByText("Take All").first();
  const closeBtn = page.getByText("Close").first();
  const closeEmptyBtn = page.getByText("Close (Empty)").first();

  if ((await openBtn.count()) > 0) {
    await openBtn.click();
    await page.waitForTimeout(500);
    logger.nextTurn();
    logger.log("Opened chest");

    await page.waitForTimeout(300);
    if ((await takeAllBtn.count()) > 0) {
      await takeAllBtn.click();
      await page.waitForTimeout(300);
      logger.log("Took all items from chest");
    }

    await page.waitForTimeout(300);
    const closeFinal = (await closeBtn.count()) > 0 ? closeBtn : closeEmptyBtn;
    if ((await closeFinal.count()) > 0) {
      await closeFinal.first().click();
      await page.waitForTimeout(300);
    }
    return true;
  }

  if ((await closeEmptyBtn.count()) > 0) {
    await closeEmptyBtn.click();
    await page.waitForTimeout(300);
    return true;
  }

  return false;
}

export async function restAtCamp(page: Page, logger: GameLogger): Promise<boolean> {
  const btn = page.getByText("Rest & Recover").first();
  if ((await btn.count()) === 0) return false;

  await btn.click();
  await page.waitForTimeout(500);
  logger.nextTurn();
  logger.log("Rested at camp");
  return true;
}

export async function leaveTavern(page: Page, logger: GameLogger): Promise<boolean> {
  const btn = page.getByText("Leave Tavern").first();
  if ((await btn.count()) === 0) return false;

  await btn.click();
  await page.waitForTimeout(500);
  logger.nextTurn();
  logger.log("Left tavern");
  return true;
}

export async function selectSection(
  page: Page,
  logger: GameLogger,
  sectionName?: string,
): Promise<boolean> {
  const exploreBtn = page.getByText("Explore").first();
  if ((await exploreBtn.count()) === 0) return false;

  await exploreBtn.click();
  await page.waitForTimeout(500);

  const heading = page.getByRole("heading", { name: "Explore" });
  await heading.waitFor({ state: "visible", timeout: 3000 }).catch(() => {});

  let sectionRow;
  if (sectionName) {
    sectionRow = page.getByRole("dialog").getByText(sectionName).first();
  } else {
    sectionRow = page.getByRole("dialog").getByText("Explore \u2192").first();
  }

  if ((await sectionRow.count()) === 0) {
    await page.keyboard.press("Escape");
    await page.waitForTimeout(300);
    return false;
  }

  await sectionRow.click();
  await page.waitForTimeout(800);

  logger.nextTurn();
  logger.log(`Selected section${sectionName ? `: ${sectionName}` : ""}`);
  return true;
}

export async function restAtInn(page: Page, logger: GameLogger): Promise<boolean> {
  const btn = page.getByText("Rest at Inn").first();
  if ((await btn.count()) === 0) return false;

  await btn.click();
  await page.waitForTimeout(500);
  logger.nextTurn();
  logger.log("Rested at inn — party fully restored");
  return true;
}


export async function isGameOver(page: Page): Promise<boolean> {
  return (await page.getByText("Game Over").count()) > 0;
}

export async function isInCombat(page: Page): Promise<boolean> {
  const enemyImgs = page.locator('img[alt^="Enemy "]');
  if ((await enemyImgs.count()) > 0) return true;
  const targeting = page.getByText(/Select an enemy/);
  if ((await targeting.count()) > 0) return true;
  return false;
}

export async function isInTown(page: Page): Promise<boolean> {
  return (await page.getByText("Rest at Inn").count()) > 0;
}

export async function isExploring(page: Page): Promise<boolean> {
  const navBtn = page.locator('button:has(.lucide-chevron-up)');
  return (await navBtn.count()) > 0;
}

export async function hasChest(page: Page): Promise<boolean> {
  return (await page.getByText("Open Chest").count()) > 0 || (await page.getByText("You find a chest").count()) > 0;
}

export async function hasNPC(page: Page): Promise<boolean> {
  return (await page.getByText("Speak").count()) > 0 || (await page.getByText("Continue Dialogue").count()) > 0;
}

export async function hasCamp(page: Page): Promise<boolean> {
  return (await page.getByText("Rest & Recover").count()) > 0;
}

export async function isTavernOpen(page: Page): Promise<boolean> {
  return (await page.getByText("Leave Tavern").count()) > 0;
}

export async function getPartyState(page: Page) {
  const party: Array<{
    name: string;
    hp: number;
    maxHp: number;
    mp: number;
    maxMp: number;
    alive: boolean;
  }> = [];

  const allDivs = page.locator("div");
  const count = await allDivs.count();

  for (let i = 0; i < count; i++) {
    const el = allDivs.nth(i);
    const text = await el.textContent().catch(() => "");
    if (!text || text.length > 200 || text.length < 10) continue;

    const hpMatches = text.match(/HP/g);
    const mpMatches = text.match(/MP/g);
    if (!hpMatches || hpMatches.length !== 1) continue;
    if (!mpMatches || mpMatches.length !== 1) continue;

    const hpVal = text.match(/HP(\d+)\/(\d+)/);
    const mpVal = text.match(/MP(\d+)\/(\d+)/);
    if (!hpVal || !mpVal) continue;

    if (text.includes("Appears!") || text.includes("Select")) continue;

    if (text.includes("Game Over") || text.includes("Level Up")) continue;

    const hpIndex = text.indexOf("HP");
    const nameRaw = text.slice(0, hpIndex).trim();
    const name = nameRaw.replace(/[^A-Za-z\s]/g, "").trim();

    if (!name || name.length < 2) continue;

    const fallen = text.includes("FALLEN");

    party.push({
      name,
      hp: parseInt(hpVal[1]),
      maxHp: parseInt(hpVal[2]),
      mp: parseInt(mpVal[1]),
      maxMp: parseInt(mpVal[2]),
      alive: !fallen,
    });
  }

  return party;
}

export async function getActivityLog(page: Page): Promise<string[]> {
  const lines = page.locator(".log-line");
  const count = await lines.count();
  const messages: string[] = [];
  for (let i = 0; i < count; i++) {
    const text = await lines.nth(i).textContent();
    if (text) messages.push(text.trim());
  }
  return messages;
}

export async function takeScreenshot(
  page: Page,
  dir: string,
  name: string,
): Promise<void> {
  if (!dir) return;
  fs.mkdirSync(dir, { recursive: true });
  await page.screenshot({
    path: path.join(dir, `${name}.png`),
    fullPage: false,
  });
}

export async function waitFor(
  condition: () => Promise<boolean>,
  timeoutMs: number,
  intervalMs = 200,
): Promise<boolean> {
  const start = Date.now();
  while (Date.now() - start < timeoutMs) {
    if (await condition()) return true;
    await new Promise((r) => setTimeout(r, intervalMs));
  }
  return false;
}
