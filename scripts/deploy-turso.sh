#!/usr/bin/env bash
# ═══════════════════════════════════════════════════════════════════════════════
# PU-ALRMS — Quick Vercel Deploy (for existing Turso DB)
#
# A lightweight shortcut that:
#   1. Refreshes the Turso auth token
#   2. Pushes the latest Prisma schema
#   3. Updates Vercel environment variables
#   4. Triggers a Vercel redeployment
#
# Use this when you already have a Turso database and just need to
# sync schema changes or rotate tokens.
#
# Prerequisites:
#   - Turso CLI installed and authenticated
#   - The database 'pu-alrms' must already exist
#
# Usage:
#   chmod +x scripts/deploy-turso.sh
#   ./scripts/deploy-turso.sh
#   ./scripts/deploy-turso.sh --skip-push    # Skip prisma db push
#   ./scripts/deploy-turso.sh --skip-redeploy # Skip Vercel redeploy
# ═══════════════════════════════════════════════════════════════════════════════

set -euo pipefail

# ─── Parse Flags ─────────────────────────────────────────────────────────────
SKIP_PUSH=false
SKIP_REDEPLOY=false

for arg in "$@"; do
    case "$arg" in
        --skip-push)      SKIP_PUSH=true ;;
        --skip-redeploy)  SKIP_REDEPLOY=true ;;
        --help|-h)
            echo "Usage: $0 [--skip-push] [--skip-redeploy] [-h]"
            echo ""
            echo "  --skip-push       Skip Prisma schema push"
            echo "  --skip-redeploy   Skip Vercel redeployment"
            exit 0
            ;;
    esac
done

# ─── Configuration ───────────────────────────────────────────────────────────
DB_NAME="pu-alrms"
VERCEL_PROJECT="pu-alrms"
VERCEL_API="https://api.vercel.com"
APP_URL="https://pu-alrms.vercel.app"

# Vercel token — set from env var or prompt
if [ -z "${VERCEL_TOKEN:-}" ]; then
    echo -e "${YELLOW}  ⚠${NC} VERCEL_TOKEN not set."
    echo -e "${DIM}  Get yours from: https://vercel.com/account/tokens${NC}"
    echo -n "  Paste your Vercel token: "
    read -r VERCEL_TOKEN
fi
if [ -z "$VERCEL_TOKEN" ]; then
    err "VERCEL_TOKEN is required. Get one from https://vercel.com/account/tokens"
fi

# ─── Colors ──────────────────────────────────────────────────────────────────
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
CYAN='\033[0;36m'
BOLD='\033[1m'
DIM='\033[2m'
NC='\033[0m'

log()  { echo -e "${GREEN}  ✓${NC} $1"; }
warn() { echo -e "${YELLOW}  ⚠${NC} $1"; }
err()  { echo -e "${RED}  ✗${NC} $1"; echo ""; exit 1; }
step() { echo -e "\n${CYAN}${BOLD}━━━ $1 ━━━${NC}"; }
info() { echo -e "  ${DIM}$1${NC}"; }

# ─── Banner ──────────────────────────────────────────────────────────────────
echo ""
echo -e "${CYAN}${BOLD}╔═══════════════════════════════════════════════════╗${NC}"
echo -e "${CYAN}${BOLD}║     PU-ALRMS — Quick Deploy to Turso + Vercel    ║${NC}"
echo -e "${CYAN}${BOLD}╚═══════════════════════════════════════════════════╝${NC}"
echo ""

# ─── Check Turso CLI ────────────────────────────────────────────────────────
step "Checking Turso CLI"

if ! command -v turso >/dev/null 2>&1; then
    err "Turso CLI not found. Install it or use the full setup script: ./scripts/setup-production-db.sh"
fi

if ! turso auth whoami >/dev/null 2>&1; then
    err "Not logged in to Turso. Run: turso auth login"
fi

log "Turso CLI ready"

# ─── Check Database Exists ───────────────────────────────────────────────────
step "Verifying Database '${DB_NAME}'"

if ! turso db show "$DB_NAME" >/dev/null 2>&1; then
    err "Database '${DB_NAME}' does not exist. Run the full setup script first: ./scripts/setup-production-db.sh"
fi

log "Database '${DB_NAME}' found"

# ─── Get Credentials ─────────────────────────────────────────────────────────
step "Refreshing Database Credentials"

DB_URL=$(turso db show "$DB_NAME" --url 2>/dev/null)
DB_AUTH_TOKEN=$(turso db tokens create "$DB_NAME" --expiration 8760h 2>/dev/null || turso db tokens create "$DB_NAME" 2>/dev/null)

if [ -z "$DB_URL" ] || [ -z "$DB_AUTH_TOKEN" ]; then
    err "Failed to get database credentials"
fi

log "URL: ${DB_URL}"
log "New auth token generated (1-year expiry)"

# ─── Push Schema ─────────────────────────────────────────────────────────────
if [ "$SKIP_PUSH" = true ]; then
    step "Pushing Prisma Schema — SKIPPED"
    warn "Skipping schema push (--skip-push flag)"
else
    step "Pushing Prisma Schema"

    export DATABASE_URL="$DB_URL"
    export DATABASE_AUTH_TOKEN="$DB_AUTH_TOKEN"

    npx prisma db push 2>&1
    log "Schema pushed successfully"
fi

# ─── Set Vercel Env Vars ────────────────────────────────────────────────────
step "Updating Vercel Environment Variables"

set_vercel_env() {
    local KEY="$1"
    local VALUE="$2"
    local TYPE="${3:-encrypted}"

    curl -s -X DELETE \
        "${VERCEL_API}/v9/projects/${VERCEL_PROJECT}/env/${KEY}" \
        -H "Authorization: Bearer ${VERCEL_TOKEN}" >/dev/null 2>&1 || true

    local RESP
    RESP=$(curl -s -X POST \
        "${VERCEL_API}/v10/projects/${VERCEL_PROJECT}/env" \
        -H "Authorization: Bearer ${VERCEL_TOKEN}" \
        -H "Content-Type: application/json" \
        -d "{\"key\":\"${KEY}\",\"value\":\"${VALUE}\",\"type\":\"${TYPE}\",\"target\":[\"production\",\"preview\",\"development\"]}" 2>&1)

    local ERR_MSG
    ERR_MSG=$(echo "$RESP" | python3 -c "import json,sys; d=json.load(sys.stdin); print(d.get('error',{}).get('message',''))" 2>/dev/null || echo "")

    if [ -n "$ERR_MSG" ]; then
        warn "Failed to set ${KEY}: ${ERR_MSG}"
        return 1
    fi
    return 0
}

set_vercel_env "DATABASE_URL" "$DB_URL" "plain" && log "DATABASE_URL updated"
set_vercel_env "DATABASE_AUTH_TOKEN" "$DB_AUTH_TOKEN" "encrypted" && log "DATABASE_AUTH_TOKEN updated"

# ─── Trigger Redeploy ───────────────────────────────────────────────────────
if [ "$SKIP_REDEPLOY" = true ]; then
    step "Triggering Redeploy — SKIPPED"
    warn "Skipping redeployment (--skip-redeploy flag)"
else
    step "Triggering Vercel Redeploy"

    LATEST_DEPLOY=$(curl -s "${VERCEL_API}/v6/projects/${VERCEL_PROJECT}/deployments?target=production&limit=1" \
        -H "Authorization: Bearer ${VERCEL_TOKEN}" 2>/dev/null)

    DEPLOY_ID=$(echo "$LATEST_DEPLOY" | python3 -c "
import json, sys
try:
    d = json.load(sys.stdin)
    deployments = d.get('deployments', [])
    if deployments:
        print(deployments[0].get('uid', ''))
except:
    pass
" 2>/dev/null)

    if [ -n "$DEPLOY_ID" ]; then
        curl -s -X POST \
            "${VERCEL_API}/v13/deployments/${DEPLOY_ID}/retry" \
            -H "Authorization: Bearer ${VERCEL_TOKEN}" >/dev/null 2>&1
        log "Redeployment triggered for ${DEPLOY_ID}"
    else
        warn "Could not find latest deployment — trigger manually from Vercel dashboard"
    fi
fi

# ─── Done ────────────────────────────────────────────────────────────────────
echo ""
echo -e "${GREEN}${BOLD}╔═══════════════════════════════════════════════════╗${NC}"
echo -e "${GREEN}${BOLD}║     Deploy Complete!                             ║${NC}"
echo -e "${GREEN}${BOLD}╠═══════════════════════════════════════════════════╣${NC}"
echo -e "${CYAN}  🌐  ${APP_URL}${NC}"
echo -e "${GREEN}${BOLD}╚═══════════════════════════════════════════════════╝${NC}"
echo ""
