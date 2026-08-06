#!/usr/bin/env bash
# Example wrapper for scheduling the full pipeline locally.
#
# Add to crontab (crontab -e), e.g. hourly:
#   0 * * * * SOUNDSCAPE_SOURCE_DIR="$HOME/Phone Sync/Recordings" /path/to/soundscape-composer/cron/run_soundscape.sh >> /path/to/soundscape-composer/logs/cron.log 2>&1
#
# Requires ffmpeg on PATH and a virtualenv with requirements.txt installed
# at PROJECT_DIR/.venv (adjust below if you use a different setup).
set -euo pipefail

PROJECT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
SOURCE_DIR="${SOUNDSCAPE_SOURCE_DIR:-$HOME/Phone Sync/Recordings}"

cd "$PROJECT_DIR"
if [ -f .venv/bin/activate ]; then
  source .venv/bin/activate
fi

python scripts/run_pipeline.py --source "$SOURCE_DIR"
