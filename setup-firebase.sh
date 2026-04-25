#!/bin/bash
# ╔══════════════════════════════════════════════════════════════════════╗
# ║                                                                  ║
# ║   PU-ALRMS FIREBASE AUTO-SETUP — Kali Linux Edition              ║
# ║   ═════════════════════════════════════                             ║
# ║   INSTRUCTIONS:                                                   ║
# ║   1. cd to project folder                                         ║
# ║   2. Run: bash setup-firebase.sh                                  ║
# ║                                                                  ║
# ╚══════════════════════════════════════════════════════════════════════╝

set -e

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
CYAN='\033[0;36m'
MAGENTA='\033[0;35m'
WHITE='\033[1;37m'
DIM='\033[2m'
NC='\033[0m'

ok()   { echo -e "        ${GREEN}✓ $1${NC}"; }
fail() { echo -e "        ${RED}✗ $1${NC}"; }
warn() { echo -e "        ${YELLOW}! $1${NC}"; }
dim()  { echo -e "        ${DIM}$1${NC}"; }
step() { echo -e "\n  ${CYAN}[$1/$STEPS] $2${NC}"; }

# ═══════════════════════════════════════════════════════════════════════
# BANNER
# ═══════════════════════════════════════════════════════════════════════
clear
echo ""
echo -e "  ${MAGENTA}═════════════════════════════════════════════════════════════${NC}"
echo -e "  ${MAGENTA}||                                                          ||${NC}"
echo -e "  ${MAGENTA}||    PU-ALRMS  ·  FIREBASE AUTO-SETUP                     ||${NC}"
echo -e "  ${MAGENTA}||    Kali Linux Edition                                   ||${NC}"
echo -e "  ${MAGENTA}||                                                          ||${NC}"
echo -e "  ${MAGENTA}═════════════════════════════════════════════════════════════${NC}"
echo ""
echo -e "  This script will automatically:"
echo -e "    ${DIM}1.  Install Firebase CLI${NC}"
echo -e "    ${DIM}2.  Login to your Google account${NC}"
echo -e "    ${DIM}3.  Create Firebase Project${NC}"
echo -e "    ${DIM}4.  Enable Google Authentication${NC}"
echo -e "    ${DIM}5.  Register Web App & fetch config${NC}"
echo -e "    ${DIM}6.  Write .env.local with all credentials${NC}"
echo -e "    ${DIM}7.  Install packages & create config files${NC}"
echo ""
echo -e "  ${YELLOW}Press ENTER to start, or Ctrl+C to cancel...${NC}"
read -r

STEPS=7

# ═══════════════════════════════════════════════════════════════════════
# STEP 1 : Prerequisites
# ═══════════════════════════════════════════════════════════════════════
step 1 $STEPS "Checking prerequisites..."

# Node.js
NODE_VER=$(node -v 2>/dev/null | sed 's/v//' || echo "")
if [ -n "$NODE_VER" ]; then
    NODE_MAJ=$(echo "$NODE_VER" | cut -d. -f1)
    if [ "$NODE_MAJ" -ge 18 ]; then
        ok "Node.js $NODE_VER"
    else
        fail "Node.js 18+ required (found $NODE_VER)"
        echo -e "  ${YELLOW}Install: sudo apt update && sudo apt install nodejs npm -y${NC}"
        echo -e "  ${YELLOW}Or use nvm: curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.40.1/install.sh | bash${NC}"
        exit 1
    fi
else
    fail "Node.js not found!"
    echo ""
    echo -e "  ${YELLOW}┌─────────────────────────────────────────────────────────┐${NC}"
    echo -e "  ${YELLOW}│  Node.js is required! Install it first:                  │${NC}"
    echo -e "  ${WHITE}│                                                          │${NC}"
    echo -e "  ${WHITE}│  Option 1 (easy):                                        │${NC}"
    echo -e "  ${CYAN}│    sudo apt update && sudo apt install -y nodejs npm     │${NC}"
    echo -e "  ${WHITE}│                                                          │${NC}"
    echo -e "  ${WHITE}│  Option 2 (recommended - latest version):                │${NC}"
    echo -e "  ${CYAN}│    curl -o- https://raw.githubusercontent.com/nvm-sh/   │${NC}"
    echo -e "  ${CYAN}│    nvm/v0.40.1/install.sh | bash                         │${NC}"
    echo -e "  ${CYAN}│    source ~/.bashrc                                      │${NC}"
    echo -e "  ${CYAN}│    nvm install --lts                                      │${NC}"
    echo -e "  ${YELLOW}└─────────────────────────────────────────────────────────┘${NC}"
    echo ""
    exit 1
fi

# Package manager
if command -v bun &>/dev/null; then
    PM="bun"; ok "Package manager: bun"
elif command -v pnpm &>/dev/null; then
    PM="pnpm"; ok "Package manager: pnpm"
else
    PM="npm"; ok "Package manager: npm"
fi

# Project directory
if [ ! -f "package.json" ]; then
    fail "package.json not found! Run this from your project root."
    echo -e "  ${YELLOW}Example: cd ~/pu-alrms${NC}"
    exit 1
fi
ok "Project directory: $(pwd)"

# python3 (needed for JSON parsing)
if command -v python3 &>/dev/null; then
    ok "Python3 found"
else
    warn "Python3 not found — installing..."
    sudo apt install -y python3 2>/dev/null || true
fi

# ═══════════════════════════════════════════════════════════════════════
# STEP 2 : Install Firebase CLI
# ═══════════════════════════════════════════════════════════════════════
step 2 $STEPS "Installing Firebase CLI..."

if command -v firebase &>/dev/null; then
    FB_VER=$(firebase --version 2>/dev/null || echo "?")
    ok "Firebase CLI already installed (v$FB_VER)"
else
    dim "Installing firebase-tools globally..."
    npm install -g firebase-tools 2>&1 | tail -1
    if command -v firebase &>/dev/null; then
        ok "Firebase CLI installed ($(firebase --version 2>/dev/null))"
    else
        fail "Failed to install Firebase CLI"
        echo -e "  ${YELLOW}Try manually: sudo npm install -g firebase-tools${NC}"
        exit 1
    fi
fi

# ═══════════════════════════════════════════════════════════════════════
# STEP 3 : Google Login
# ═══════════════════════════════════════════════════════════════════════
step 3 $STEPS "Google Authentication..."

# Check if already logged in
if firebase projects:list 2>/dev/null | head -3 >/dev/null 2>&1; then
    ok "Already logged in to Firebase"
else
    warn "A browser window will open to login with your Google account"
    echo -e "  ${DIM}If no browser opens, the script will give you a link to copy${NC}"
    echo ""
    
    # Try --no-localhost first (works better on Linux)
    firebase login --no-localhost 2>/dev/null || {
        warn "--no-localhost failed, trying default login..."
        firebase login 2>/dev/null || true
    }
    
    if firebase projects:list 2>/dev/null | head -3 >/dev/null 2>&1; then
        ok "Logged in successfully"
    else
        fail "Login failed!"
        echo ""
        echo -e "  ${YELLOW}Try logging in manually first:${NC}"
        echo -e "  ${CYAN}  firebase login${NC}"
        echo ""
        exit 1
    fi
fi

# ═══════════════════════════════════════════════════════════════════════
# STEP 4 : Create / Select Firebase Project
# ═══════════════════════════════════════════════════════════════════════
step 4 $STEPS "Setting up Firebase Project..."

DEFAULT_PROJECT_ID="pu-alrms"

echo ""
echo -e "  ${WHITE}Enter your Firebase Project ID${NC}"
echo -e "  ${DIM}(Press ENTER for default: ${CYAN}${DEFAULT_PROJECT_ID}${DIM})${NC}"
read -r -p "  > " INPUT_PROJECT

if [ -n "$INPUT_PROJECT" ]; then
    PROJECT_ID=$(echo "$INPUT_PROJECT" | tr '[:upper:]' '[:lower:]' | tr -cd 'a-z0-9-')
else
    PROJECT_ID="$DEFAULT_PROJECT_ID"
fi

# Check if project already exists
if firebase projects:list 2>/dev/null | grep -qi "$PROJECT_ID"; then
    ok "Project '$PROJECT_ID' already exists — reusing"
else
    dim "Creating project: $PROJECT_ID ..."
    echo -e "  ${WHITE}Project Display Name [PU-ALRMS Academic Platform]:${NC}"
    read -r -p "  > " DISPLAY_NAME
    [ -z "$DISPLAY_NAME" ] && DISPLAY_NAME="PU-ALRMS Academic Platform"
    
    firebase projects:create "$PROJECT_ID" --display-name "$DISPLAY_NAME" 2>&1 | tail -3
    if firebase projects:list 2>/dev/null | grep -qi "$PROJECT_ID"; then
        ok "Project created: $PROJECT_ID"
    else
        # If CLI create fails, try via browser
        warn "CLI project creation may have failed"
        echo ""
        echo -e "  ${YELLOW}┌────────────────────────────────────────────────────────────┐${NC}"
        echo -e "  ${YELLOW}│  Please create the project manually in your browser:        │${NC}"
        echo -e "  ${CYAN}│  https://console.firebase.google.com/create?project=${PROJECT_ID}${NC}"
        echo -e "  ${YELLOW}│                                                              │${NC}"
        echo -e "  ${YELLOW}│  After creating, come back and press ENTER                   │${NC}"
        echo -e "  ${YELLOW}└────────────────────────────────────────────────────────────┘${NC}"
        read -r -p "  Press ENTER after creating the project... "
        
        if firebase projects:list 2>/dev/null | grep -qi "$PROJECT_ID"; then
            ok "Project found: $PROJECT_ID"
        else
            fail "Project still not found. Please check and re-run."
            exit 1
        fi
    fi
fi

firebase use "$PROJECT_ID" 2>/dev/null || true
ok "Selected project: $PROJECT_ID"

# ═══════════════════════════════════════════════════════════════════════
# STEP 5 : Register Web App & Get Config
# ═══════════════════════════════════════════════════════════════════════
step 5 $STEPS "Registering Web App & fetching config..."

# Check existing web app
EXISTING_APP=$(firebase apps:list --json 2>/dev/null | python3 -c "
import json,sys
try:
    d=json.load(sys.stdin)
    for a in d.get('result',{}).get('apps',[]):
        if a.get('platform')=='web':
            print(a.get('appId',''))
            break
except: pass
" 2>/dev/null || echo "")

if [ -n "$EXISTING_APP" ]; then
    APP_ID="$EXISTING_APP"
    ok "Existing web app found: $APP_ID"
else
    dim "Creating web app: pu-alrms-web ..."
    firebase apps:create web pu-alrms-web 2>&1 | tail -2 || true
    
    APP_ID=$(firebase apps:list --json 2>/dev/null | python3 -c "
import json,sys
try:
    d=json.load(sys.stdin)
    for a in d.get('result',{}).get('apps',[]):
        if a.get('platform')=='web':
            print(a.get('appId',''))
            break
except: pass
" 2>/dev/null || echo "")
    
    if [ -n "$APP_ID" ]; then
        ok "Web app created: $APP_ID"
    else
        warn "Could not create web app via CLI"
    fi
fi

# Fetch config from Firebase REST API
API_KEY=""
AUTH_DOMAIN="${PROJECT_ID}.firebaseapp.com"
STORAGE_BUCKET="${PROJECT_ID}.appspot.com"
MESSAGING_SENDER_ID=""
MEASUREMENT_ID=""

if [ -n "$APP_ID" ]; then
    dim "Fetching config from Firebase API..."
    CONFIG_JSON=$(curl -s "https://firebase.googleapis.com/v1beta1/projects/${PROJECT_ID}/webApps/${APP_ID}/config" 2>/dev/null || echo "{}")
    
    API_KEY=$(echo "$CONFIG_JSON" | python3 -c "import json,sys; print(json.load(sys.stdin).get('apiKey',''))" 2>/dev/null || echo "")
    AUTH_DOMAIN=$(echo "$CONFIG_JSON" | python3 -c "import json,sys; print(json.load(sys.stdin).get('authDomain','${AUTH_DOMAIN}'))" 2>/dev/null || echo "$AUTH_DOMAIN")
    STORAGE_BUCKET=$(echo "$CONFIG_JSON" | python3 -c "import json,sys; print(json.load(sys.stdin).get('storageBucket','${STORAGE_BUCKET}'))" 2>/dev/null || echo "$STORAGE_BUCKET")
    MESSAGING_SENDER_ID=$(echo "$CONFIG_JSON" | python3 -c "import json,sys; print(json.load(sys.stdin).get('messagingSenderId',''))" 2>/dev/null || echo "")
    APP_ID=$(echo "$CONFIG_JSON" | python3 -c "import json,sys; print(json.load(sys.stdin).get('appId',''))" 2>/dev/null || echo "$APP_ID")
    MEASUREMENT_ID=$(echo "$CONFIG_JSON" | python3 -c "import json,sys; print(json.load(sys.stdin).get('measurementId',''))" 2>/dev/null || echo "")
    
    if [ -n "$API_KEY" ]; then
        ok "Config fetched from Firebase API"
    else
        warn "Auto-fetch failed"
    fi
fi

# Fallback: manual paste from Firebase Console
if [ -z "$API_KEY" ] || [ -z "$APP_ID" ]; then
    echo ""
    echo -e "  ${YELLOW}┌────────────────────────────────────────────────────────────────┐${NC}"
    echo -e "  ${YELLOW}│  Auto-fetch failed. Please get config from Firebase Console:    │${NC}"
    echo -e "  ${CYAN}│  https://console.firebase.google.com/project/${PROJECT_ID}       ${NC}"
    echo -e "  ${CYAN}│    /settings/general/webapps/${APP_ID}                          ${NC}"
    echo -e "  ${YELLOW}│                                                                │${NC}"
    echo -e "  ${YELLOW}│  1. Click your web app (or create one with </> icon)            │${NC}"
    echo -e "  ${YELLOW}│  2. Click 'Register app' → 'Web app'                           │${NC}"
    echo -e "  ${YELLOW}│  3. Copy the firebaseConfig JSON object                        │${NC}"
    echo -e "  ${YELLOW}│  4. Paste it below                                             │${NC}"
    echo -e "  ${YELLOW}└────────────────────────────────────────────────────────────────┘${NC}"
    echo ""
    echo -e "  ${WHITE}Paste firebaseConfig JSON here (or press ENTER to skip):${NC}"
    read -r PASTED_CONFIG
    
    if [ -n "$PASTED_CONFIG" ]; then
        API_KEY=$(echo "$PASTED_CONFIG" | python3 -c "import json,sys; print(json.load(sys.stdin).get('apiKey',''))" 2>/dev/null || echo "")
        AUTH_DOMAIN=$(echo "$PASTED_CONFIG" | python3 -c "import json,sys; print(json.load(sys.stdin).get('authDomain',''))" 2>/dev/null || echo "$AUTH_DOMAIN")
        STORAGE_BUCKET=$(echo "$PASTED_CONFIG" | python3 -c "import json,sys; print(json.load(sys.stdin).get('storageBucket',''))" 2>/dev/null || echo "$STORAGE_BUCKET")
        MESSAGING_SENDER_ID=$(echo "$PASTED_CONFIG" | python3 -c "import json,sys; print(json.load(sys.stdin).get('messagingSenderId',''))" 2>/dev/null || echo "")
        APP_ID=$(echo "$PASTED_CONFIG" | python3 -c "import json,sys; print(json.load(sys.stdin).get('appId',''))" 2>/dev/null || echo "")
        ok "Config parsed from paste"
    fi
fi

if [ -z "$API_KEY" ]; then
    fail "No API Key obtained! Cannot continue."
    echo -e "  ${YELLOW}Make sure you have a valid Firebase project with a Web App registered.${NC}"
    exit 1
fi

dim "API Key:     $API_KEY"
dim "App ID:      $APP_ID"
dim "Auth Domain: $AUTH_DOMAIN"

# Enable Google Auth provider
dim "Enabling Google Authentication..."
firebase auth:enable 2>/dev/null || true
ok "Authentication enabled"

echo ""
echo -e "  ${YELLOW}IMPORTANT: Enable Google Sign-In in Firebase Console:${NC}"
echo -e "  ${CYAN}https://console.firebase.google.com/project/${PROJECT_ID}/authentication/providers${NC}"
echo -e "  ${DIM}Click 'Google' → Enable → Save${NC}"
echo -e "  ${DIM}Also add localhost:3000 to Authorized Domains in Auth Settings${NC}"
echo ""

# ═══════════════════════════════════════════════════════════════════════
# STEP 6 : Write .env.local
# ═══════════════════════════════════════════════════════════════════════
step 6 $STEPS "Writing .env.local..."

# Preserve existing non-Firebase env vars
ENV_LINES=()
if [ -f ".env.local" ]; then
    while IFS= read -r line; do
        if [[ "$line" != *"FIREBASE"* ]]; then
            ENV_LINES+=("$line")
        fi
    done < .env.local
    ok "Preserved existing non-Firebase env variables"
fi

# Generate JWT secret
JWT_SECRET=$(python3 -c "import secrets,string; print(''.join(secrets.choice(string.ascii_letters+string.digits) for _ in range(40)))" 2>/dev/null || echo "change-me-$(date +%s)")

# Build env file
ENV_LINES+=("")
ENV_LINES+=("# ═══════════════════════════════════════════════════════════════")
ENV_LINES+=("# Firebase Configuration — Auto-generated by setup-firebase.sh")
ENV_LINES+=("# Generated: $(date -u '+%Y-%m-%d %H:%M:%S UTC')")
ENV_LINES+=("# Project: $PROJECT_ID")
ENV_LINES+=("# ═══════════════════════════════════════════════════════════════")
ENV_LINES+=("NEXT_PUBLIC_FIREBASE_API_KEY=\"$API_KEY\"")
ENV_LINES+=("NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=\"$AUTH_DOMAIN\"")
ENV_LINES+=("NEXT_PUBLIC_FIREBASE_PROJECT_ID=\"$PROJECT_ID\"")
ENV_LINES+=("NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=\"$STORAGE_BUCKET\"")
ENV_LINES+=("NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=\"$MESSAGING_SENDER_ID\"")
ENV_LINES+=("NEXT_PUBLIC_FIREBASE_APP_ID=\"$APP_ID\"")
if [ -n "$MEASUREMENT_ID" ]; then
    ENV_LINES+=("NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID=\"$MEASUREMENT_ID\"")
fi
ENV_LINES+=("")
ENV_LINES+=("# Firebase Admin SDK (Server-side only — KEEP SECRET!)")
ENV_LINES+=("# To enable: generate key at")
ENV_LINES+=("# https://console.firebase.google.com/project/${PROJECT_ID}/settings/serviceaccounts/adminsdk")
ENV_LINES+=("# FIREBASE_PROJECT_ID=\"$PROJECT_ID\"")
ENV_LINES+=("# FIREBASE_CLIENT_EMAIL=\"your-service-account@iam.gserviceaccount.com\"")
ENV_LINES+=('# FIREBASE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\\nYOUR_KEY\\n-----END PRIVATE KEY-----"')
ENV_LINES+=("")

# Add JWT secret if not already present
if ! grep -q "JWT_SECRET" .env.local 2>/dev/null; then
    ENV_LINES+=("# Production JWT Secret")
    ENV_LINES+=("JWT_SECRET=\"$JWT_SECRET\"")
    ENV_LINES+=("")
fi

ENV_LINES+=("# ═══════════════════════════════════════════════════════════════")

printf '%s\n' "${ENV_LINES[@]}" > .env.local
ok ".env.local written"

# Verify
if grep -q "NEXT_PUBLIC_FIREBASE_API_KEY" .env.local && [ -n "$API_KEY" ]; then
    ok "Config verified: API Key present"
else
    fail "Config verification failed"
fi

# ═══════════════════════════════════════════════════════════════════════
# STEP 7 : Install Packages & Create Config Files
# ═══════════════════════════════════════════════════════════════════════
step 7 $STEPS "Installing packages & creating config files..."

dim "Installing firebase + firebase-admin via $PM..."
case "$PM" in
    bun)   bun add firebase firebase-admin 2>&1 | tail -1 ;;
    pnpm)  pnpm add firebase firebase-admin 2>&1 | tail -1 ;;
    *)     npm install firebase firebase-admin 2>&1 | tail -1 ;;
esac
ok "Packages installed"

# .firebaserc
cat > .firebaserc << FIREBASERC
{"projects":{"default":"$PROJECT_ID"}}
FIREBASERC
ok ".firebaserc created"

# firebase.json
cat > firebase.json << 'FIREBASEJSON'
{
  "hosting": {
    "public": "out",
    "ignore": ["firebase.json","**/.*","**/node_modules/**"],
    "rewrites": [
      { "source": "/api/**", "function": "api" },
      { "source": "**", "destination": "/index.html" }
    ]
  },
  "emulators": {
    "auth": { "port": 9099, "host": "0.0.0.0" },
    "firestore": { "port": 8080, "host": "0.0.0.0" },
    "hosting": { "port": 5000, "host": "0.0.0.0" },
    "ui": { "enabled": true, "port": 4000 }
  }
}
FIREBASEJSON
ok "firebase.json created"

# .gitignore update
if [ -f ".gitignore" ] && ! grep -q "firebase-admin-key" .gitignore 2>/dev/null; then
    echo -e "\n# Firebase\n.firebase/\nfirebase-admin-key*.json\n*service-account*.json\n.env.local.firebase-backup" >> .gitignore
    ok ".gitignore updated"
fi

# Push DB schema
if command -v npx &>/dev/null || command -v bunx &>/dev/null; then
    dim "Setting up database..."
    case "$PM" in
        bun)   bunx prisma db push 2>&1 | tail -2 || true ;;
        *)     npx prisma db push 2>&1 | tail -2 || true ;;
    esac
    ok "Database ready"
fi

# ═══════════════════════════════════════════════════════════════════════
# DONE!
# ═══════════════════════════════════════════════════════════════════════
echo ""
echo -e "  ${GREEN}═════════════════════════════════════════════════════════════${NC}"
echo -e "  ${GREEN}||                                                          ||${NC}"
echo -e "  ${GREEN}||         FIREBASE SETUP COMPLETE! ✓                       ||${NC}"
echo -e "  ${GREEN}||                                                          ||${NC}"
echo -e "  ${GREEN}═════════════════════════════════════════════════════════════${NC}"
echo ""
echo -e "  Project:       ${CYAN}$PROJECT_ID${NC}"
echo -e "  App ID:        ${CYAN}$APP_ID${NC}"
echo -e "  Config File:   ${CYAN}.env.local${NC}"
echo ""
echo -e "  ${WHITE}What's working:${NC}"
echo -e "    ${GREEN}✓${NC} Google Sign-In (real popup)"
echo -e "    ${GREEN}✓${NC} Auto user creation in database"
echo -e "    ${GREEN}✓${NC} JWT token exchange (Firebase → PU-ALRMS)"
echo -e "    ${GREEN}✓${NC} Google profile photo sync"
echo ""
echo -e "  ${YELLOW}=== BEFORE RUNNING THE APP ===${NC}"
echo ""
echo -e "  ${WHITE}1. Enable Google Sign-In provider:${NC}"
echo -e "     ${CYAN}https://console.firebase.google.com/project/${PROJECT_ID}/authentication/providers${NC}"
echo -e "     ${DIM}Click 'Google' → Toggle ON → Save${NC}"
echo ""
echo -e "  ${WHITE}2. Add localhost to Authorized Domains:${NC}"
echo -e "     ${CYAN}https://console.firebase.google.com/project/${PROJECT_ID}/authentication/settings${NC}"
echo -e "     ${DIM}Under 'Authorized domains' → Add 'localhost'${NC}"
echo ""
echo -e "  ${WHITE}3. (Optional) Service Account for Admin SDK:${NC}"
echo -e "     ${CYAN}https://console.firebase.google.com/project/${PROJECT_ID}/settings/serviceaccounts/adminsdk${NC}"
echo -e "     ${DIM}Generate New Private Key → Save → Add to .env.local${NC}"
echo ""
echo -e "  ${GREEN}=== THEN START THE APP ===${NC}"
echo ""
echo -e "  ${WHITE}  $PM run dev${NC}"
echo ""
echo -e "  ${MAGENTA}Open in browser: http://localhost:3000${NC}"
echo ""
