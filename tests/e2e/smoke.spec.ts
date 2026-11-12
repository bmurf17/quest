import { expect, test } from "@playwright/test";

test("home page renders and links into the party flow", async ({ page }) => {
  await page.goto("/");

  await expect(page.getByRole("heading", { name: "Qwest" })).toBeVisible();
  const startLink = page.getByRole("link", { name: /begin adventure/i });
  await expect(startLink).toHaveAttribute("href", "/party");
});

test("party management route renders", async ({ page }) => {
  await page.goto("/party");

  await expect(page.getByText("Your Party").first()).toBeVisible();
});
