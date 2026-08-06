"""Review generated tracks before they're finalized.

Newly rendered tracks land in review/pending/. `accept` finalizes a track
into /output; `reject` moves it to review/rejected/ instead.
"""
import argparse
import shutil

from common import ensure_dirs, load_config, resolve_path


def list_pending(config: dict) -> None:
    pending_dir = resolve_path(config, "review") / "pending"
    tracks = sorted(pending_dir.glob("*.wav"))
    if not tracks:
        print("No tracks awaiting review.")
    for track in tracks:
        print(track.name)


def accept(config: dict, name: str) -> None:
    pending_dir = resolve_path(config, "review") / "pending"
    output_dir = resolve_path(config, "output")
    src = pending_dir / name
    if not src.exists():
        raise SystemExit(f"Not found in review/pending: {name}")
    shutil.move(str(src), output_dir / name)
    print(f"Accepted -> {output_dir / name}")


def reject(config: dict, name: str) -> None:
    pending_dir = resolve_path(config, "review") / "pending"
    rejected_dir = resolve_path(config, "review") / "rejected"
    src = pending_dir / name
    if not src.exists():
        raise SystemExit(f"Not found in review/pending: {name}")
    shutil.move(str(src), rejected_dir / name)
    print(f"Rejected -> {rejected_dir / name}")


def main():
    parser = argparse.ArgumentParser(description="Review generated tracks in review/pending")
    sub = parser.add_subparsers(dest="command", required=True)
    sub.add_parser("list", help="List tracks awaiting review")
    accept_p = sub.add_parser("accept", help="Finalize a track into /output")
    accept_p.add_argument("name")
    reject_p = sub.add_parser("reject", help="Move a track to review/rejected")
    reject_p.add_argument("name")

    args = parser.parse_args()
    config = load_config()
    ensure_dirs(config)

    if args.command == "list":
        list_pending(config)
    elif args.command == "accept":
        accept(config, args.name)
    elif args.command == "reject":
        reject(config, args.name)


if __name__ == "__main__":
    main()
