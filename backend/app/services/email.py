"""Email notification service."""

import logging

from app.config import settings

logger = logging.getLogger(__name__)


async def send_sla_alert_email(violation: dict):
    """Send an SLA violation alert email."""
    if not settings.smtp_host:
        logger.warning("SMTP not configured, skipping email alert")
        return

    from email.mime.text import MIMEText

    import aiosmtplib

    subject = f"[OpenWebDav] SLA Violation: {violation['policy_name']}"
    body = (
        f"SLA Policy Violation Detected\n\n"
        f"Policy: {violation['policy_name']}\n"
        f"Expected frequency: every {violation['expected_hours']} hours\n"
        f"Last activity: {violation['last_activity'] or 'Never'}\n\n"
        f"Please check the affected storage destination."
    )

    msg = MIMEText(body)
    msg["Subject"] = subject
    msg["From"] = settings.sla_alert_email_from
    msg["To"] = violation["alert_email"]

    try:
        await aiosmtplib.send(
            msg,
            hostname=settings.smtp_host,
            port=settings.smtp_port,
            username=settings.smtp_user,
            password=settings.smtp_password,
            use_tls=settings.smtp_use_tls,
        )
        logger.info(f"SLA alert email sent to {violation['alert_email']}")
    except Exception as e:
        logger.error(f"Failed to send email: {e}")
