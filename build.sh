#!/usr/bin/env bash
set -e
apt-get update -y
apt-get install -y ffmpeg python3-dev gcc
pip install --upgrade pip
pip install -r requirements.txt
