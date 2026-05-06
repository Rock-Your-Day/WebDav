#!/bin/bash
# ─────────────────────────────────────────────────────────────────────────────
# OpenWebDav Security Scan Script
# Run locally to check for security issues before pushing
# ─────────────────────────────────────────────────────────────────────────────

set -e

RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo "═══════════════════════════════════════════════════════════════"
echo "  OpenWebDav Security Scan"
echo "═══════════════════════════════════════════════════════════════"
echo ""

FAILURES=0

# ─── 1. Bandit (Python SAST) ─────────────────────────────────────────────────
echo -e "${YELLOW}[1/5] Running Bandit (Python SAST)...${NC}"
if command -v bandit &> /dev/null || [ -f backend/venv/bin/bandit ]; then
    BANDIT_CMD="${BANDIT_CMD:-backend/venv/bin/bandit}"
    if $BANDIT_CMD -r backend/app/ --severity-level medium -q 2>/dev/null; then
        echo -e "${GREEN}  ✓ No security issues found${NC}"
    else
        echo -e "${RED}  ✗ Security issues detected${NC}"
        FAILURES=$((FAILURES + 1))
    fi
else
    echo -e "${YELLOW}  ⚠ Bandit not installed (pip install bandit)${NC}"
fi
echo ""

# ─── 2. pip-audit (Python Dependencies) ──────────────────────────────────────
echo -e "${YELLOW}[2/5] Running pip-audit (Python dependency check)...${NC}"
if command -v pip-audit &> /dev/null || [ -f backend/venv/bin/pip-audit ]; then
    PIPAUDIT_CMD="${PIPAUDIT_CMD:-backend/venv/bin/pip-audit}"
    if $PIPAUDIT_CMD -r backend/requirements.txt --desc 2>/dev/null; then
        echo -e "${GREEN}  ✓ No known vulnerabilities${NC}"
    else
        echo -e "${RED}  ✗ Vulnerable dependencies found (see above)${NC}"
        FAILURES=$((FAILURES + 1))
    fi
else
    echo -e "${YELLOW}  ⚠ pip-audit not installed (pip install pip-audit)${NC}"
fi
echo ""

# ─── 3. npm audit (Node Dependencies) ────────────────────────────────────────
echo -e "${YELLOW}[3/5] Running npm audit (Node dependency check)...${NC}"
if cd frontend && npm audit --audit-level=high 2>/dev/null; then
    echo -e "${GREEN}  ✓ No high/critical vulnerabilities${NC}"
else
    echo -e "${RED}  ✗ High/critical vulnerabilities found${NC}"
    FAILURES=$((FAILURES + 1))
fi
cd ..
echo ""

# ─── 4. Gitleaks (Secret Detection) ──────────────────────────────────────────
echo -e "${YELLOW}[4/5] Running Gitleaks (secret detection)...${NC}"
if command -v gitleaks &> /dev/null; then
    if gitleaks detect --source . --no-banner 2>/dev/null; then
        echo -e "${GREEN}  ✓ No secrets detected${NC}"
    else
        echo -e "${RED}  ✗ Potential secrets found!${NC}"
        FAILURES=$((FAILURES + 1))
    fi
else
    echo -e "${YELLOW}  ⚠ Gitleaks not installed (brew install gitleaks)${NC}"
fi
echo ""

# ─── 5. Trivy (Container Scan) ───────────────────────────────────────────────
echo -e "${YELLOW}[5/5] Running Trivy (container vulnerability scan)...${NC}"
if command -v trivy &> /dev/null; then
    if docker image inspect openwebdav:latest &>/dev/null; then
        trivy image --severity HIGH,CRITICAL --exit-code 0 openwebdav:latest
        echo -e "${GREEN}  ✓ Container scan complete${NC}"
    else
        echo -e "${YELLOW}  ⚠ Docker image 'openwebdav:latest' not found. Build first.${NC}"
    fi
else
    echo -e "${YELLOW}  ⚠ Trivy not installed (brew install trivy)${NC}"
fi
echo ""

# ─── Summary ─────────────────────────────────────────────────────────────────
echo "═══════════════════════════════════════════════════════════════"
if [ $FAILURES -eq 0 ]; then
    echo -e "${GREEN}  All security checks passed ✓${NC}"
else
    echo -e "${RED}  $FAILURES check(s) failed ✗${NC}"
fi
echo "═══════════════════════════════════════════════════════════════"

exit $FAILURES
