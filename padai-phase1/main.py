"""
PadAI Master Server - Phase 1 MVP
FastAPI server for multi-agent Beads coordination.
"""
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from pydantic import BaseModel
from typing import List, Dict, Any, Optional
import os

from beads import (
    get_status,
    get_ready_tasks,
    get_all_tasks,
    claim_task,
    complete_task,
    BeadsError
)

app = FastAPI(title="PadAI Master Server", version="0.1.0")

# CORS for React frontend
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # In production, specify your frontend domain
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Workspace path (should contain .beads/ folder)
WORKSPACE = os.getenv("WORKSPACE_PATH", "/workspace")


# Request/Response models
class ClaimRequest(BaseModel):
    agent_name: str


class CompleteRequest(BaseModel):
    task_id: str


class StatusResponse(BaseModel):
    total: int
    ready: int
    in_progress: int
    completed: int


# Endpoints

@app.get("/")
async def root():
    """Health check endpoint."""
    return {"status": "ok", "service": "PadAI Master Server"}


@app.get("/api/status", response_model=StatusResponse)
async def api_status():
    """
    Get current project status with task counts.

    Example response:
    {
        "total": 18,
        "ready": 5,
        "in_progress": 2,
        "completed": 11
    }
    """
    try:
        status = get_status(WORKSPACE)
        return StatusResponse(**status)
    except BeadsError as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.get("/api/ready")
async def api_ready():
    """
    Get list of tasks ready to be claimed.

    Example response:
    [
        {"id": "padai-4", "title": "GET /api/status endpoint", "status": "ready"}
    ]
    """
    try:
        tasks = get_ready_tasks(WORKSPACE)
        return {"tasks": tasks}
    except BeadsError as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.get("/api/tasks")
async def api_tasks():
    """
    Get all tasks with full details including dependencies.

    Used by React Flow visualization to build dependency graph.

    Example response:
    {
        "tasks": [
            {
                "id": "padai-1",
                "title": "Design PadAI architecture",
                "status": "completed",
                "dependencies": [...]
            }
        ]
    }
    """
    try:
        tasks = get_all_tasks(WORKSPACE)
        return {"tasks": tasks}
    except BeadsError as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.post("/api/claim")
async def api_claim(request: ClaimRequest):
    """
    Claim the next available task for an agent.

    Request body:
    {
        "agent_name": "agent-1"
    }

    Response:
    {
        "task": {
            "id": "padai-4",
            "title": "GET /api/status endpoint",
            "status": "in_progress",
            "assignee": "agent-1"
        }
    }

    Returns 404 if no tasks are ready.
    """
    try:
        task = claim_task(request.agent_name, WORKSPACE)

        if task is None:
            raise HTTPException(status_code=404, detail="No tasks available")

        return {"task": task}

    except BeadsError as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.post("/api/complete")
async def api_complete(request: CompleteRequest):
    """
    Mark a task as completed.

    Request body:
    {
        "task_id": "padai-4"
    }

    Response:
    {
        "success": true,
        "task_id": "padai-4"
    }
    """
    try:
        success = complete_task(request.task_id, WORKSPACE)

        if not success:
            raise HTTPException(status_code=500, detail="Failed to complete task")

        return {"success": True, "task_id": request.task_id}

    except BeadsError as e:
        raise HTTPException(status_code=500, detail=str(e))


# Serve React frontend (if built)
if os.path.exists("frontend/dist"):
    app.mount("/", StaticFiles(directory="frontend/dist", html=True), name="frontend")


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
