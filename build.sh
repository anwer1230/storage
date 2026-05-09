#!/usr/bin/env bash
set -e
echo "==> Installing system dependencies..."
apt-get update -y -q
apt-get install -y -q ffmpeg python3-dev gcc g++ make libssl-dev
echo "==> Upgrading pip..."
pip install --upgrade pip setuptools wheel
echo "==> Installing Python packages..."
pip install -r requirements.txt
echo "==> Build complete!"
