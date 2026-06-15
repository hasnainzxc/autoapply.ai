from fastapi import APIRouter, HTTPException
from app.services.opencode_client import get_client

router = APIRouter()
client = get_client()


@router.get("/opencode/health")
async def opencode_health():
    health = await client.get_health()
    return health


@router.get("/opencode/modes")
async def list_opencode_modes():
    modes = await client.get_modes()
    return {"modes": modes}


@router.post("/opencode/trigger")
async def trigger_opencode_mode(mode: str, args: dict | None = None):
    session_id = await client.trigger_mode(mode, args or {})
    return {"session_id": session_id, "mode": mode, "status": "started"}


@router.get("/opencode/sessions")
async def list_opencode_sessions():
    sessions = await client.list_sessions()
    return {"sessions": sessions}


@router.get("/opencode/sessions/{session_id}")
async def get_opencode_session(session_id: str):
    session = await client.get_session(session_id)
    if not session:
        raise HTTPException(status_code=404, detail="session not found")
    return {"session": session}


@router.get("/opencode/sessions/{session_id}/events")
async def get_opencode_session_events(session_id: str, since: int | None = None):
    events = await client.get_session_events(session_id, since)
    return {"events": events}


@router.get("/opencode/sessions/{session_id}/result")
async def get_opencode_session_result(session_id: str):
    result = await client.get_session_result(session_id)
    if not result:
        raise HTTPException(status_code=404, detail="session not found")
    return result


@router.post("/opencode/sessions/{session_id}/abort")
async def abort_opencode_session(session_id: str):
    result = await client.abort_session(session_id)
    return result
