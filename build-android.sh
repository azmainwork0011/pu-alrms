#!/bin/bash
# ╔══════════════════════════════════════════════════════════════════════╗
# ║                                                                  ║
# ║   PU-ALRMS ANDROID APP BUILDER                                   ║
# ║   ═════════════════════════════════════                           ║
# ║   Kali Linux তে Android APK তৈরি করুন                          ║
# ║                                                                  ║
# ╚══════════════════════════════════════════════════════════════════════╝

set -e

RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
CYAN='\033[0;36m'
MAGENTA='\033[0;35m'
WHITE='\033[1;37m'
NC='\033[0m'

ok()   { echo -e "  ${GREEN}✓ $1${NC}"; }
fail() { echo -e "  ${RED}✗ $1${NC}"; }
warn() { echo -e "  ${YELLOW}! $1${NC}"; }
step() { echo -e "\n  ${CYAN}[$1/$STEPS] $2${NC}"; }

clear
echo ""
echo -e "  ${MAGENTA}═════════════════════════════════════════════════════════════${NC}"
echo -e "  ${MAGENTA}||                                                          ||${NC}"
echo -e "  ${MAGENTA}||    PU-ALRMS  ·  ANDROID APP BUILDER                      ||${NC}"
echo -e "  ${MAGENTA}||    Kali Linux Edition                                   ||${NC}"
echo -e "  ${MAGENTA}||                                                          ||${NC}"
echo -e "  ${MAGENTA}═════════════════════════════════════════════════════════════${NC}"
echo ""

STEPS=4

# ═══════════════════════════════════════════════════════════════════════
# STEP 1 : Check Prerequisites
# ═══════════════════════════════════════════════════════════════════════
step 1 $STEPS "Checking prerequisites..."

# Java JDK
if command -v java &>/dev/null; then
    JAVA_VER=$(java -version 2>&1 | head -1 | cut -d'"' -f2 | cut -d'.' -f1)
    if [ "$JAVA_VER" -ge 17 ]; then
        ok "Java JDK $JAVA_VER found"
    else
        warn "Java $JAVA_VER found (JDK 17+ recommended)"
    fi
else
    warn "Java JDK not found! Installing..."
    echo -e "  ${CYAN}  sudo apt update && sudo apt install -y openjdk-17-jdk${NC}"
    sudo apt update -qq && sudo apt install -y openjdk-17-jdk 2>&1 | tail -3
    ok "Java JDK installed"
fi

# Android SDK
ANDROID_HOME="${ANDROID_HOME:-$HOME/Android/Sdk}"
if [ -d "$ANDROID_HOME/platforms" ]; then
    ok "Android SDK found: $ANDROID_HOME"
else
    warn "Android SDK not found!"
    echo ""
    echo -e "  ${YELLOW}┌──────────────────────────────────────────────────────────────────┐${NC}"
    echo -e "  ${YELLOW}│  Android SDK needed! Install it:                                  │${NC}"
    echo -e "  ${WHITE}│                                                                  │${NC}"
    echo -e "  ${WHITE}│  Option 1: Install Android Studio                                  │${NC}"
    echo -e "  ${CYAN}│    https://developer.android.com/studio                            │${NC}"
    echo -e "  ${WHITE}│                                                                  │${NC}"
    echo -e "  ${WHITE}│  Option 2: Command-line tools only                                 │${NC}"
    echo -e "  ${CYAN}│    sudo apt install android-sdk                                    │${NC}"
    echo -e "  ${WHITE}│                                                                  │${NC}"
    echo -e "  ${WHITE}│  Option 3: Use Android Studio to open project & build APK         │${NC}"
    echo -e "  ${CYAN}│    (Easiest method — see instructions below)                      │${NC}"
    echo -e "  ${YELLOW}└──────────────────────────────────────────────────────────────────┘${NC}"
    echo ""

    echo -e "  ${YELLOW}Do you want to continue anyway? (y/n)${NC}"
    read -r CONTINUE
    if [ "$CONTINUE" != "y" ] && [ "$CONTINUE" != "Y" ]; then
        echo -e "  ${RED}Aborted.${NC}"
        exit 1
    fi
fi

# ═══════════════════════════════════════════════════════════════════════
# STEP 2 : Configure APP URL
# ═══════════════════════════════════════════════════════════════════════
step 2 $STEPS "Configure app URL..."

CURRENT_URL=$(grep 'APP_URL' android-app/app/src/main/java/com/pualrms/app/MainActivity.kt | grep -oP 'http[s]?://[^"]+' || echo "")
echo -e "  ${WHITE}Current URL: ${CYAN}${CURRENT_URL}${NC}"
echo ""
echo -e "  ${WHITE}Enter your deployed app URL:${NC}"
echo -e "  ${DIM}(Press ENTER to keep: ${CYAN}${CURRENT_URL}${DIM})${NC}"
read -r -p "  > " INPUT_URL

if [ -n "$INPUT_URL" ]; then
    # Update the URL in MainActivity.kt
    sed -i "s|private const val APP_URL = .*|private const val APP_URL = \"${INPUT_URL}\"|" \
        android-app/app/src/main/java/com/pualrms/app/MainActivity.kt
    ok "URL updated to: $INPUT_URL"
else
    ok "URL kept as: $CURRENT_URL"
fi

# ═══════════════════════════════════════════════════════════════════════
# STEP 3 : Build APK
# ═══════════════════════════════════════════════════════════════════════
step 3 $STEPS "Building APK..."

echo ""
echo -e "  ${YELLOW}Choose build method:${NC}"
echo -e "    ${WHITE}1. Build with Gradle (command line)${NC}"
echo -e "    ${WHITE}2. Open in Android Studio (GUI)${NC}"
echo -e "    ${WHITE}3. Skip (I'll build manually)${NC}"
echo ""
read -r -p "  > " BUILD_METHOD

case $BUILD_METHOD in
    1)
        if [ -d "$ANDROID_HOME/platforms" ]; then
            export ANDROID_HOME
            export PATH=$PATH:$ANDROID_HOME/platform-tools

            cd android-app

            # Create local.properties
            echo "sdk.dir=$ANDROID_HOME" > local.properties

            # Grant execute permission to gradlew
            chmod +x gradlew 2>/dev/null || true

            if [ -f "gradlew" ]; then
                echo -e "  ${DIM}Building debug APK...${NC}"
                ./gradlew assembleDebug 2>&1 | tail -10

                APK_PATH="app/build/outputs/apk/debug/app-debug.apk"
                if [ -f "$APK_PATH" ]; then
                    cp "$APK_PATH" "../PU-ALRMS-debug.apk"
                    ok "APK built successfully!"
                    echo -e "  ${GREEN}  APK saved: PU-ALRMS-debug.apk${NC}"
                    echo -e "  ${CYAN}  Size: $(du -h ../PU-ALRMS-debug.apk | cut -f1)${NC}"
                else
                    fail "APK build failed. Try Android Studio method."
                fi
            else
                fail "gradlew not found. Use Android Studio method."
            fi

            cd ..
        else
            fail "Android SDK not found. Use Android Studio method."
        fi
        ;;
    2)
        echo ""
        echo -e "  ${GREEN}═════════════════════════════════════════════════════════════${NC}"
        echo -e "  ${GREEN}||  ANDROID STUDIO BUILD INSTRUCTIONS                    ||${NC}"
        echo -e "  ${GREEN}═════════════════════════════════════════════════════════════${NC}"
        echo ""
        echo -e "  ${WHITE}1. Android Studio খুলুন${NC}"
        echo -e "  ${WHITE}2. 'Open an existing project' সিলেক্ট করুন${NC}"
        echo -e "  ${WHITE}3. এই folder টা খুলুন:${NC}"
        echo -e "     ${CYAN}  $(pwd)/android-app${NC}"
        echo -e "  ${WHITE}4. Gradle sync শেষ হওয়া পর্যন্ত অপেক্ষা করুন (2-5 min)${NC}"
        echo -e "  ${WHITE}5. উপরে মেনু: Build → Build Bundle(s)/APK(s) → Build APK(s)${NC}"
        echo -e "  ${WHITE}6. Build শেষ হলে notification-এ 'locate' ক্লিক করুন${NC}"
        echo ""
        echo -e "  ${YELLOW}  APK location:${NC}"
        echo -e "     ${CYAN}  android-app/app/build/outputs/apk/debug/app-debug.apk${NC}"
        echo ""
        echo -e "  ${WHITE}  অথবা Release APK:${NC}"
        echo -e "     Build → Generate Signed Bundle / APK → APK → Create new keystore${NC}"
        echo ""
        ;;
    3)
        echo -e "  ${DIM}Skipped. Build manually when ready.${NC}"
        ;;
    *)
        echo -e "  ${DIM}Invalid choice. Use Android Studio to build.${NC}"
        ;;
esac

# ═══════════════════════════════════════════════════════════════════════
# DONE!
# ═══════════════════════════════════════════════════════════════════════
step 4 $STEPS "Done!"

echo ""
echo -e "  ${GREEN}═════════════════════════════════════════════════════════════${NC}"
echo -e "  ${GREEN}||                                                          ||${NC}"
echo -e "  ${GREEN}||         ANDROID PROJECT READY! ✓                          ||${NC}"
echo -e "  ${GREEN}||                                                          ||${NC}"
echo -e "  ${GREEN}═════════════════════════════════════════════════════════════${NC}"
echo ""
echo -e "  ${WHITE}Project folder: ${CYAN}$(pwd)/android-app${NC}"
echo ""
echo -e "  ${YELLOW}Features:${NC}"
echo -e "    ${GREEN}✓${NC} Splash Screen with PU-ALRMS branding"
echo -e "    ${GREEN}✓${NC} Full-screen WebView"
echo -e "    ${GREEN}✓${NC} Pull-to-refresh"
echo -e "    ${GREEN}✓${NC} Progress bar loading"
echo -e "    ${GREEN}✓${NC} Network error handling (Bengali messages)"
echo -e "    ${GREEN}✓${NC} File upload support"
echo -e "    ${GREEN}✓${NC} Back button navigation"
echo -e "    ${GREEN}✓${NC} Exit confirmation dialog"
echo -e "    ${GREEN}✓${NC} External link handler (opens in browser)"
echo ""
echo -e "  ${MAGENTA}APK তৈরি হলে সবাইকে শেয়ার করুন — ফোনে install করেই ব্যবহার করতে পারবে! 📱${NC}"
echo ""
