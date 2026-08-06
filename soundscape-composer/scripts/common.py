"""Shared utilities: config loading, scale theory, logging, path helpers."""
import json
import logging
import sys
from datetime import datetime
from pathlib import Path

import numpy as np
import yaml

PROJECT_ROOT = Path(__file__).resolve().parent.parent

NOTE_NAMES = ["C", "C#", "D", "D#", "E", "F", "F#", "G", "G#", "A", "A#", "B"]
NOTE_TO_SEMITONE = {name: i for i, name in enumerate(NOTE_NAMES)}
NOTE_TO_SEMITONE.update({"Db": 1, "Eb": 3, "Gb": 6, "Ab": 8, "Bb": 10})

SCALES = {
    "major": [0, 2, 4, 5, 7, 9, 11],
    "natural_minor": [0, 2, 3, 5, 7, 8, 10],
    "minor_pentatonic": [0, 3, 5, 7, 10],
    "major_pentatonic": [0, 2, 4, 7, 9],
    "dorian": [0, 2, 3, 5, 7, 9, 10],
    "mixolydian": [0, 2, 4, 5, 7, 9, 10],
}


def load_config(config_path: Path = None) -> dict:
    config_path = config_path or (PROJECT_ROOT / "config.yaml")
    with open(config_path) as f:
        return yaml.safe_load(f)


def resolve_path(config: dict, key: str) -> Path:
    return PROJECT_ROOT / config["paths"][key]


def ensure_dirs(config: dict) -> None:
    for key in ("raw", "processed", "output", "logs"):
        resolve_path(config, key).mkdir(parents=True, exist_ok=True)
    stems_root = resolve_path(config, "stems")
    for sub in ("bass", "pads", "percussion", "texture"):
        (stems_root / sub).mkdir(parents=True, exist_ok=True)
    review_root = resolve_path(config, "review")
    for sub in ("pending", "approved", "rejected"):
        (review_root / sub).mkdir(parents=True, exist_ok=True)


def parse_scale(scale_config: str):
    """'C_minor_pentatonic' -> (root_semitone, [interval list])"""
    root_name, _, scale_name = scale_config.partition("_")
    if root_name not in NOTE_TO_SEMITONE:
        raise ValueError(f"Unknown root note '{root_name}' in scale '{scale_config}'")
    if scale_name not in SCALES:
        raise ValueError(f"Unknown scale '{scale_name}'. Options: {list(SCALES)}")
    return NOTE_TO_SEMITONE[root_name], SCALES[scale_name]


def scale_midi_notes(root_semitone: int, intervals: list, low_midi: int, high_midi: int) -> list:
    return [m for m in range(low_midi, high_midi + 1) if (m - root_semitone) % 12 in intervals]


def hz_to_midi(freq_hz: float) -> float:
    return 69 + 12 * np.log2(freq_hz / 440.0)


def midi_to_hz(midi: float) -> float:
    return 440.0 * 2 ** ((midi - 69) / 12)


def quantize_to_scale(freq_hz: float, root_semitone: int, intervals: list) -> dict:
    """Nearest in-scale MIDI note for a detected frequency, plus the shift to get there."""
    midi = hz_to_midi(freq_hz)
    candidates = scale_midi_notes(root_semitone, intervals, int(midi) - 12, int(midi) + 12)
    nearest = min(candidates, key=lambda m: abs(m - midi))
    return {
        "source_midi": midi,
        "quantized_midi": nearest,
        "semitone_shift": nearest - midi,
        "quantized_hz": midi_to_hz(nearest),
    }


def timestamp() -> str:
    return datetime.now().strftime("%Y%m%d-%H%M%S")


def setup_logging(config: dict, name: str) -> logging.Logger:
    logs_dir = resolve_path(config, "logs")
    logs_dir.mkdir(parents=True, exist_ok=True)
    log_file = logs_dir / f"{name}_{timestamp()}.log"
    logger = logging.getLogger(name)
    logger.setLevel(logging.INFO)
    logger.handlers.clear()
    fmt = logging.Formatter("%(asctime)s [%(levelname)s] %(message)s")
    fh = logging.FileHandler(log_file)
    fh.setFormatter(fmt)
    sh = logging.StreamHandler(sys.stdout)
    sh.setFormatter(fmt)
    logger.addHandler(fh)
    logger.addHandler(sh)
    return logger


def load_catalog(config: dict) -> list:
    catalog_path = resolve_path(config, "processed") / "catalog.json"
    if not catalog_path.exists():
        return []
    with open(catalog_path) as f:
        return json.load(f)


def save_catalog(config: dict, catalog: list) -> None:
    catalog_path = resolve_path(config, "processed") / "catalog.json"
    with open(catalog_path, "w") as f:
        json.dump(catalog, f, indent=2)
