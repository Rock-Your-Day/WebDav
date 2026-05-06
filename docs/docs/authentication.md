# Authentication

OpenWebDav supports two authentication methods that can work independently or together.

## Local Users

Local users are managed directly in OpenWebDav. They authenticate with username and password.

### Creating Users

1. Go to **Users > Add User** in the admin portal
2. Fill in username, email, and password
3. Assign a role (Admin, User, or Read-Only)
4. Optionally set a storage quota

## OIDC / SSO

OpenWebDav integrates with any OpenID Connect provider (Keycloak, Okta, Azure AD, Auth0, etc.).

### Setup

1. Go to **Settings > OIDC Configuration**
2. Enter your provider details:
   - Provider URL (e.g., `https://keycloak.example.com/realms/myrealm`)
   - Client ID
   - Client Secret
   - Scopes (default: `openid profile email`)
3. Enable OIDC

### User Provisioning

When a user logs in via OIDC for the first time, an account is automatically created with the `user` role. Admins can then adjust roles and permissions.

### Local Fallback

When OIDC is enabled, local authentication remains available as a fallback. This ensures admin access even if the OIDC provider is unavailable.

## WebDAV Authentication

WebDAV clients can authenticate using:

- **Basic Auth**: Username and password (works with all clients)
- **Bearer Token**: JWT token in the Authorization header

## Roles

| Role | Permissions |
|------|-------------|
| Admin | Full access to all features and settings |
| User | Access to assigned storage destinations (read/write) |
| Read-Only | View-only access to assigned storage destinations |
