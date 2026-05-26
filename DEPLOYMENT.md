# PU-ALRMS — Deployment Guide

> Complete guide for deploying PU-ALRMS to production with Turso database and Vercel.

---

## Prerequisites

| Tool | Required | Purpose |
|------|----------|---------|
| **Git** | Yes | Push code to GitHub (triggers Vercel auto-deploy) |
| **Node.js 18+** | Yes | Build and run the project |
| **Turso CLI** | Auto-installed by script | Create/manage the production database |
| **Python 3** | Helpful | Used by the setup script for JSON parsing |
| **curl** | Yes | API calls to Vercel and Turso |

### Vercel Account & Project

- A [Vercel](https://vercel.com) account (free Hobby tier works)
- The `pu-alrms` project already connected to `azmainwork0011/pu-alrms` GitHub repo
- Deployments auto-trigger on `git push` to `main`

### Turso Account

- A [Turso](https://turso.tech) account (free Starter plan: 9GB storage, 500 DBs)
- Created automatically by the setup script if you don't have one

---

## Quick Start — One Command Setup

This is the recommended approach for first-time setup. It handles **everything**:

```bash
# Make the script executable
chmod +x scripts/setup-production-db.sh

# Run the full setup
./scripts/setup-production-db.sh
```

The script will:
1. Install the Turso CLI (if missing)
2. Authenticate with Turso (headless signup if needed)
3. Create a `pu-alrms` database in Singapore
4. Push the Prisma schema to the remote database
5. Seed demo data (admin, teacher, student, CR accounts)
6. Set `DATABASE_URL`, `DATABASE_AUTH_TOKEN`, `NEXTAUTH_URL`, and `NEXTAUTH_SECRET` on Vercel
7. Trigger a Vercel redeployment

When it finishes, visit **https://pu-alrms.vercel.app** to verify.

### Script Flags

| Flag | Description |
|------|-------------|
| `--skip-seed` | Skip demo data seeding (useful for re-deploys) |
| `--skip-redeploy` | Skip the Vercel redeployment step |
| `--force-reset` | Drop all tables before pushing schema (destructive!) |
| `--help` | Show usage info |

---

## Manual Setup

If you prefer to set things up step by step, follow this guide.

### Step 1: Install & Authenticate Turso CLI

```bash
# Install Turso CLI
curl -sSfL https://get.tur.so/install.sh | bash

# Authenticate (opens browser or uses headless signup)
turso auth signup --headless
# OR: turso auth login
```

### Step 2: Create the Database

```bash
# Create database in Singapore (closest to Bangladesh)
turso db create pu-alrms --region sin

# Verify it exists
turso db show pu-alrms
```

### Step 3: Generate Credentials

```bash
# Get the connection URL
turso db show pu-alrms --url
# → libsql://pu-alrms-<your-org>.turso.io

# Create a long-lived auth token (1 year)
turso db tokens create pu-alrms --expiration 8760h
```

### Step 4: Push Prisma Schema

```bash
# Set environment for this command only
export DATABASE_URL="libsql://pu-alrms-<your-org>.turso.io"
export DATABASE_AUTH_TOKEN="<your-token>"

# Push schema (creates all tables)
npx prisma db push

# Seed demo data
npx tsx prisma/seed.ts
```

### Step 5: Configure Vercel Environment Variables

Go to **https://vercel.com/pu-alrms/settings/environment-variables** and add:

| Key | Value | Notes |
|-----|-------|-------|
| `DATABASE_URL` | `libsql://pu-alrms-<org>.turso.io` | The URL from Step 3 |
| `DATABASE_AUTH_TOKEN` | `<your-token>` | The token from Step 3 |
| `NEXTAUTH_URL` | `https://pu-alrms.vercel.app` | Required for OAuth callbacks |
| `NEXTAUTH_SECRET` | *(generate one)* | `openssl rand -base64 32` |
| `GOOGLE_CLIENT_ID` | *(your Google OAuth ID)* | See [Google OAuth Setup](#google-oauth-setup) |
| `GOOGLE_CLIENT_SECRET` | *(your Google OAuth secret)* | See [Google OAuth Setup](#google-oauth-setup) |
| `SUPER_ADMIN_EMAIL` | `your@email.com` | First login with this email gets SUPER_ADMIN role |

All variables should be set for **Production**, **Preview**, and **Development** environments.

### Step 6: Trigger Redeploy

```bash
# Option A: Push to GitHub (recommended)
git push origin main

# Option B: Use the quick deploy script
chmod +x scripts/deploy-turso.sh
./scripts/deploy-turso.sh

# Option C: Trigger from Vercel dashboard
# → https://vercel.com/pu-alrms/deployments → Click "Redeploy"
```

---

## Google OAuth Setup

Google sign-in is optional but recommended. To enable it:

1. Go to [Google Cloud Console → Credentials](https://console.cloud.google.com/apis/credentials)
2. Create a new **OAuth 2.0 Client ID** (Web application type)
3. Add **Authorized redirect URIs**:
   - Development: `http://localhost:3000/api/auth/callback/google`
   - Production: `https://pu-alrms.vercel.app/api/auth/callback/google`
4. Copy the **Client ID** and **Client Secret**
5. Add them as Vercel environment variables (`GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET`)
6. Redeploy

---

## Day-to-Day Operations

### Updating the Database Schema

After modifying `prisma/schema.prisma`:

```bash
# Local dev (SQLite):
npx prisma db push

# Production (Turso):
chmod +x scripts/deploy-turso.sh
./scripts/deploy-turso.sh
```

The `deploy-turso.sh` script refreshes the auth token, pushes the schema, updates Vercel env vars, and triggers a redeploy.

### Rotating the Database Auth Token

Turso tokens have an expiration (the setup script creates 1-year tokens). To rotate:

```bash
# Quick way — just re-run the deploy script
./scripts/deploy-turso.sh
```

### Resetting the Production Database

> **Warning:** This permanently deletes all data!

```bash
./scripts/setup-production-db.sh --force-reset
```

### Checking Database Status

```bash
# View database info
turso db show pu-alrms

# Open an interactive shell
turso db shell pu-alrms

# Check tables
turso db shell pu-alrms ".tables"
```

---

## Troubleshooting

### "Turso CLI not found"

```bash
curl -sSfL https://get.tur.so/install.sh | bash
# Restart your terminal or run:
export PATH="$HOME/.turso:$PATH"
```

### "Not logged in to Turso"

```bash
turso auth signup --headless   # Automated
# OR
turso auth login                # Opens browser
```

### "Database already exists" (during setup)

This is normal — the script handles it gracefully and skips creation.

### "Failed to push schema" / Prisma errors

```bash
# Verify credentials
turso db show pu-alrms --url
turso db tokens create pu-alrms

# Test connection manually
export DATABASE_URL="libsql://pu-alrms-<org>.turso.io"
export DATABASE_AUTH_TOKEN="<token>"
npx prisma db push
```

### "Vercel redeploy failed"

- Check that the Vercel project name is exactly `pu-alrms`
- Verify the token is valid
- Trigger manually: https://vercel.com/pu-alrms/deployments → **Redeploy**

### "Google OAuth not working"

1. Verify redirect URIs match exactly (including `https://`)
2. Check that `GOOGLE_CLIENT_ID` and `GOOGLE_CLIENT_SECRET` are set on Vercel
3. Check that `NEXTAUTH_URL` matches your domain

### Site loads but database errors appear

1. Check Vercel function logs: https://vercel.com/pu-alrms/logs
2. Verify `DATABASE_URL` and `DATABASE_AUTH_TOKEN` are set correctly
3. Try the health endpoint: `https://pu-alrms.vercel.app/api/health/db`

### "Auth token expired"

```bash
# Re-run the deploy script to generate a new token
./scripts/deploy-turso.sh
```

---

## Architecture Overview

```
┌─────────────┐     ┌──────────────┐     ┌─────────────────┐
│   GitHub    │────▶│    Vercel    │────▶│   Turso/LibSQL  │
│  (repo)     │ push│  (Edge/SSR)  │ API │   (Singapore)   │
└─────────────┘     └──────────────┘     └─────────────────┘
                           │
                    ┌──────┴──────┐
                    │  Next.js    │
                    │  App Router │
                    │  API Routes │
                    └─────────────┘
```

- **Database**: Turso (LibSQL) — distributed SQLite with automatic replication
- **Hosting**: Vercel — serverless functions + edge network
- **Region**: Singapore (`sin`) — optimal for Bangladesh users (~30-50ms latency)

---

## Environment Variables Reference

See [`.env.example`](./.env.example) for the complete list of all environment variables with descriptions.

**Critical for production** (set on Vercel):
- `DATABASE_URL` — Turso/LibSQL connection URL
- `DATABASE_AUTH_TOKEN` — Turso authentication token
- `NEXTAUTH_URL` — Production URL for OAuth callbacks
- `NEXTAUTH_SECRET` — Cryptographic secret (auto-generated by setup script)
- `JWT_SECRET` — JSON Web Token secret
