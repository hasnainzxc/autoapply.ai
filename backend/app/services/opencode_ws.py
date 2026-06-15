"""FastAPI WebSocket proxy for OpenCode sidecar event streaming.

Placeholder for Wave 3. Full implementation in Wave 5.
"""

from fastapi import APIRouter, WebSocket, WebSocketDisconnect

router = APIRouter()


@router.websocket("/api/opencode/ws")
async def opencode_websocket(websocket: WebSocket):
    """WebSocket proxy endpoint - placeholder."""
    await websocket.accept()
    try:
        while True:
            data = await websocket.receive_text()
            if data == '{"type":"ping"}':
                await websocket.send_text('{"type":"pong"}')
            else:
                await websocket.send_text(
                    '{"type":"event","event":{"type":"text_delta","text":"placeholder","sessionId":"","timestamp":0}}'
                )
    except WebSocketDisconnect:
        pass
