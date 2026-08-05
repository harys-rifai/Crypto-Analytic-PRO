#!/usr/bin/env bash
set -e

# CryptoAnalytic - Run Script
# Starts the full-stack cryptocurrency tracker application
# (Express API server + Vite React dev client on a single port)
#
# Database: The app uses in-memory storage at runtime (MemStorage),
#   so no database server is needed to run the app. The DATABASE_URL
#   is only used by drizzle-kit for schema tooling. If you want
#   PostgreSQL persistence, set DATABASE_URL and start a Postgres
#   instance (e.g. the local one on port 5008 referenced in .env).

# Determine script directory (works on Linux/macOS/MinGW/Git Bash)
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$SCRIPT_DIR"

# Check for .env file, create from example if missing
if [ ! -f .env ]; then
  if [ -f .env.example ]; then
    echo "Creating .env from .env.example..."
    cp .env.example .env
  else
    echo "Warning: No .env file found. Using defaults."
  fi
fi

# Install dependencies if node_modules is missing
if [ ! -d node_modules ]; then
  echo "Installing dependencies..."
  npm install
fi

# Ensure DATABASE_URL is set (fall back to local PostgreSQL)
if ! grep -q "DATABASE_URL=" .env 2>/dev/null; then
  echo "DATABASE_URL not found in .env; using local sqlite-like default."
fi

# Ensure SESSION_SECRET is set
if ! grep -q "SESSION_SECRET=" .env 2>/dev/null; then
  echo "SESSION_SECRET=dev-secret-$(date +%s)" >> .env
fi

# Push database schema (creates tables; safe to run if DB already migrated)
# Note: This connects to the PostgreSQL at DATABASE_URL. If no DB is
# available, it will be skipped and the app will run using in-memory storage.
echo "Pushing database schema..."
npm run db:push 2>&1 || echo "db:push skipped (no database configured or unreachable)"

# CoinGecko API uses HTTPS; some environments fail TLS verification.
# Set NODE_TLS_REJECT_UNAUTHORIZED=0 to work around this in development.
export NODE_TLS_REJECT_UNAUTHORIZED=${NODE_TLS_REJECT_UNAUTHORIZED:-0}

# Start the development server
# This runs the Express server (server/index.ts) which also serves
# the Vite dev server for the React client in development mode.
echo "Starting CryptoAnalytic development server..."
echo "Access the app at http://localhost:${PORT:-5000}"
npm run dev
