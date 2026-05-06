# Security Policy

## Supported Versions

| Version | Supported          |
| ------- | ------------------ |
| 0.1.x   | :white_check_mark: |

## Reporting a Vulnerability

If you discover a security vulnerability in OpenWebDav, please report it responsibly.

**Do NOT open a public GitHub issue for security vulnerabilities.**

Instead, please email: **security@openwebdav.local** (replace with your actual security contact)

Or use GitHub's private vulnerability reporting feature:
1. Go to the repository's Security tab
2. Click "Report a vulnerability"
3. Fill in the details

### What to include

- Description of the vulnerability
- Steps to reproduce
- Potential impact
- Suggested fix (if any)

### Response timeline

- **Acknowledgment**: Within 48 hours
- **Initial assessment**: Within 1 week
- **Fix release**: Within 30 days for critical issues

## Security Measures

OpenWebDav implements the following security controls:

- **Authentication**: JWT tokens with short expiry + refresh rotation
- **Password hashing**: bcrypt with appropriate cost factor
- **Rate limiting**: 20 requests/minute on auth endpoints
- **Security headers**: HSTS, X-Frame-Options, X-Content-Type-Options, Referrer-Policy
- **Input validation**: Pydantic schemas with regex patterns and length limits
- **RBAC**: Role-based access control (admin, user, readonly)
- **Path traversal prevention**: realpath validation on all file operations
- **SQL injection prevention**: SQLAlchemy ORM (parameterized queries)
- **CORS**: Configured for specific origins only
- **Container security**: Non-root user, minimal base image
- **CI/CD scanning**: Bandit, Semgrep, Trivy, Gitleaks, pip-audit, npm audit
