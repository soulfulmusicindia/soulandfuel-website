# soundscape-composer

Turns your own field recordings — ambient noise, textures, found sounds
recorded on your phone — into short generative music pieces, fully
automated after the sounds are imported. Pure signal processing and
algorithmic composition (librosa + pydub + pretty_midi); no AI music
generation involved.

## Folder structure

```
raw/            Freshly ingested recordings (WAV, 44.1kHz)
processed/      Curated clips + catalog.json / catalog.csv of extracted features
stems/
  bass/         Pitch-quantized low-register tonal stems
  pads/         Pitch-quantized sustained/high-register tonal stems
  percussion/   Isolated one-shot transients
  texture/      Time-stretched/looped drones from noisy/textural clips
output/         Finalized, accepted tracks
review/
  pending/      Freshly rendered tracks awaiting accept/reject
  approved/     (unused; accepted tracks move straight to output/)
  rejected/     Rejected tracks
logs/           Per-run logs, arrangement JSON schemas, and MIDI sketches
```

## Setup

```bash
python3 -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
```

Requires `ffmpeg` on your `PATH` (used to transcode `.m4a`/`.mp3`/etc. to WAV).

All tunable parameters (target scale, tempo, clip durations, arrangement
density/complexity, feature thresholds) live in `config.yaml`.

## Usage

Run the full pipeline end-to-end from a folder where your phone syncs
recordings to:

```bash
python scripts/run_pipeline.py --source "/path/to/phone/sync/folder"
```

This runs ingest → analyze → process → arrange and leaves a new track in
`review/pending/`. Review it before it's finalized:

```bash
python scripts/review.py list
python scripts/review.py accept soundscape_20260806-153012.wav   # -> output/
python scripts/review.py reject soundscape_20260806-153012.wav   # -> review/rejected/
```

### Individual steps

```bash
python scripts/ingest.py --source "/path/to/phone/sync/folder"  # -> raw/
python scripts/analyze.py                                       # raw/ -> processed/ + catalog
python scripts/process.py                                       # processed/ -> stems/
python scripts/arrange.py [--seed N]                             # stems/ -> review/pending/
```

Each script is idempotent: re-running only processes new files (tracked via
`raw/ingest_manifest.json` and flags in `processed/catalog.json`), so it's
safe to run the pipeline repeatedly as you import more recordings.

## Automation

`cron/run_soundscape.sh` is a wrapper suitable for cron (see the comment at
the top of the file for a crontab example). Each run's inputs/outputs and
step-by-step progress are logged to `logs/pipeline_<timestamp>.log`, and the
resulting track always lands in `review/pending/` first — nothing reaches
`output/` without an explicit `review.py accept`.
