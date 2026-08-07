#!/usr/bin/env bash
set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$SCRIPT_DIR"

echo "Configuring git remote..."
git remote remove origin 2>/dev/null || true
git remote add origin https://github.com/harys-rifai/Crypto-Analytic-PRO.git

echo "Setting branch to main..."
git branch -M main

echo "Staging all changes..."
git add -A

echo "Committing changes..."
git commit -m "feat: add auth, reksa dana, postgres/sqlite fallback, redis support, dashboard fixes" || true

echo "Pushing to GitHub..."
git push -u origin main
