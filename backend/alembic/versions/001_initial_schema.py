"""Initial schema.

Revision ID: 001
Revises:
Create Date: 2026-05-06
"""

import sqlalchemy as sa

from alembic import op

revision = "001"
down_revision = None
branch_labels = None
depends_on = None


def upgrade() -> None:
    # Users
    op.create_table(
        "users",
        sa.Column("id", sa.String(36), primary_key=True),
        sa.Column("username", sa.String(100), unique=True, index=True, nullable=False),
        sa.Column("email", sa.String(255), unique=True, index=True, nullable=False),
        sa.Column("password_hash", sa.String(255), nullable=True),
        sa.Column(
            "auth_provider",
            sa.Enum("local", "oidc", name="auth_provider_enum"),
            nullable=False,
            server_default="local",
        ),
        sa.Column("oidc_subject", sa.String(255), nullable=True),
        sa.Column(
            "role",
            sa.Enum("admin", "user", "readonly", name="role_enum"),
            nullable=False,
            server_default="user",
        ),
        sa.Column("is_active", sa.Boolean(), nullable=False, server_default="1"),
        sa.Column("quota_bytes", sa.BigInteger(), nullable=True),
        sa.Column("created_at", sa.DateTime(), nullable=False, server_default=sa.func.now()),
        sa.Column("last_login", sa.DateTime(), nullable=True),
    )

    # Storage Destinations
    op.create_table(
        "storage_destinations",
        sa.Column("id", sa.String(36), primary_key=True),
        sa.Column("name", sa.String(200), unique=True, nullable=False),
        sa.Column(
            "provider_type",
            sa.Enum("local", "s3", "nfs", "azure", name="provider_type_enum"),
            nullable=False,
        ),
        sa.Column("config", sa.JSON(), nullable=False, server_default="{}"),
        sa.Column("is_active", sa.Boolean(), nullable=False, server_default="1"),
        sa.Column("created_at", sa.DateTime(), nullable=False, server_default=sa.func.now()),
    )

    # Access Controls
    op.create_table(
        "access_controls",
        sa.Column("id", sa.String(36), primary_key=True),
        sa.Column(
            "user_id", sa.String(36), sa.ForeignKey("users.id", ondelete="CASCADE"), nullable=False
        ),
        sa.Column(
            "storage_id",
            sa.String(36),
            sa.ForeignKey("storage_destinations.id", ondelete="CASCADE"),
            nullable=False,
        ),
        sa.Column(
            "permission",
            sa.Enum("read", "write", "admin", name="permission_enum"),
            nullable=False,
            server_default="read",
        ),
        sa.Column("path_prefix", sa.String(500), nullable=True),
    )

    # Activity Logs
    op.create_table(
        "activity_logs",
        sa.Column("id", sa.String(36), primary_key=True),
        sa.Column(
            "user_id", sa.String(36), sa.ForeignKey("users.id", ondelete="SET NULL"), nullable=True
        ),
        sa.Column(
            "storage_id",
            sa.String(36),
            sa.ForeignKey("storage_destinations.id", ondelete="SET NULL"),
            nullable=True,
        ),
        sa.Column(
            "action",
            sa.Enum("upload", "download", "delete", "mkdir", "move", "copy", name="action_enum"),
            nullable=False,
        ),
        sa.Column("file_path", sa.String(1000), nullable=False),
        sa.Column("file_size", sa.BigInteger(), nullable=True),
        sa.Column(
            "timestamp", sa.DateTime(), nullable=False, server_default=sa.func.now(), index=True
        ),
    )

    # File Versions
    op.create_table(
        "file_versions",
        sa.Column("id", sa.String(36), primary_key=True),
        sa.Column(
            "storage_id",
            sa.String(36),
            sa.ForeignKey("storage_destinations.id", ondelete="CASCADE"),
            nullable=False,
        ),
        sa.Column("file_path", sa.String(1000), nullable=False, index=True),
        sa.Column("version", sa.Integer(), nullable=False),
        sa.Column("size", sa.BigInteger(), nullable=False),
        sa.Column("checksum", sa.String(64), nullable=False),
        sa.Column(
            "created_by",
            sa.String(36),
            sa.ForeignKey("users.id", ondelete="SET NULL"),
            nullable=True,
        ),
        sa.Column("created_at", sa.DateTime(), nullable=False, server_default=sa.func.now()),
    )

    # Theme Settings
    op.create_table(
        "theme_settings",
        sa.Column("id", sa.String(36), primary_key=True),
        sa.Column("app_name", sa.String(100), nullable=False, server_default="OpenWebDav"),
        sa.Column("primary_color", sa.String(7), nullable=False, server_default="#1976d2"),
        sa.Column("secondary_color", sa.String(7), nullable=False, server_default="#dc004e"),
        sa.Column("logo_path", sa.String(500), nullable=True),
        sa.Column("favicon_path", sa.String(500), nullable=True),
        sa.Column("dark_mode_default", sa.Boolean(), nullable=False, server_default="0"),
    )

    # SLA Policies
    op.create_table(
        "sla_policies",
        sa.Column("id", sa.String(36), primary_key=True),
        sa.Column("name", sa.String(200), nullable=False),
        sa.Column(
            "user_id", sa.String(36), sa.ForeignKey("users.id", ondelete="CASCADE"), nullable=True
        ),
        sa.Column(
            "storage_id",
            sa.String(36),
            sa.ForeignKey("storage_destinations.id", ondelete="CASCADE"),
            nullable=False,
        ),
        sa.Column("expected_frequency_hours", sa.Integer(), nullable=False, server_default="24"),
        sa.Column("alert_webhook", sa.String(500), nullable=True),
        sa.Column("alert_email", sa.String(255), nullable=True),
        sa.Column("is_active", sa.Boolean(), nullable=False, server_default="1"),
    )


def downgrade() -> None:
    op.drop_table("sla_policies")
    op.drop_table("theme_settings")
    op.drop_table("file_versions")
    op.drop_table("activity_logs")
    op.drop_table("access_controls")
    op.drop_table("storage_destinations")
    op.drop_table("users")
