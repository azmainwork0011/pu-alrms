#!/usr/bin/env bash
# ═══════════════════════════════════════════════════════════════════
# PU-ALRMS — One-Click Production Database Setup
#
# This script automates:
#   1. Creating a Turso database
#   2. Pushing the Prisma schema
#   3. Seeding demo data
#   4. Setting Vercel environment variables
#   5. Triggering a Vercel redeployment
#
# Prerequisites:
#   - Turso CLI installed (curl -sSfL https://get.tur.so/install.sh | bash)
#   - Logged in to Turso (turso auth login)
#   - Vercel CLI installed (npm i -g vercel)
#   - Logged in to Vercel (vercel login)
#
# Usage:
#   chmod +x scripts/setup-production-db.sh
#   ./scripts/setup-production-db.sh
# ═══════════════════════════════════════════════════════════════════

set -euo pipefail

# ─── Configuration ─────────────────────────────────────────────
DB_NAME="pu-alrms"
DB_REGION="eu-west-1"
VERCEL_TOKEN="${VERCEL_TOKEN:-}"
TEAM_ID="team_2ZRX061d0Lj2SHBd4OenPJq2"
PROJECT_ID="prj_cxqoCLZjBF1mUpGK3j3dOTKHX3Ps"

# ─── Colors ───────────────────────────────────────────────────
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
CYAN='\033[0;36m'
NC='\033[0m'

log() { echo -e "${GREEN}✓${NC} $1"; }
warn() { echo -e "${YELLOW}⚠${NC} $1"; }
err() { echo -e "${RED}✗${NC} $1"; exit 1; }
step() { echo -e "\n${CYAN}━━━ $1 ━━━${NC}"; }

# ─── Check Prerequisites ──────────────────────────────────────
step "Checking Prerequisites"

command -v turso >/dev/null 2>&1 || err "Turso CLI not found. Install: curl -sSfL https://get.tur.so/install.sh | bash"
command -v vercel >/dev/null 2>&1 || err "Vercel CLI not found. Install: npm i -g vercel"
command -v npx >/dev/null 2>&1 || err "npx not found"

# Verify turso is logged in
turso auth whoami >/dev/null 2>&1 || err "Not logged in to Turso. Run: turso auth login"

log "All prerequisites met"

# ─── Step 1: Create Turso Database ────────────────────────────
step "Creating Turso Database (${DB_NAME})"

if turso db show "$DB_NAME" >/dev/null 2>&1; then
    log "Database '$DB_NAME' already exists — skipping creation"
else
    turso db create "$DB_NAME" --region "$DB_REGION"
    log "Created database '$DB_NAME' in region '$DB_REGION'"
fi

# ─── Step 2: Get Connection Info ───────────────────────────────
step "Getting Database Connection Info"

DB_URL=$(turso db show "$DB_NAME" --url)
log "Database URL obtained"

# Create auth token
TOKEN_NAME="pu-alrms-deploy"
DB_AUTH_TOKEN=$(turso db tokens create "$DB_NAME" --expiration 8760h 2>/dev/null)
log "Auth token created (valid 1 year)"

# ─── Step 3: Push Prisma Schema ───────────────────────────────
step "Pushing Prisma Schema to Turso"

export DATABASE_URL="$DB_URL"
export DATABASE_AUTH_TOKEN="$DB_AUTH_TOKEN"

npx prisma db push --force-reset
log "Schema pushed to Turso"

# ─── Step 4: Seed Database ────────────────────────────────────
step "Seeding Demo Data"

npx tsx prisma/seed.ts
log "Demo data seeded"

# ─── Step 5: Set Vercel Environment Variables ────────────────
step "Configuring Vercel Environment Variables"

set_env_var() {
    local KEY="$1"
    local VALUE="$2"

    if [ -n "$VERCEL_TOKEN" ]; then
        # Use Vercel REST API
        for ENV_TYPE in production preview development; do
            # Try to delete existing first
            curl -s -X DELETE \
                "https://api.vercel.com/v9/projects/${PROJECT_ID}/env/${KEY}?teamId=${TEAM_ID}&target=${ENV_TYPE}" \
                -H "Authorization: Bearer $VERCEL_TOKEN" >/dev/null 2>&1 || true
        done

        # Create new
        curl -s -X POST \
            "https://api.vercel.com/v9/projects/${PROJECT_ID}/env?teamId=${TEAM_ID}" \
            -H "Authorization: Bearer $VERCEL_TOKEN" \
            -H "Content-Type: application/json" \
            -d "{\"key\":\"${KEY}\",\"value\":\"${VALUE}\",\"type\":\"encrypted\",\"target\":[\"production\",\"preview\",\"development\"]}" | python3 -c "
import json, sys
d = json.load(sys.stdin)
if 'error' in d:
    print(f'Error: {d[\"error\"][\"message\"]}')
    sys.exit(1)
" 2>/dev/null
    else
        # Use Vercel CLI
        echo "$VALUE" | vercel env add "$KEY" production preview development
    fi
}

set_env_var "DATABASE_URL" "$DB_URL"
set_env_var "DATABASE_AUTH_TOKEN" "$DB_AUTH_TOKEN"

log "DATABASE_URL → set on Vercel (all environments)"
log "DATABASE_AUTH_TOKEN → set on Vercel (all environments)"

# ─── Done ─────────────────────────────────────────────────────
step "Production Setup Complete!"

echo ""
echo -e "${GREEN}╔══════════════════════════════════════════════════╗${NC}"
echo -e "${GREEN}║  PU-ALRMS Production Database Setup Complete!   ║${NC}"
echo -e "${GREEN}╠══════════════════════════════════════════════════╣${NC}"
echo -e "${CYAN}║  Database:   ${DB_NAME}${NC}"
echo -e "${CYAN}║  Region:     ${DB_REGION}${NC}"
echo -e "${CYAN}║  Connection: ${DB_URL}${NC}"
echo -e "${GREEN}╚══════════════════════════════════════════════════╝${NC}"
echo ""
echo "Next steps:"
echo "  1. Push latest code: git push origin main"
echo "  2. Vercel will auto-redeploy with the new database"
echo "  3. Visit https://pu-alrms.vercel.app to verify"
echo ""
echo "Demo login: alice@stu.pu.edu / student123"
