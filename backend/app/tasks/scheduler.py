"""APScheduler setup for background tasks (SLA monitoring, cleanup)."""

import asyncio

from apscheduler.schedulers.asyncio import AsyncIOScheduler
from apscheduler.triggers.interval import IntervalTrigger

from app.config import settings

scheduler = AsyncIOScheduler()


def _run_sla_check():
    """Wrapper to run async SLA check from scheduler."""
    from app.services.sla import check_sla_compliance
    asyncio.create_task(check_sla_compliance())


def start_scheduler():
    """Start the background task scheduler."""
    # SLA compliance check
    scheduler.add_job(
        _run_sla_check,
        trigger=IntervalTrigger(minutes=settings.sla_check_interval_minutes),
        id="sla_check",
        name="SLA Compliance Check",
        replace_existing=True,
    )

    scheduler.start()
    print(f"[OpenWebDav] Scheduler started (SLA check every {settings.sla_check_interval_minutes}m)")


def stop_scheduler():
    """Stop the background task scheduler."""
    if scheduler.running:
        scheduler.shutdown(wait=False)
