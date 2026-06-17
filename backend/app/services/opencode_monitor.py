"""OpenCode sidecar health monitor.

Placeholder for Wave 3. Full implementation in Wave 5.
"""

import asyncio
import logging

logger = logging.getLogger(__name__)

_sidecar_connected = False


def is_sidecar_connected() -> bool:
    return _sidecar_connected


async def monitor_sidecar(sidecar_url: str = "http://localhost:4197", interval: int = 30):
    """Background task: ping sidecar health endpoint."""
    global _sidecar_connected

    import httpx

    async with httpx.AsyncClient() as client:
        while True:
            try:
                resp = await client.get(f"{sidecar_url}/health", timeout=5)
                if resp.status_code == 200:
                    if not _sidecar_connected:
                        logger.info("sidecar connected")
                    _sidecar_connected = True
                else:
                    _sidecar_connected = False
                    logger.warning(f"sidecar unhealthy: {resp.status_code}")
            except Exception as e:
                if _sidecar_connected:
                    logger.warning(f"sidecar disconnected: {e}")
                _sidecar_connected = False

            await asyncio.sleep(interval)
