#!/usr/bin/env bash
set -e
echo "==> Installing Python packages..."
pip install --upgrade pip setuptools wheel
pip install -r requirements.txt
echo "==> Pre-downloading ffmpeg binary..."
python3 -c "import imageio_ffmpeg; print('ffmpeg:', imageio_ffmpeg.get_ffmpeg_exe())"
echo "==> Build complete!"
