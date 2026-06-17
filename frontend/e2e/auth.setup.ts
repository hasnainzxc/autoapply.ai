import { test as setup, expect } from "@playwright/test";

const TEST_EMAIL = "test-e2e@applymate.dev";

setup("sign in with Clerk dev OTP", async ({ page }) => {
  await page.goto("/sign-in");
  await page.waitForSelector("input", { timeout: 10000 });

  // Fill email
  const emailInput = page.locator('input[type="email"], input[name="identifier"]').first();
  await expect(emailInput).toBeVisible({ timeout: 10000 });
  await emailInput.fill(TEST_EMAIL);

  // Click Continue
  const submitBtn = page.locator('button[type="submit"]').first();
  await submitBtn.click();

  // Wait for OTP inputs (6 digits)
  const otpInputs = page.locator('input[inputmode="numeric"], input[maxlength="1"]');
  await expect(otpInputs.first()).toBeVisible({ timeout: 15000 });

  // Clerk dev OTP code is always 424242
  const code = "424242";
  const digits = otpInputs;
  const count = await digits.count();
  if (count >= 6) {
    for (let i = 0; i < 6; i++) {
      await digits.nth(i).fill(code[i]);
      await page.waitForTimeout(50);
    }
  } else {
    // Single input OTP (less common but possible)
    await page.locator('input[inputmode="numeric"]').first().fill(code);
  }

  // Wait for redirect to the post-sign-in URL (configured as /resumes)
  await page.waitForURL(/resumes/, { timeout: 20000 });

  // Save signed-in state
  await page.context().storageState({ path: "e2e/.auth/user.json" });
});
