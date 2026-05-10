#!/bin/bash
set -e

echo "=== Installing yt-dlp ==="
pip install yt-dlp --quiet

echo "=== Installing pnpm ==="
npm install -g pnpm --quiet

echo "=== Installing Node.js dependencies ==="
pnpm install --no-frozen-lockfile

echo "=== Building React frontend ==="
PORT=3000 BASE_PATH=/ pnpm --filter @workspace/downloader-ui run build

echo "=== Building API server ==="
PORT=3000 BASE_PATH=/ NODE_ENV=production pnpm --filter @workspace/api-server run build

echo "=== Build complete! ==="
