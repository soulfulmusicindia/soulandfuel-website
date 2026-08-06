"""Step 2: Ingest raw recordings from a phone-sync folder into /raw.

Copies (or transcodes via ffmpeg) new recordings into /raw as consistent
44.1kHz WAV files with clean, timestamp-based filenames. Already-ingested
source files are tracked in raw/ingest_manifest.json and skipped on re-runs.
"""
import argparse
import json
import shutil
import subprocess
from pathlib import Path

from common import ensure_dirs, load_config, resolve_path, setup_logging, timestamp

SUPPORTED_EXTENSIONS = {".m4a", ".mp3", ".wav", ".aac", ".caf"}


def load_manifest(manifest_path: Path) -> dict:
    if manifest_path.exists():
        with open(manifest_path) as f:
            return json.load(f)
    return {}


def save_manifest(manifest_path: Path, manifest: dict) -> None:
    with open(manifest_path, "w") as f:
        json.dump(manifest, f, indent=2)


def source_key(path: Path) -> str:
    stat = path.stat()
    return f"{path.name}:{stat.st_size}:{int(stat.st_mtime)}"


def convert_to_wav(src: Path, dst: Path, sample_rate: int, channels: int, logger) -> bool:
    cmd = ["ffmpeg", "-y", "-i", str(src), "-ar", str(sample_rate), "-ac", str(channels), str(dst)]
    result = subprocess.run(cmd, capture_output=True, text=True)
    if result.returncode != 0:
        logger.error(f"ffmpeg failed for {src}: {result.stderr.strip()[-500:]}")
        return False
    return True


def ingest(source_dir: Path, config: dict, logger) -> list:
    raw_dir = resolve_path(config, "raw")
    manifest_path = raw_dir / "ingest_manifest.json"
    manifest = load_manifest(manifest_path)

    sample_rate = config["audio"]["sample_rate"]
    channels = config["audio"]["channels"]

    ingested = []
    files = sorted(p for p in source_dir.rglob("*") if p.suffix.lower() in SUPPORTED_EXTENSIONS)
    logger.info(f"Found {len(files)} candidate recording(s) in {source_dir}")

    for src in files:
        key = source_key(src)
        if key in manifest:
            continue

        ts = timestamp()
        safe_stem = "".join(c if c.isalnum() or c in "-_" else "-" for c in src.stem)[:60]
        dst = raw_dir / f"{ts}_{safe_stem}.wav"
        while dst.exists():
            ts = timestamp()
            dst = raw_dir / f"{ts}_{safe_stem}.wav"

        if src.suffix.lower() == ".wav":
            shutil.copy2(src, dst)
        elif not convert_to_wav(src, dst, sample_rate, channels, logger):
            continue

        manifest[key] = {"source": str(src), "ingested_as": dst.name, "ingested_at": ts}
        ingested.append(dst.name)
        logger.info(f"Ingested {src.name} -> {dst.name}")

    save_manifest(manifest_path, manifest)
    logger.info(f"Ingest complete: {len(ingested)} new file(s)")
    return ingested


def main():
    parser = argparse.ArgumentParser(description="Ingest phone recordings into /raw")
    parser.add_argument("--source", required=True, help="Folder to scan for recordings (e.g. phone sync folder)")
    args = parser.parse_args()

    config = load_config()
    ensure_dirs(config)
    logger = setup_logging(config, "ingest")

    source_dir = Path(args.source).expanduser().resolve()
    if not source_dir.is_dir():
        logger.error(f"Source folder does not exist: {source_dir}")
        raise SystemExit(1)

    ingest(source_dir, config, logger)


if __name__ == "__main__":
    main()
