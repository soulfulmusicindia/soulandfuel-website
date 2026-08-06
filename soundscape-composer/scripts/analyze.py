"""Step 3: Analyze clips in /raw, tag with sonic features, curate into /processed.

For every clip: dominant pitch/pitch class, tempo/onset density, spectral
centroid (brightness), RMS energy, and a tonal-vs-noisy classification.
Silent or clipped clips are discarded (left in /raw); the rest are tagged
in processed/catalog.json + catalog.csv and moved into /processed.
"""
import argparse
import csv
import shutil
from pathlib import Path

import librosa
import numpy as np

from common import ensure_dirs, load_catalog, load_config, resolve_path, save_catalog, setup_logging


def analyze_clip(path: Path, config: dict) -> dict:
    sr_target = config["audio"]["sample_rate"]
    y, sr = librosa.load(path, sr=sr_target, mono=True)
    duration = len(y) / sr

    rms = librosa.feature.rms(y=y)[0]
    rms_mean = float(np.mean(rms)) if len(rms) else 0.0
    peak = float(np.max(np.abs(y))) if len(y) else 0.0

    centroid = librosa.feature.spectral_centroid(y=y, sr=sr)[0]
    centroid_mean = float(np.mean(centroid)) if len(centroid) else 0.0

    flatness = librosa.feature.spectral_flatness(y=y)[0]
    flatness_mean = float(np.mean(flatness)) if len(flatness) else 1.0

    onset_frames = librosa.onset.onset_detect(y=y, sr=sr)
    onset_density = len(onset_frames) / duration if duration > 0 else 0.0

    try:
        tempo, _ = librosa.beat.beat_track(y=y, sr=sr)
        tempo = float(tempo)
    except Exception:
        tempo = 0.0

    f0, voiced_flag, _ = librosa.pyin(
        y, fmin=librosa.note_to_hz("C2"), fmax=librosa.note_to_hz("C6"), sr=sr
    )
    voiced_f0 = f0[voiced_flag] if f0 is not None and voiced_flag is not None else np.array([])
    if len(voiced_f0) > 0:
        dominant_hz = float(np.nanmedian(voiced_f0))
        pitch_class = librosa.hz_to_note(dominant_hz)
        voiced_ratio = float(len(voiced_f0) / len(f0)) if len(f0) else 0.0
    else:
        dominant_hz, pitch_class, voiced_ratio = None, None, 0.0

    a = config["analysis"]
    is_silent = rms_mean < a["silence_rms_threshold"]
    is_clipped = peak >= a["clip_peak_threshold"]
    is_tonal = flatness_mean < a["tonal_flatness_threshold"] and voiced_ratio > a["tonal_voiced_ratio_threshold"]
    usable = not is_silent and not is_clipped

    return {
        "filename": path.name,
        "duration_sec": round(duration, 3),
        "rms_mean": round(rms_mean, 5),
        "peak": round(peak, 5),
        "spectral_centroid_hz": round(centroid_mean, 2),
        "spectral_flatness": round(flatness_mean, 5),
        "onset_density_per_sec": round(onset_density, 3),
        "tempo_bpm": round(tempo, 2),
        "dominant_pitch_hz": round(dominant_hz, 2) if dominant_hz else None,
        "dominant_pitch_class": pitch_class,
        "voiced_ratio": round(voiced_ratio, 3),
        "is_tonal": bool(is_tonal),
        "is_silent": bool(is_silent),
        "is_clipped": bool(is_clipped),
        "usable": bool(usable),
    }


def run(config: dict, logger) -> list:
    raw_dir = resolve_path(config, "raw")
    processed_dir = resolve_path(config, "processed")
    catalog = load_catalog(config)
    already_analyzed = {entry["filename"] for entry in catalog}

    clips = sorted(p for p in raw_dir.glob("*.wav"))
    logger.info(f"Found {len(clips)} clip(s) in {raw_dir}")

    new_entries = []
    for clip in clips:
        if clip.name in already_analyzed:
            continue
        logger.info(f"Analyzing {clip.name}")
        try:
            entry = analyze_clip(clip, config)
        except Exception as e:
            logger.error(f"Failed to analyze {clip.name}: {e}")
            continue

        if entry["usable"]:
            shutil.move(str(clip), processed_dir / clip.name)
            entry["location"] = "processed"
            logger.info(f"Kept {clip.name} (tonal={entry['is_tonal']})")
        else:
            entry["location"] = "raw_discarded"
            logger.info(f"Discarded {clip.name} ({'silent' if entry['is_silent'] else 'clipped'})")

        new_entries.append(entry)

    catalog.extend(new_entries)
    save_catalog(config, catalog)

    if catalog:
        csv_path = processed_dir / "catalog.csv"
        with open(csv_path, "w", newline="") as f:
            fieldnames = sorted({k for entry in catalog for k in entry.keys()})
            writer = csv.DictWriter(f, fieldnames=fieldnames)
            writer.writeheader()
            writer.writerows(catalog)

    logger.info(f"Analysis complete: {len(new_entries)} new clip(s) processed")
    return new_entries


def main():
    argparse.ArgumentParser(description="Analyze clips in /raw and curate usable ones into /processed").parse_args()
    config = load_config()
    ensure_dirs(config)
    logger = setup_logging(config, "analyze")
    run(config, logger)


if __name__ == "__main__":
    main()
