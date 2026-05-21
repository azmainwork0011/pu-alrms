#!/usr/bin/env bash
# ═══════════════════════════════════════════════════════════════════════════════
# PU-ALRMS — One-Click Production Database Setup
#
# Automates the entire production deployment pipeline:
#   1. Installs Turso CLI (if missing)
#   2. Authenticates with Turso (headless signup if needed)
#   3. Creates a Turso database in Singapore (sin)
#   4. Pushes Prisma schema to the remote database
#   5. Seeds demo data
#   6. Sets all required Vercel environment variables via API
#   7. Triggers a Vercel redeployment
#
# Prerequisites:
#   - curl, git, npx (Node.js) installed
#   - Vercel Personal Access Token (from https://vercel.com/account/tokens)
#
# Usage:
#   chmod +x scripts/setup-production-db.sh
#   ./scripts/setup-production-db.sh
#   ./scripts/setup-production-db.sh --skip-seed        # Skip demo data seeding
#   ./scripts/setup-production-db.sh --skip-redeploy    # Skip Vercel redeploy
# ═══════════════════════════════════════════════════════════════════════════════

set -euo pipefail

# ─── Parse Flags ─────────────────────────────────────────────────────────────
SKIP_SEED=false
SKIP_REDEPLOY=false
FORCE_RESET=false

for arg in "$@"; do
    case "$arg" in
        --skip-seed)       SKIP_SEED=true ;;
        --skip-redeploy)   SKIP_REDEPLOY=true ;;
        --force-reset)     FORCE_RESET=true ;;
        --help|-h)
            echo "Usage: $0 [--skip-seed] [--skip-redeploy] [--force-reset] [-h]"
            echo ""
            echo "  --skip-seed       Skip demo data seeding"
            echo "  --skip-redeploy   Skip Vercel redeployment"
            echo "  --force-reset     Drop all tables before pushing schema"
            echo "  -h, --help        Show this help"
            exit 0
            ;;
        *)
            echo "Unknown flag: $arg (use --help for usage)"
            exit 1
            ;;
    esac
done

# ─── Configuration ───────────────────────────────────────────────────────────
DB_NAME="pu-alrms"
DB_REGION="sin"                    # Singapore — closest to Bangladesh
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

# ─── Helper: Make a temporary directory safely ───────────────────────────────
TMPDIR_SETUP=$(mktemp -d 2>/dev/null || mktemp -d -t 'pu-alrms-setup')
trap 'rm -rf "$TMPDIR_SETUP"' EXIT

# ═════════════════════════════════════════════════════════════════════════════
#  BANNER
# ═════════════════════════════════════════════════════════════════════════════
echo ""
echo -e "${CYAN}${BOLD}╔════════════════════════════════════════════════════════╗${NC}"
echo -e "${CYAN}${BOLD}║     PU-ALRMS — Production Database Setup             ║${NC}"
echo -e "${CYAN}${BOLD}╚════════════════════════════════════════════════════════╝${NC}"
echo ""

# ═════════════════════════════════════════════════════════════════════════════
#  STEP 1: Check / Install Turso CLI
# ═════════════════════════════════════════════════════════════════════════════
step "Step 1/8: Checking Turso CLI"

if command -v turso >/dev/null 2>&1; then
    TURSO_VERSION=$(turso --version 2>/dev/null || echo "unknown")
    log "Turso CLI already installed (${TURSO_VERSION})"
else
    info "Turso CLI not found — installing..."
    echo ""
    if curl -sSfL https://get.tur.so/install.sh | bash 2>&1; then
        # Ensure it's on the PATH
        export PATH="$HOME/.turso:$PATH"
        if command -v turso >/dev/null 2>&1; then
            log "Turso CLI installed successfully"
        else
            # Try common install locations
            for p in "$HOME/.turso" "$HOME/.local/bin" "/usr/local/bin"; do
                if [ -x "$p/turso" ]; then
                    export PATH="$p:$PATH"
                    break
                fi
            done
            if command -v turso >/dev/null 2>&1; then
                log "Turso CLI installed successfully"
            else
                err "Turso CLI installed but not found on PATH. Try opening a new terminal and re-running this script."
            fi
        fi
    else
        err "Failed to install Turso CLI. Please install manually: curl -sSfL https://get.tur.so/install.sh | bash"
    fi
fi

# ═════════════════════════════════════════════════════════════════════════════
#  STEP 2: Authenticate with Turso
# ═════════════════════════════════════════════════════════════════════════════
step "Step 2/8: Authenticating with Turso"

if turso auth whoami >/dev/null 2>&1; then
    TURSO_USER=$(turso auth whoami 2>/dev/null)
    log "Already authenticated as: ${TURSO_USER}"
else
    info "Not authenticated — attempting headless signup..."
    echo ""
    if turso auth signup --headless 2>&1; then
        log "Signed up and authenticated with Turso"
    else
        echo ""
        warn "Headless signup failed or requires interactive login."
        info "Trying interactive login — please follow the prompts..."
        echo ""
        if turso auth login 2>&1; then
            log "Authenticated with Turso"
        else
            err "Turso authentication failed. Please run 'turso auth login' manually and try again."
        fi
    fi
fi

# ═════════════════════════════════════════════════════════════════════════════
#  STEP 3: Create / Verify Turso Database
# ═════════════════════════════════════════════════════════════════════════════
step "Step 3/8: Creating Turso Database"

if turso db show "$DB_NAME" >/dev/null 2>&1; then
    log "Database '${DB_NAME}' already exists — skipping creation"
else
    info "Creating database '${DB_NAME}' in region '${DB_REGION}' (Singapore)..."
    if turso db create "$DB_NAME" --region "$DB_REGION" 2>&1; then
        log "Created database '${DB_NAME}' in ${DB_REGION}"
    else
        err "Failed to create Turso database. Check your Turso plan and permissions."
    fi
fi

# Show database info
echo ""
turso db show "$DB_NAME" 2>&1 || true
echo ""

# ═════════════════════════════════════════════════════════════════════════════
#  STEP 4: Generate Auth Token & Get Connection URL
# ═════════════════════════════════════════════════════════════════════════════
step "Step 4/8: Generating Database Credentials"

DB_URL=$(turso db show "$DB_NAME" --url 2>/dev/null)
if [ -z "$DB_URL" ]; then
    err "Failed to get database URL. Check that '${DB_NAME}' exists."
fi
log "Database URL: ${DB_URL}"

# Create a long-lived auth token (1 year)
DB_AUTH_TOKEN=$(turso db tokens create "$DB_NAME" --expiration 8760h 2>/dev/null)
if [ -z "$DB_AUTH_TOKEN" ]; then
    # Fallback: try without expiration flag
    DB_AUTH_TOKEN=$(turso db tokens create "$DB_NAME" 2>/dev/null)
fi
if [ -z "$DB_AUTH_TOKEN" ]; then
    err "Failed to create database auth token. Check your Turso permissions."
fi
log "Auth token generated (valid 1 year)"

# ═════════════════════════════════════════════════════════════════════════════
#  STEP 5: Push Prisma Schema
# ═════════════════════════════════════════════════════════════════════════════
step "Step 5/8: Pushing Prisma Schema to Turso"

export DATABASE_URL="$DB_URL"
export DATABASE_AUTH_TOKEN="$DB_AUTH_TOKEN"

if [ "$FORCE_RESET" = true ]; then
    warn "Force-reset flag set — ALL existing data will be erased!"
    echo ""
    npx prisma db push --force-reset 2>&1
    log "Schema pushed (with force reset)"
else
    npx prisma db push 2>&1
    log "Schema pushed to Turso"
fi

# ═════════════════════════════════════════════════════════════════════════════
#  STEP 6: Seed Database (optional)
# ═════════════════════════════════════════════════════════════════════════════
if [ "$SKIP_SEED" = true ]; then
    step "Step 6/8: Seeding Database — SKIPPED"
    warn "Skipping demo data seed (--skip-seed flag)"
else
    step "Step 6/8: Seeding Demo Data"
    info "Running seed script..."
    echo ""
    if npx tsx prisma/seed.ts 2>&1; then
        log "Demo data seeded successfully"
    else
        warn "Seed script had issues — continuing anyway (non-fatal)"
    fi
fi

# ═════════════════════════════════════════════════════════════════════════════
#  STEP 7: Set Vercel Environment Variables
# ═════════════════════════════════════════════════════════════════════════════
step "Step 7/8: Setting Vercel Environment Variables"

# Generate a secure NEXTAUTH_SECRET if one doesn't already exist on Vercel
info "Checking for existing NEXTAUTH_SECRET on Vercel..."
EXISTING_SECRET=$(curl -s "${VERCEL_API}/v9/projects/${VERCEL_PROJECT}/env/NEXTAUTH_SECRET" \
    -H "Authorization: Bearer ${VERCEL_TOKEN}" 2>/dev/null | \
    python3 -c "import json,sys; d=json.load(sys.stdin); print(d['value'] if 'value' in d else '')" 2>/dev/null || echo "")

if [ -n "$EXISTING_SECRET" ]; then
    NEXTAUTH_SECRET="$EXISTING_SECRET"
    log "Using existing NEXTAUTH_SECRET from Vercel"
else
    NEXTAUTH_SECRET=$(openssl rand -base64 32 2>/dev/null || python3 -c "import secrets; print(secrets.token_urlsafe(32))")
    log "Generated new NEXTAUTH_SECRET"
fi

# Function to set a Vercel environment variable via API (idempotent)
set_vercel_env() {
    local KEY="$1"
    local VALUE="$2"
    local ENCRYPTED="${3:-encrypted}"   # "encrypted" or "plain"

    # Delete existing first (idempotent — ignore errors)
    curl -s -X DELETE \
        "${VERCEL_API}/v9/projects/${VERCEL_PROJECT}/env/${KEY}" \
        -H "Authorization: Bearer ${VERCEL_TOKEN}" >/dev/null 2>&1 || true

    # Create new
    local RESPONSE
    RESPONSE=$(curl -s -X POST \
        "${VERCEL_API}/v10/projects/${VERCEL_PROJECT}/env" \
        -H "Authorization: Bearer ${VERCEL_TOKEN}" \
        -H "Content-Type: application/json" \
        -d "{\"key\":\"${KEY}\",\"value\":\"${VALUE}\",\"type\":\"${ENCRYPTED}\",\"target\":[\"production\",\"preview\",\"development\"]}" 2>&1)

    local ERR_MSG
    ERR_MSG=$(echo "$RESPONSE" | python3 -c "import json,sys; d=json.load(sys.stdin); print(d.get('error',{}).get('message',''))" 2>/dev/null || echo "")

    if [ -n "$ERR_MSG" ]; then
        warn "Failed to set ${KEY}: ${ERR_MSG}"
        return 1
    fi
    return 0
}

# Set all required environment variables
ENV_VARS=(
    "DATABASE_URL|${DB_URL}|plain"
    "DATABASE_AUTH_TOKEN|${DB_AUTH_TOKEN}|encrypted"
    "NEXTAUTH_URL|${APP_URL}|plain"
    "NEXTAUTH_SECRET|${NEXTAUTH_SECRET}|encrypted"
)

for ENTRY in "${ENV_VARS[@]}"; do
    IFS='|' read -r KEY VALUE TYPE <<< "$ENTRY"
    info "Setting ${KEY}..."
    if set_vercel_env "$KEY" "$VALUE" "$TYPE"; then
        log "${KEY} → set on Vercel (all environments)"
    fi
done

# ═════════════════════════════════════════════════════════════════════════════
#  STEP 8: Trigger Vercel Redeploy
# ═════════════════════════════════════════════════════════════════════════════
if [ "$SKIP_REDEPLOY" = true ]; then
    step "Step 8/8: Vercel Redeploy — SKIPPED"
    warn "Skipping redeployment (--skip-redeploy flag)"
else
    step "Step 8/8: Triggering Vercel Redeployment"

    # Get the latest production deployment ID
    info "Fetching latest production deployment..."
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
        info "Redeploying deployment: ${DEPLOY_ID}..."
        REDPLOY_RESPONSE=$(curl -s -X POST \
            "${VERCEL_API}/v13/deployments/${DEPLOY_ID}/retry" \
            -H "Authorization: Bearer ${VERCEL_TOKEN}" 2>/dev/null)

        # Check for success
        REDPLOY_STATE=$(echo "$REDPLOY_RESPONSE" | python3 -c "
import json, sys
try:
    d = json.load(sys.stdin)
    print(d.get('readyState', d.get('state', 'unknown')))
except:
    pass
" 2>/dev/null || echo "initiated")

        log "Redeployment ${REDPLOY_STATE} — check Vercel dashboard for progress"
    else
        warn "Could not find latest deployment — trigger manually from Vercel dashboard"
        info "Dashboard: https://vercel.com/${VERCEL_PROJECT}/deployments"
    fi
fi

# ═════════════════════════════════════════════════════════════════════════════
#  SUCCESS BANNER
# ═════════════════════════════════════════════════════════════════════════════
echo ""
echo -e "${GREEN}${BOLD}╔════════════════════════════════════════════════════════════╗${NC}"
echo -e "${GREEN}${BOLD}║        PU-ALRMS Production Setup Complete!                ║${NC}"
echo -e "${GREEN}${BOLD}╠════════════════════════════════════════════════════════════╣${NC}"
echo -e "${GREEN}${BOLD}║                                                          ║${NC}"
echo -e "${CYAN}  🌐  Live URL:   ${APP_URL}${NC}"
echo -e "${CYAN}  🗄️  Database:   ${DB_NAME}${NC}"
echo -e "${CYAN}  📍  Region:     ${DB_REGION} (Singapore)${NC}"
echo -e "${CYAN}  🔗  Connection: ${DB_URL}${NC}"
echo -e "${GREEN}${BOLD}║                                                          ║${NC}"
echo -e "${GREEN}${BOLD}╚════════════════════════════════════════════════════════════╝${NC}"
echo ""
echo -e "${BOLD}What was set on Vercel:${NC}"
echo -e "  • DATABASE_URL          (LibSQL connection URL)"
echo -e "  • DATABASE_AUTH_TOKEN   (Turso auth token, 1-year expiry)"
echo -e "  • NEXTAUTH_URL          (${APP_URL})"
echo -e "  • NEXTAUTH_SECRET       (auto-generated)"
echo ""
echo -e "${YELLOW}⚠  Important reminders:${NC}"
echo -e "  • The auth token expires in 1 year — re-run this script or use deploy-turso.sh"
echo -e "  • Make sure GOOGLE_CLIENT_ID and GOOGLE_CLIENT_SECRET are set on Vercel"
echo -e "  • Set SUPER_ADMIN_EMAIL on Vercel if you want a specific super admin"
echo ""
echo -e "${DIM}Vercel Dashboard: https://vercel.com/${VERCEL_PROJECT}/settings/environment-variables${NC}"
echo ""
