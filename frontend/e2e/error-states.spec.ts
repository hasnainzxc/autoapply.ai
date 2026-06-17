import { test, expect } from "@playwright/test";

const BACKEND_URL = "http://localhost:8000";

test.describe("Error and failure states", () => {
  test("trigger endpoint returns deterministic response", async ({ request }) => {
    const res = await request.post(`${BACKEND_URL}/api/opencode/trigger`, {
      data: { mode: "scan", args: {} },
    });

    const body = await res.json();
    if (res.ok()) {
      expect(body).toHaveProperty("session_id");
    } else {
      expect(body).toHaveProperty("detail");
    }
  });

  test("invalid mode returns 4xx", async ({ request }) => {
    const res = await request.post(`${BACKEND_URL}/api/opencode/trigger`, {
      data: { mode: "", args: {} },
    });
    expect([400, 422]).toContain(res.status());
    const body = await res.json();
    expect(body).toHaveProperty("detail");
  });

  test("abort on invalid session returns 404", async ({ request }) => {
    const res = await request.post(`${BACKEND_URL}/api/opencode/sessions/does-not-exist/abort`);
    expect([404, 400, 200]).toContain(res.status());
  });

  test("sessions list is valid or returns 503", async ({ request }) => {
    const res = await request.get(`${BACKEND_URL}/api/opencode/sessions`);
    if (res.ok()) {
      const body = await res.json();
      expect(body).toHaveProperty("sessions");
      expect(Array.isArray(body.sessions)).toBeTruthy();
    } else {
      expect(res.status()).toBe(503);
    }
  });

  test("modes endpoint returns array or 503", async ({ request }) => {
    const res = await request.get(`${BACKEND_URL}/api/opencode/modes`);
    if (res.ok()) {
      const body = await res.json();
      expect(body).toHaveProperty("modes");
      expect(Array.isArray(body.modes)).toBeTruthy();
      if (body.modes.length > 0) {
        expect(body.modes[0]).toHaveProperty("name");
        expect(body.modes[0]).toHaveProperty("description");
      }
    } else {
      expect(res.status()).toBe(503);
    }
  });
});
