"""FastAPI WebSocket proxy for OpenCode sidecar event streaming."""

import asyncio
import json
import os
import websockets
from fastapi import APIRouter, WebSocket, WebSocketDisconnect

router = APIRouter()

SIDECAR_WS_URL = os.getenv("SIDECAR_WS_URL", "ws://localhost:4197")

@router.websocket("/api/opencode/ws")
async def opencode_websocket(websocket: WebSocket):
    """WebSocket proxy endpoint linking frontend to sidecar."""
    await websocket.accept()
    
    try:
        async with websockets.connect(SIDECAR_WS_URL) as sidecar_ws:
            async def forward_to_client():
                try:
                    async for message in sidecar_ws:
                        await websocket.send_text(message)
                except Exception:
                    pass

            async def forward_to_sidecar():
                try:
                    while True:
                        data = await websocket.receive_text()
                        await sidecar_ws.send(data)
                except WebSocketDisconnect:
                    pass
                except Exception:
                    pass

            await asyncio.gather(
                forward_to_client(),
                forward_to_sidecar(),
            )
    except Exception as e:
        print(f"WS proxy connection error: {e}")
        try:
            await websocket.close()
        except:
            pass
