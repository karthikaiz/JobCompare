"""
Batch scrape endpoint — runs batch.py then pipeline.py as background subprocesses.
Exposes POST /scrape, GET /scrape/status, GET /scrape/logs.

Full flow:
  1. batch.py  → scrapes AmbitionBox → saves JSON to data/scraped/
  2. pipeline.py → sentiment enrichment → POST to /api/sync → written to DB
"""

import asyncio
import json
from datetime import datetime
from pathlib import Path
from typing import Literal

from fastapi import APIRouter, HTTPException
from pydantic import BaseModel

router = APIRouter()

SCRAPER_DIR = Path(__file__).parent.parent
BATCH_SCRIPT = SCRAPER_DIR / "batch.py"
PIPELINE_SCRIPT = SCRAPER_DIR / "pipeline.py"
STATUS_FILE = SCRAPER_DIR / "data" / "scrape_status.json"
RUN_FILE = SCRAPER_DIR / "data" / "scrape_run.json"
LOG_FILE = SCRAPER_DIR / "data" / "scrape_run.log"

_task: asyncio.Task | None = None
_run_meta: dict = {}


class ScrapeRequest(BaseModel):
    mode: Literal["all", "failed", "custom"] = "all"
    slugs: list[str] = []          # used only when mode="custom"
    max_reviews: int = 5
    max_salaries: int = 15
    auto_sync: bool = True


def _load_status() -> dict:
    if STATUS_FILE.exists():
        with open(STATUS_FILE) as f:
            return json.load(f)
    return {}


def _load_run() -> dict:
    if RUN_FILE.exists():
        with open(RUN_FILE) as f:
            return json.load(f)
    return {}


def _save_run(meta: dict):
    RUN_FILE.parent.mkdir(parents=True, exist_ok=True)
    with open(RUN_FILE, "w") as f:
        json.dump(meta, f, indent=2, default=str)


def _log(msg: str):
    ts = datetime.utcnow().strftime("%H:%M:%S")
    with open(LOG_FILE, "a") as f:
        f.write(f"[{ts}] {msg}\n")


async def _stream_subprocess(proc: asyncio.subprocess.Process):
    assert proc.stdout is not None
    while True:
        line = await proc.stdout.readline()
        if not line:
            break
        _log(line.decode(errors="replace").rstrip())


async def _run_pipeline(req: ScrapeRequest):
    global _run_meta

    LOG_FILE.parent.mkdir(parents=True, exist_ok=True)
    LOG_FILE.write_text("")

    # Build batch command args based on mode
    if req.mode == "custom" and req.slugs:
        mode_args = ["--slugs", ",".join(req.slugs)]
        mode_label = f"custom ({len(req.slugs)} companies)"
    elif req.mode == "failed":
        mode_args = ["--failed"]
        mode_label = "failed companies"
    else:
        mode_args = ["--all"]
        mode_label = "all companies"

    batch_cmd = [
        "python3", str(BATCH_SCRIPT),
        *mode_args,
        "--max-reviews", str(req.max_reviews),
        "--max-salaries", str(req.max_salaries),
    ]

    _log(f"=== SCRAPE START — {mode_label} ===")
    _log(f"Command: {' '.join(batch_cmd)}")
    _log("")

    _run_meta["phase"] = "scraping"
    _run_meta["batch_cmd"] = " ".join(batch_cmd)
    _save_run(_run_meta)

    try:
        proc = await asyncio.create_subprocess_exec(
            *batch_cmd,
            cwd=str(SCRAPER_DIR),
            stdout=asyncio.subprocess.PIPE,
            stderr=asyncio.subprocess.STDOUT,
        )
        _run_meta["batch_pid"] = proc.pid
        _save_run(_run_meta)
        await asyncio.gather(_stream_subprocess(proc), proc.wait())
        _run_meta["batch_exit"] = proc.returncode
    except Exception as e:
        _log(f"ERROR: {e}")
        _run_meta["phase"] = "error"
        _run_meta["error"] = str(e)
        _run_meta["finished_at"] = datetime.utcnow().isoformat()
        _save_run(_run_meta)
        return

    if req.auto_sync:
        _log("")
        _log("=== PIPELINE SYNC START ===")
        _log("Command: python3 pipeline.py")
        _log("")

        _run_meta["phase"] = "syncing"
        _save_run(_run_meta)

        pipeline_cmd = ["python3", str(PIPELINE_SCRIPT)]
        try:
            proc2 = await asyncio.create_subprocess_exec(
                *pipeline_cmd,
                cwd=str(SCRAPER_DIR),
                stdout=asyncio.subprocess.PIPE,
                stderr=asyncio.subprocess.STDOUT,
            )
            _run_meta["pipeline_pid"] = proc2.pid
            _save_run(_run_meta)
            await asyncio.gather(_stream_subprocess(proc2), proc2.wait())
            _run_meta["pipeline_exit"] = proc2.returncode
        except Exception as e:
            _log(f"ERROR: {e}")
            _run_meta["pipeline_error"] = str(e)

    _log("")
    _log("=== ALL DONE ===")
    _run_meta["phase"] = "done"
    _run_meta["finished_at"] = datetime.utcnow().isoformat()
    _save_run(_run_meta)


@router.post("/scrape")
async def start_scrape(req: ScrapeRequest):
    global _task, _run_meta

    if _task is not None and not _task.done():
        raise HTTPException(status_code=409, detail="A scrape is already running.")

    if req.mode == "custom" and not req.slugs:
        raise HTTPException(status_code=400, detail="mode=custom requires at least one slug.")

    _run_meta = {
        "started_at": datetime.utcnow().isoformat(),
        "mode": req.mode,
        "slugs": req.slugs,
        "max_reviews": req.max_reviews,
        "max_salaries": req.max_salaries,
        "auto_sync": req.auto_sync,
        "phase": "starting",
    }
    _save_run(_run_meta)
    _task = asyncio.create_task(_run_pipeline(req))

    label = f"{len(req.slugs)} companies" if req.mode == "custom" else req.mode
    return {"started": True, "message": f"Scrape started ({label}). Poll /scrape/status and /scrape/logs."}


@router.get("/scrape/status")
async def scrape_status():
    running = _task is not None and not _task.done()
    run_meta = _load_run()
    status = _load_status()

    scraped = sum(1 for v in status.values() if v.get("status") == "success")
    failed_count = sum(1 for v in status.values() if v.get("status") == "failed")

    return {
        "running": running,
        "phase": run_meta.get("phase"),
        "mode": run_meta.get("mode"),
        "slugs": run_meta.get("slugs", []),
        "auto_sync": run_meta.get("auto_sync"),
        "max_reviews": run_meta.get("max_reviews"),
        "max_salaries": run_meta.get("max_salaries"),
        "started_at": run_meta.get("started_at"),
        "finished_at": run_meta.get("finished_at"),
        "companies": {"scraped": scraped, "failed": failed_count, "total": len(status)},
    }


@router.get("/scrape/logs")
async def scrape_logs(tail: int = 200):
    if not LOG_FILE.exists():
        return {"lines": [], "total": 0}
    lines = LOG_FILE.read_text(errors="replace").splitlines()
    return {"lines": lines[-tail:], "total": len(lines)}
