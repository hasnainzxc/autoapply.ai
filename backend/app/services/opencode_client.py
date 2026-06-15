"""HTTP client for Node.js sidecar service."""

import os
import uuid

import httpx

SIDECAR_URL = os.getenv("SIDECAR_URL", "http://localhost:4197")
HTTP_TIMEOUT = 10.0


class OpencodeClient:
    def __init__(self, base_url: str = SIDECAR_URL):
        self.base_url = base_url.rstrip("/")
        self._client = httpx.AsyncClient(timeout=HTTP_TIMEOUT)

    async def trigger_mode(self, mode: str, args: dict | None = None) -> str:
        payload = {"mode": mode, "args": args or {}}
        resp = await self._client.post(f"{self.base_url}/trigger", json=payload)
        resp.raise_for_status()
        data = resp.json()
        return data.get("session_id", str(uuid.uuid4()))

    async def get_session(self, session_id: str) -> dict:
        resp = await self._client.get(f"{self.base_url}/sessions/{session_id}")
        if resp.status_code == 404:
            return {}
        resp.raise_for_status()
        return resp.json().get("session", {})

    async def list_sessions(self) -> list[dict]:
        resp = await self._client.get(f"{self.base_url}/sessions")
        resp.raise_for_status()
        return resp.json().get("sessions", [])

    async def get_session_events(self, session_id: str, since: int | None = None) -> list[dict]:
        params = {"since": str(since)} if since is not None else {}
        resp = await self._client.get(f"{self.base_url}/sessions/{session_id}/events", params=params)
        resp.raise_for_status()
        return resp.json().get("events", [])

    async def get_session_result(self, session_id: str) -> dict:
        resp = await self._client.get(f"{self.base_url}/sessions/{session_id}/result")
        if resp.status_code == 404:
            return {}
        resp.raise_for_status()
        return resp.json()

    async def abort_session(self, session_id: str) -> dict:
        resp = await self._client.post(f"{self.base_url}/sessions/{session_id}/abort")
        resp.raise_for_status()
        return resp.json()

    async def get_health(self) -> dict:
        try:
            resp = await self._client.get(f"{self.base_url}/health", timeout=5)
            return resp.json()
        except Exception as e:
            return {"status": "unreachable", "error": str(e)}

    async def get_modes(self) -> list[dict]:
        try:
            resp = await self._client.get(f"{self.base_url}/modes", timeout=5)
            return resp.json().get("modes", [])
        except Exception:
            return []

    async def close(self):
        await self._client.aclose()


_client_instance: OpencodeClient | None = None


def get_client() -> OpencodeClient:
    global _client_instance
    if _client_instance is None:
        _client_instance = OpencodeClient()
    return _client_instance
