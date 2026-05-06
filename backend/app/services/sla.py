"""SLA monitoring background service.

Checks for users/storage destinations that haven't received activity
within their configured SLA window and triggers alerts.
"""

import logging
from datetime import UTC, datetime, timedelta

from sqlalchemy import func, select

from app.database import async_session
from app.models.activity import ActivityLog
from app.models.settings import SLAPolicy

logger = logging.getLogger(__name__)


async def check_sla_compliance():
    """
    Check all active SLA policies and identify violations.

    A violation occurs when the last activity for a user/storage combination
    exceeds the expected_frequency_hours defined in the policy.
    """
    async with async_session() as session:
        # Get all active SLA policies
        result = await session.execute(select(SLAPolicy).where(SLAPolicy.is_active.is_(True)))
        policies = result.scalars().all()

        if not policies:
            return []

        violations = []
        now = datetime.now(UTC)

        for policy in policies:
            cutoff = now - timedelta(hours=policy.expected_frequency_hours)

            # Build query for last activity
            query = select(func.max(ActivityLog.timestamp)).where(
                ActivityLog.storage_id == policy.storage_id
            )
            if policy.user_id:
                query = query.where(ActivityLog.user_id == policy.user_id)

            result = await session.execute(query)
            last_activity = result.scalar_one_or_none()

            if last_activity is None or last_activity < cutoff:
                # Violation found
                violation = {
                    "policy_id": policy.id,
                    "policy_name": policy.name,
                    "user_id": policy.user_id,
                    "storage_id": policy.storage_id,
                    "expected_hours": policy.expected_frequency_hours,
                    "last_activity": last_activity.isoformat() if last_activity else None,
                    "alert_webhook": policy.alert_webhook,
                    "alert_email": policy.alert_email,
                }
                violations.append(violation)

        # Send alerts for violations
        for violation in violations:
            await _send_alert(violation)

        if violations:
            logger.warning(f"SLA check found {len(violations)} violation(s)")
        else:
            logger.info("SLA check: all policies compliant")

        return violations


async def _send_alert(violation: dict):
    """Send alert for an SLA violation via webhook or email."""
    # Webhook alert
    if violation.get("alert_webhook"):
        try:
            import httpx

            async with httpx.AsyncClient() as client:
                await client.post(
                    violation["alert_webhook"],
                    json={
                        "type": "sla_violation",
                        "policy": violation["policy_name"],
                        "last_activity": violation["last_activity"],
                        "expected_hours": violation["expected_hours"],
                    },
                    timeout=10,
                )
                logger.info(f"Webhook alert sent for policy: {violation['policy_name']}")
        except Exception as e:
            logger.error(f"Failed to send webhook alert: {e}")

    # Email alert
    if violation.get("alert_email"):
        try:
            from app.services.email import send_sla_alert_email

            await send_sla_alert_email(violation)
        except Exception as e:
            logger.error(f"Failed to send email alert: {e}")


def start_sla_scheduler():
    """Start the APScheduler background job for SLA monitoring."""
    from apscheduler.schedulers.asyncio import AsyncIOScheduler

    from app.config import settings

    scheduler = AsyncIOScheduler()
    scheduler.add_job(
        check_sla_compliance,
        "interval",
        minutes=settings.sla_check_interval_minutes,
        id="sla_check",
        replace_existing=True,
    )
    scheduler.start()
    logger.info(f"SLA scheduler started (interval: {settings.sla_check_interval_minutes} min)")
    return scheduler
