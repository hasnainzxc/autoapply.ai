import { test, expect } from "@playwright/test";

const BACKEND_URL = "http://localhost:8000";

test.describe("Backend API integration", () => {
  test("health endpoint returns 200", async ({ request }) => {
    const res = await request.get(`${BACKEND_URL}/api/health`);
    expect(res.ok()).toBeTruthy();
    const body = await res.json();
    expect(body).toHaveProperty("status");
  });

  test("modes endpoint returns OpenCode agent modes", async ({ request }) => {
    const res = await request.get(`${BACKEND_URL}/api/opencode/modes`);
    // 200 if sidecar connected, 503 if not
    if (res.ok()) {
      const body = await res.json();
      expect(body).toHaveProperty("modes");
    } else {
      // Sidecar might not be connected — log and accept
      console.warn("Modes endpoint not available:", res.status());
      expect(res.status()).toBe(503);
    }
  });

  test("trigger endpoint returns session ID or error", async ({ request }) => {
    const res = await request.post(`${BACKEND_URL}/api/opencode/trigger`, {
      data: { mode: "scan", args: {} },
    });
    if (res.ok()) {
      const body = await res.json();
      expect(body).toHaveProperty("session_id");
    } else {
      // Sidecar unavailable is expected if not all services running
      expect([400, 503]).toContain(res.status());
    }
  });

  test("sessions list endpoint", async ({ request }) => {
    const res = await request.get(`${BACKEND_URL}/api/opencode/sessions`);
    if (res.ok()) {
      const body = await res.json();
      expect(body).toHaveProperty("sessions");
    } else {
      expect([503, 200]).toContain(res.status());
    }
  });

  test("WebSocket endpoint responds at WS URL level", async ({ page }) => {
    // Verify the WS upgrade URL exists by checking the HTTP upgrade headers
    const res = await page.request.fetch(`${BACKEND_URL}/api/opencode/ws`, {
      method: "GET",
      headers: { Upgrade: "websocket", Connection: "Upgrade" },
    });
    // WebSocket upgrade returns 101, non-WS request returns 400/426
    expect([101, 400, 426]).toContain(res.status());
  });
});
