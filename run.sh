#!/usr/bin/env bash
set -e

# CryptoAnalytic - Run Script
# Starts the full-stack cryptocurrency tracker application
# (Express API server + Vite React dev client on a single port)

# Determine script directory (works on Linux/macOS/MinGW/Git Bash)
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$SCRIPT_DIR"

# Kill existing web app processes on the target port
PORT="${PORT:-5000}"
echo "Checking for existing processes on port ${PORT}..."
EXISTING_PID=$(netstat -ano 2>/dev/null | grep ":${PORT} " | grep LISTENING | awk '{print $NF}' | head -n1 || true)
if [ -n "$EXISTING_PID" ]; then
  echo "Killing existing process (PID: ${EXISTING_PID}) on port ${PORT}..."
  taskkill //F //PID "$EXISTING_PID" 2>/dev/null || kill -9 "$EXISTING_PID" 2>/dev/null || true
  sleep 2
else
  echo "No existing process found on port ${PORT}."
fi

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

# Ensure DATABASE_URL is set
if ! grep -q "DATABASE_URL=" .env 2>/dev/null; then
  echo "DATABASE_URL not found in .env; using local sqlite-like default."
fi

# Ensure SESSION_SECRET is set
if ! grep -q "SESSION_SECRET=" .env 2>/dev/null; then
  echo "SESSION_SECRET=dev-secret-$(date +%s)" >> .env
fi

# Check database connection
echo "Checking database connection..."
DATABASE_URL=$(grep "^DATABASE_URL=" .env | head -n1 | cut -d'=' -f2- | tr -d '"' | tr -d "'")
if [ -n "$DATABASE_URL" ]; then
  echo "DATABASE_URL detected. Attempting to verify connection..."
  node -e "
    const { Client } = require('pg');
    const url = process.env.DATABASE_URL || '$DATABASE_URL';
    const client = new Client({ connectionString: url, ssl: url.includes('neon') ? { rejectUnauthorized: false } : false });
    client.connect()
      .then(() => { console.log('Database connection successful'); client.end(); process.exit(0); })
      .catch((err) => { console.error('Database connection failed:', err.message); process.exit(1); });
  " 2>/dev/null || echo "Database connection check skipped or failed. App will use in-memory storage."
else
  echo "No DATABASE_URL configured. App will run with in-memory storage."
fi

# Push database schema
echo "Pushing database schema..."
DB_PUSH_OUTPUT=$(npm run db:push 2>&1 || true)
if echo "$DB_PUSH_OUTPUT" | grep -qi "column \"id\" is in a primary key"; then
  echo "db:push reported a PostgreSQL constraint notice; tables are already in place."
elif echo "$DB_PUSH_OUTPUT" | grep -qi "error"; then
  echo "$DB_PUSH_OUTPUT"
else
  echo "$DB_PUSH_OUTPUT"
fi

# CoinGecko API uses HTTPS; some environments fail TLS verification.
export NODE_TLS_REJECT_UNAUTHORIZED=${NODE_TLS_REJECT_UNAUTHORIZED:-0}

# Start the development server
echo "Starting CryptoAnalytic development server..."
echo "Access the app at http://localhost:${PORT}"
npm run dev
