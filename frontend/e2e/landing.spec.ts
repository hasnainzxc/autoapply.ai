import { test, expect } from "@playwright/test";

test.describe("Landing page (unauthenticated)", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/");
  });

  test("page loads with correct title and meta", async ({ page }) => {
    await expect(page).toHaveTitle(/ApplyMate/);
    const heading = page.locator("h1").first();
    await expect(heading).toBeVisible();
  });

  test("navbar renders logo, Sign In and Get Started buttons", async ({ page }) => {
    const logo = page.locator('a:has-text("ApplyMate")');
    await expect(logo).toBeVisible();

    const signIn = page.getByRole("navigation").getByRole("button", { name: "Sign In" });
    const getStarted = page.getByRole("navigation").getByRole("button", { name: "Get Started" });
    await expect(signIn).toBeVisible();
    await expect(getStarted).toBeVisible();
  });

  test("Agent button NOT present without auth", async ({ page }) => {
    const agentBtn = page.locator('button:has-text("Agent")');
    await expect(agentBtn).toHaveCount(0);
  });

  test("features section is visible with all 4 cards", async ({ page }) => {
    const features = [
      "AI Resume Tailoring",
      "Cover Letters",
      "Auto-Apply",
      "Smart Tracking",
    ];
    for (const f of features) {
      await expect(page.locator(`text=${f}`).first()).toBeVisible();
    }
  });

  test("Get Started navigates to sign-up", async ({ page }) => {
    const getStarted = page.getByRole("navigation").getByRole("button", { name: "Get Started" });
    await getStarted.click();
    await page.waitForURL("/sign-up", { timeout: 15000 });
  });

  test("Sign In navigates to sign-in", async ({ page }) => {
    const signIn = page.getByRole("navigation").getByRole("button", { name: "Sign In" });
    await signIn.click();
    await page.waitForURL("/sign-in", { timeout: 15000 });
  });
});
