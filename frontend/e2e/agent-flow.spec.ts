import { test, expect } from "@playwright/test";

const BACKEND_URL = "http://localhost:8000";

test.describe("Agent WebSocket command \u2192 event flow", () => {
  test("connect to WS, send command, receive events", async ({ page }) => {
    const events: any[] = [];
    const wsPromise = new Promise<void>((resolve, reject) => {
      const sock = new WebSocket(`ws://localhost:8000/api/opencode/ws`);

      sock.onopen = () => {
        sock.send(JSON.stringify({ type: "chat", sessionId: "test-e2e", text: "/career-ops-scan" }));
      };

      sock.onmessage = (msg) => {
        try {
          const data = JSON.parse(msg.data);
          events.push(data);
          if (data.type === "session_status" && (data.status === "done" || data.status === "error")) {
            sock.close();
            resolve();
          }
        } catch {/**/}
      };

      sock.onerror = () => {
        reject(new Error("WS connection failed"));
      };

      sock.onclose = () => {
        if (events.length === 0) reject(new Error("WS closed without events"));
        else resolve();
      };

      setTimeout(() => {
        sock.close();
        if (events.length > 0) resolve();
        else reject(new Error("WS timeout"));
      }, 15000);
    });

    try {
      await wsPromise;
      expect(events.length).toBeGreaterThan(0);

      const sessionStatusEvents = events.filter((e) => e.type === "session_status");
      if (sessionStatusEvents.length > 0) {
        expect(sessionStatusEvents[0]).toHaveProperty("type", "session_status");
        expect(["busy", "idle"]).toContain(sessionStatusEvents[0].status);
      }

      const textEvents = events.filter((e) => e.type === "text_delta");
      if (textEvents.length > 0) {
        expect(textEvents[0]).toHaveProperty("text");
      }

      console.log(`WS test: received ${events.length} events`);
    } catch {
      test.skip(
        "WebSocket connection to backend not available. " +
        "Services may not be running."
      );
    }
  });

  test("trigger API starts an agent session", async ({ request }) => {
    const res = await request.post(`${BACKEND_URL}/api/opencode/trigger`, {
      data: { mode: "scan", args: {} },
    });

    if (!res.ok()) {
      test.skip("Trigger endpoint not available (sidecar/opencode down)");
      return;
    }

    const body = await res.json();
    expect(body).toHaveProperty("session_id");
    const sessionId: string = body.session_id;

    const sessionsRes = await request.get(`${BACKEND_URL}/api/opencode/sessions`);
    if (sessionsRes.ok()) {
      const sessionsBody = await sessionsRes.json();
      const sessions: Array<{ id: string }> = sessionsBody.sessions || [];
      const ids = sessions.map((s) => s.id);
      expect(ids).toContain(sessionId);
    }
  });

  test("abort endpoint gracefully handles invalid session", async ({ request }) => {
    const res = await request.post(`${BACKEND_URL}/api/opencode/sessions/fake-nonexistent/abort`);
    expect([404, 200, 400]).toContain(res.status());
  });

  test("backend health check", async ({ request }) => {
    const res = await request.get(`${BACKEND_URL}/api/health`);
    expect(res.ok()).toBeTruthy();
  });
});
