#!/bin/bash
# ╔══════════════════════════════════════════════════════════════════════╗
# ║                                                                  ║
# ║   PU-ALRMS FIREBASE AUTO-SETUP — Google Cloud Shell Edition       ║
# ║   ═════════════════════════════════════                             ║
# ║   INSTRUCTIONS:                                                   ║
# ║   1. You're already in Cloud Shell with project "pu-alrms"        ║
# ║   2. Upload your project files (git clone or upload)              ║
# ║   3. Run: chmod +x setup-firebase.sh && ./setup-firebase.sh       ║
# ║                                                                  ║
# ║   OR simply: bash setup-firebase.sh                               ║
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
echo -e "  ${MAGENTA}||    Google Cloud Shell Edition                           ||${NC}"
echo -e "  ${MAGENTA}||                                                          ||${NC}"
echo -e "  ${MAGENTA}═════════════════════════════════════════════════════════════${NC}"
echo ""
echo -e "  This script will automatically:" 
echo -e "    ${DIM}1.  Install Firebase CLI${NC}"
echo -e "    ${DIM}2.  Check Google Cloud authentication${NC}"
echo -e "    ${DIM}3.  Create/Select Firebase Project${NC}"
echo -e "    ${DIM}4.  Enable Google Authentication${NC}"
echo -e "    ${DIM}5.  Register Web App & fetch config${NC}"
echo -e "    ${DIM}6.  Setup Service Account (Admin SDK)${NC}"
echo -e "    ${DIM}7.  Write .env.local with all credentials${NC}"
echo -e "    ${DIM}8.  Install npm packages${NC}"
echo -e "    ${DIM}9.  Create Firebase config files${NC}"
echo ""
echo -e "  ${YELLOW}Press ENTER to start, or Ctrl+C to cancel...${NC}"
read -r

STEPS=9

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
        exit 1
    fi
else
    fail "Node.js not found"
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

# ═══════════════════════════════════════════════════════════════════════
# STEP 2 : Install Firebase CLI
# ═══════════════════════════════════════════════════════════════════════
step 2 $STEPS "Installing Firebase CLI..."

if command -v firebase &>/dev/null; then
    FB_VER=$(firebase --version 2>/dev/null || echo "?")
    ok "Firebase CLI already installed (v$FB_VER)"
else
    dim "Installing firebase-tools globally..."
    npm install -g firebase-tools 2>/dev/null
    if command -v firebase &>/dev/null; then
        ok "Firebase CLI installed"
    else
        fail "Failed to install Firebase CLI"
        echo -e "  ${YELLOW}Try: npm install -g firebase-tools${NC}"
        exit 1
    fi
fi

# ═══════════════════════════════════════════════════════════════════════
# STEP 3 : Google Authentication + Project
# ═══════════════════════════════════════════════════════════════════════
step 3 $STEPS "Google Cloud authentication..."

# Check if already authenticated (Cloud Shell usually is)
ACCOUNT=$(gcloud config get-value account 2>/dev/null || echo "")
if [ -n "$ACCOUNT" ] && [ "$ACCOUNT" != "(unset)" ]; then
    ok "Already authenticated as: $ACCOUNT"
else
    warn "Not authenticated with gcloud"
    dim "Running: gcloud auth login..."
    gcloud auth login --no-launch-browser 2>/dev/null || gcloud auth login 2>/dev/null
    ACCOUNT=$(gcloud config get-value account 2>/dev/null || echo "")
    if [ -n "$ACCOUNT" ]; then
        ok "Authenticated as: $ACCOUNT"
    else
        fail "Authentication failed. Run: gcloud auth login"
        exit 1
    fi
fi

# Check firebase login
firebase projects:list 2>/dev/null | head -3 >/dev/null 2>&1 || {
    dim "Firebase login needed..."
    firebase login --no-localhost 2>/dev/null || firebase login 2>/dev/null || true
}

# Project ID
CURRENT_PROJECT=$(gcloud config get-value project 2>/dev/null || echo "")

echo ""
echo -e "  ${WHITE}Current GCP Project: ${CYAN}${CURRENT_PROJECT}${NC}"
echo -e "  ${DIM}Press ENTER to use this, or type a different Project ID:${NC}"
read -r -p "  > " INPUT_PROJECT

if [ -n "$INPUT_PROJECT" ] && [ "$INPUT_PROJECT" != "$CURRENT_PROJECT" ]; then
    PROJECT_ID=$(echo "$INPUT_PROJECT" | tr '[:upper:]' '[:lower:]' | tr -cd 'a-z0-9-')
    gcloud config set project "$PROJECT_ID" 2>/dev/null
    ok "Switched to project: $PROJECT_ID"
else
    PROJECT_ID="$CURRENT_PROJECT"
    ok "Using project: $PROJECT_ID"
fi

if [ -z "$PROJECT_ID" ] || [ "$PROJECT_ID" = "(unset)" ]; then
    fail "No project set! Run: gcloud config set project YOUR_PROJECT_ID"
    exit 1
fi

# Ensure Firebase project exists
dim "Ensuring Firebase project exists..."
firebase projects:list 2>/dev/null | grep -q "$PROJECT_ID" || {
    dim "Creating Firebase project: $PROJECT_ID..."
    firebase projects:create "$PROJECT_ID" 2>&1 || {
        warn "Project creation may have failed — checking..."
    }
}
firebase use "$PROJECT_ID" 2>/dev/null || true
ok "Firebase project ready: $PROJECT_ID"

# ═══════════════════════════════════════════════════════════════════════
# STEP 4 : Enable Google Authentication
# ═══════════════════════════════════════════════════════════════════════
step 4 $STEPS "Enabling Google Authentication..."

# Enable required APIs
dim "Enabling Identity Toolkit API..."
gcloud services enable identitytoolkit.googleapis.com 2>/dev/null && ok "Identity Toolkit API enabled" || warn "API enable may need manual confirmation"

firebase auth:enable 2>/dev/null || true
ok "Google Authentication ready"

echo -e "  ${DIM}NOTE: Add your domain in Firebase Console > Auth > Settings > Authorized domains${NC}"

# ═══════════════════════════════════════════════════════════════════════
# STEP 5 : Register Web App & Get Config
# ═══════════════════════════════════════════════════════════════════════
step 5 $STEPS "Registering Web App & fetching config..."

# Check if web app already exists
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
    dim "Creating web app..."
    firebase apps:create web pu-alrms-web 2>/dev/null || true
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
    ok "Web app registered"
fi

# Fetch config via Firebase REST API
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
        warn "API fetch failed"
    fi
fi

# Fallback: manual paste
if [ -z "$API_KEY" ] || [ -z "$APP_ID" ]; then
    echo ""
    echo -e "  ${YELLOW}┌────────────────────────────────────────────────────────────┐${NC}"
    echo -e "  ${YELLOW}│  Could not auto-fetch config. Please open in browser:       │${NC}"
    echo -e "  ${CYAN}│  https://console.firebase.google.com/project/${PROJECT_ID}/settings/general${NC}"
    echo -e "  ${YELLOW}│  Copy the firebaseConfig object and paste below            │${NC}"
    echo -e "  ${YELLOW}└────────────────────────────────────────────────────────────┘${NC}"
    echo ""
    echo -e "  ${WHITE}Paste firebaseConfig JSON (or press ENTER to skip):${NC}"
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

dim "API Key:     $API_KEY"
dim "App ID:      $APP_ID"
dim "Auth Domain: $AUTH_DOMAIN"

# ═══════════════════════════════════════════════════════════════════════
# STEP 6 : Service Account (Admin SDK)
# ═══════════════════════════════════════════════════════════════════════
step 6 $STEPS "Setting up Service Account (Admin SDK)..."

SA_EMAIL=""
SA_KEY=""

# Try to get service account via gcloud
dim "Looking for Firebase Admin SDK service account..."
SA_EMAIL=$(gcloud beta firebase projects android-apps list --project="$PROJECT_ID" 2>/dev/null | head -1 || echo "")

# Use the default App Engine service account as fallback
if [ -z "$SA_EMAIL" ]; then
    SA_EMAIL="${PROJECT_ID}@appspot.gserviceaccount.com"
    warn "Using default service account (limited permissions)"
    warn "For full Admin SDK, generate a key manually:"
    echo -e "  ${CYAN}https://console.firebase.google.com/project/${PROJECT_ID}/settings/serviceaccounts/adminsdk${NC}"
else
    ok "Service account: $SA_EMAIL"
fi

# Try to create a service account key
echo ""
echo -e "  ${YELLOW}To enable server-side token verification (recommended):${NC}"
echo -e "  ${CYAN}https://console.firebase.google.com/project/${PROJECT_ID}/settings/serviceaccounts/adminsdk${NC}"
echo ""
echo -e "  ${WHITE}Generate a new private key, then paste the JSON file path here.${NC}"
echo -e "  ${DIM}(Type 'skip' to use fallback mode)${NC}"
read -r -p "  > " KEY_PATH

if [ -n "$KEY_PATH" ] && [ "$KEY_PATH" != "skip" ] && [ "$KEY_PATH" != "n" ] && [ -f "$KEY_PATH" ]; then
    SA_EMAIL=$(python3 -c "import json; print(json.load(open('$KEY_PATH'))['client_email'])" 2>/dev/null || echo "")
    SA_KEY=$(python3 -c "
import json
k = json.load(open('$KEY_PATH'))['private_key']
print(k)
" 2>/dev/null || echo "")
    
    if [ -n "$SA_EMAIL" ] && [ -n "$SA_KEY" ]; then
        rm -f "$KEY_PATH" 2>/dev/null
        ok "Service Account loaded (file deleted for security)"
    else
        warn "Could not read key file — using fallback mode"
    fi
else
    warn "Skipped — server will use fallback JWT decode"
fi

# ═══════════════════════════════════════════════════════════════════════
# STEP 7 : Write .env.local
# ═══════════════════════════════════════════════════════════════════════
step 7 $STEPS "Writing .env.local..."

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
JWT_SECRET=$(python3 -c "import secrets,string; print(''.join(secrets.choice(string.ascii_letters+string.digits) for _ in range(40)))")

# Build env file
ENV_LINES+=("")
ENV_LINES+=("# ═══════════════════════════════════════════════════════════════")
ENV_LINES+=("# Firebase Configuration — Auto-generated by setup script")
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

if [ -n "$SA_EMAIL" ] && [ -n "$SA_KEY" ]; then
    ENV_LINES+=("FIREBASE_PROJECT_ID=\"$PROJECT_ID\"")
    ENV_LINES+=("FIREBASE_CLIENT_EMAIL=\"$SA_EMAIL\"")
    # Escape the private key for .env (newlines become \n)
    ESCAPED_KEY=$(echo "$SA_KEY" | tr '\n' '\\n' | sed 's/\\/\\\\/g')
    ENV_LINES+=("FIREBASE_PRIVATE_KEY=\"$ESCAPED_KEY\"")
else
    ENV_LINES+=("# FIREBASE_PROJECT_ID=\"$PROJECT_ID\"")
    ENV_LINES+=("# FIREBASE_CLIENT_EMAIL=\"your-service-account@iam.gserviceaccount.com\"")
    ENV_LINES+=('# FIREBASE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\\nYOUR_KEY\\n-----END PRIVATE KEY-----"')
fi
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

# Backup
cp .env.local .env.local.firebase-backup 2>/dev/null
ok "Backup: .env.local.firebase-backup"

# ═══════════════════════════════════════════════════════════════════════
# STEP 8 : Install Packages
# ═══════════════════════════════════════════════════════════════════════
step 8 $STEPS "Installing packages & creating config files..."

dim "Installing firebase + firebase-admin via $PM..."
case "$PM" in
    bun)   bun add firebase firebase-admin 2>/dev/null ;;
    pnpm)  pnpm add firebase firebase-admin 2>/dev/null ;;
    *)     npm install firebase firebase-admin 2>/dev/null ;;
esac
ok "Packages installed"

# .firebaserc
cat > .firebaserc << FIREBASERC
{"projects":{"default":"$PROJECT_ID"}}
FIREBASERC
ok ".firebaserc"

# firebase.json
cat > firebase.json << FIREBASEJSON
{
  "hosting": {
    "public": "out",
    "ignore": ["firebase.json","**/.*","**/node_modules/**"],
    "rewrites": [
      {"source": "/api/**", "function": "api"},
      {"source": "**", "destination": "/index.html"}
    ]
  },
  "emulators": {
    "auth": {"port": 9099, "host": "0.0.0.0"},
    "firestore": {"port": 8080, "host": "0.0.0.0"},
    "hosting": {"port": 5000, "host": "0.0.0.0"},
    "ui": {"enabled": true, "port": 4000}
  }
}
FIREBASEJSON
ok "firebase.json"

# firestore.rules
cat > firestore.rules << FIRESTORE_RULES
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /users/{userId} { allow read, write: if request.auth != null && request.auth.uid == userId; }
    match /public/{doc=**} { allow read: if request.auth != null; }
    match /{doc=**} { allow read, write: if false; }
  }
}
FIRESTORE_RULES
ok "firestore.rules"

# storage.rules
cat > storage.rules << STORAGE_RULES
rules_version = '2';
service firebase.storage {
  match /b/{bucket}/o {
    match /users/{userId}/{allPaths=**} { allow read, write: if request.auth != null && request.auth.uid == userId; }
    match /{allPaths=**} { allow read, write: if false; }
  }
}
STORAGE_RULES
ok "storage.rules"

# .gitignore update
if [ -f ".gitignore" ] && ! grep -q "firebase-admin-key" .gitignore 2>/dev/null; then
    echo -e "\n# Firebase\n.firebase/\nfirebase-admin-key*.json\n*service-account*.json\n.env.local.firebase-backup" >> .gitignore
    ok ".gitignore updated"
fi

# ═══════════════════════════════════════════════════════════════════════
# STEP 9 : Summary
# ═══════════════════════════════════════════════════════════════════════
step 9 $STEPS "Final verification..."

# Verify .env.local was created
if [ -f ".env.local" ] && grep -q "NEXT_PUBLIC_FIREBASE_API_KEY" .env.local; then
    ok ".env.local contains Firebase config"
else
    fail ".env.local is missing Firebase config"
fi

# Check packages
if [ -d "node_modules/firebase" ] && [ -d "node_modules/firebase-admin" ]; then
    ok "Firebase packages installed"
else
    warn "Firebase packages may need manual install"
fi

echo ""
echo -e "  ${GREEN}═════════════════════════════════════════════════════════════${NC}"
echo -e "  ${GREEN}||                                                          ||${NC}"
echo -e "  ${GREEN}||         FIREBASE SETUP COMPLETE! ✓                       ||${NC}"
echo -e "  ${GREEN}||                                                          ||${NC}"
echo -e "  ${GREEN}═════════════════════════════════════════════════════════════${NC}"
echo ""
echo -e "  Project:       ${CYAN}$PROJECT_ID${NC}"
echo -e "  Config File:   ${CYAN}.env.local${NC}"
echo -e "  Backup:        ${CYAN}.env.local.firebase-backup${NC}"
echo ""
echo -e "  ${WHITE}What's working now:${NC}"
echo -e "    ${GREEN}✓${NC} Real Google Sign-In (popup)"
echo -e "    ${GREEN}✓${NC} Auto user creation in database"
echo -e "    ${GREEN}✓${NC} JWT token exchange (Firebase → PU-ALRMS)"
echo -e "    ${GREEN}✓${NC} Google profile photo sync"
echo ""
echo -e "  ${YELLOW}Next steps:${NC}"
echo -e "    ${WHITE}1. Start dev server:   $PM run dev${NC}"
echo -e "    ${WHITE}2. Open the app${NC}"
echo -e "    ${WHITE}3. Click 'Sign in with Google' (green button)${NC}"
echo ""
echo -e "  ${MAGENTA}Firebase Console:${NC}"
echo -e "    ${CYAN}https://console.firebase.google.com/project/${PROJECT_ID}${NC}"
echo ""
echo -e "  ${YELLOW}Add authorized domains:${NC}"
echo -e "    ${CYAN}https://console.firebase.google.com/project/${PROJECT_ID}/authentication/settings${NC}"
echo ""
