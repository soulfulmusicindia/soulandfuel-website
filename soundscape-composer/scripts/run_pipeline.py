"""Step 6: End-to-end orchestration — ingest -> analyze -> process -> arrange.

Run manually or on a schedule (see cron/run_soundscape.sh) to turn newly
imported recordings into a new generative track awaiting review in
review/pending/. Each run's inputs/outputs are logged to /logs.
"""
import argparse
from pathlib import Path

import analyze
import arrange
import ingest
import process as processing
from common import ensure_dirs, load_config, setup_logging


def main():
    parser = argparse.ArgumentParser(description="Run the full soundscape-composer pipeline end-to-end")
    parser.add_argument("--source", required=True, help="Folder to scan for new recordings (e.g. phone sync folder)")
    parser.add_argument("--seed", type=int, default=None, help="Random seed for the arrangement step")
    args = parser.parse_args()

    config = load_config()
    ensure_dirs(config)
    logger = setup_logging(config, "pipeline")

    source_dir = Path(args.source).expanduser().resolve()
    if not source_dir.is_dir():
        logger.error(f"Source folder does not exist: {source_dir}")
        raise SystemExit(1)

    logger.info("=== Pipeline run start ===")
    logger.info(f"Source: {source_dir}")

    new_files = ingest.ingest(source_dir, config, logger)
    logger.info(f"Step 1/4 ingest: {len(new_files)} new recording(s)")

    new_analyzed = analyze.run(config, logger)
    logger.info(f"Step 2/4 analyze: {len(new_analyzed)} clip(s) analyzed")

    new_stems = processing.run(config, logger)
    logger.info(f"Step 3/4 process: {len(new_stems)} stem(s) generated")

    track_path = arrange.run(config, logger, seed=args.seed)
    logger.info(f"Step 4/4 arrange: track awaiting review -> {track_path}")

    logger.info("=== Pipeline run complete ===")
    print(f"\nNew track ready for review: {track_path}")
    print("Review it with:")
    print("  python scripts/review.py list")
    print(f"  python scripts/review.py accept {track_path.name}")
    print(f"  python scripts/review.py reject {track_path.name}")


if __name__ == "__main__":
    main()
