"""Step 4: Turn curated clips in /processed into categorized musical stems.

Tonal clips are pitch-quantized to the nearest note in the configured scale
and routed to /stems/bass or /stems/pads by register. Textural/noisy clips
are time-stretched and looped into drones in /stems/texture. Clips with
dense onsets have their transients isolated into one-shots in
/stems/percussion.
"""
import argparse
from pathlib import Path

import librosa
import numpy as np
import soundfile as sf

from common import (
    ensure_dirs,
    load_catalog,
    load_config,
    parse_scale,
    quantize_to_scale,
    resolve_path,
    save_catalog,
    setup_logging,
)


def loop_to_duration(y: np.ndarray, sr: int, target_duration: float, crossfade_sec: float = 0.05) -> np.ndarray:
    target_len = int(target_duration * sr)
    if len(y) == 0:
        return np.zeros(target_len, dtype=np.float32)

    if len(y) >= target_len:
        out = y[:target_len].copy()
    else:
        crossfade_len = min(int(crossfade_sec * sr), len(y) // 2) or 1
        out = y.copy()
        while len(out) < target_len:
            fade_out = np.linspace(1, 0, crossfade_len)
            fade_in = np.linspace(0, 1, crossfade_len)
            blended = out[-crossfade_len:] * fade_out + y[:crossfade_len] * fade_in
            out = np.concatenate([out[:-crossfade_len], blended, y[crossfade_len:]])
        out = out[:target_len]

    fade_len = min(int(0.02 * sr), len(out) // 4) or 1
    out[:fade_len] *= np.linspace(0, 1, fade_len)
    out[-fade_len:] *= np.linspace(1, 0, fade_len)
    return out.astype(np.float32)


def time_stretch_to_duration(y: np.ndarray, sr: int, target_duration: float) -> np.ndarray:
    duration = len(y) / sr
    if duration <= 0:
        return np.zeros(int(target_duration * sr), dtype=np.float32)
    rate = max(0.25, min(4.0, duration / target_duration))
    stretched = librosa.effects.time_stretch(y, rate=rate)
    return loop_to_duration(stretched, sr, target_duration)


def extract_one_shots(y: np.ndarray, sr: int, hit_duration: float) -> list:
    onset_samples = librosa.onset.onset_detect(y=y, sr=sr, units="samples")
    hit_len = int(hit_duration * sr)
    hits = []
    for onset in onset_samples:
        hit = y[onset : onset + hit_len]
        if len(hit) < hit_len:
            hit = np.pad(hit, (0, hit_len - len(hit)))
        hit = hit.copy()
        fade_len = min(int(0.01 * sr), len(hit) // 4) or 1
        hit[-fade_len:] *= np.linspace(1, 0, fade_len)
        hits.append(hit.astype(np.float32))
    return hits


def process_clip(entry: dict, config: dict, logger) -> list:
    processed_dir = resolve_path(config, "processed")
    stems_dir = resolve_path(config, "stems")
    musical = config["musical"]
    src_path = processed_dir / entry["filename"]
    if not src_path.exists():
        logger.warning(f"Missing source clip {src_path}, skipping")
        return []

    y, sr = librosa.load(src_path, sr=config["audio"]["sample_rate"], mono=True)
    stem_base = Path(entry["filename"]).stem
    outputs = []

    is_percussive = entry["onset_density_per_sec"] >= musical["percussive_onset_density_threshold"]
    is_tonal = entry["is_tonal"] and entry["dominant_pitch_hz"]

    if is_percussive:
        hits = extract_one_shots(y, sr, musical["percussion_hit_duration"])
        for i, hit in enumerate(hits[: musical["max_hits_per_clip"]]):
            out_path = stems_dir / "percussion" / f"{stem_base}_hit{i:02d}.wav"
            sf.write(out_path, hit, sr)
            outputs.append({"category": "percussion", "path": str(out_path.relative_to(stems_dir.parent))})
        logger.info(f"{entry['filename']}: extracted {len(outputs)} percussion hit(s)")

    elif is_tonal:
        root_semitone, intervals = parse_scale(musical["scale"])
        q = quantize_to_scale(entry["dominant_pitch_hz"], root_semitone, intervals)
        shifted = librosa.effects.pitch_shift(y, sr=sr, n_steps=q["semitone_shift"])

        if q["quantized_midi"] < musical["bass_pitch_midi_max"]:
            category = "bass"
            out = shifted[: int(musical["bass_clip_duration"] * sr)].copy()
            fade_len = min(int(0.01 * sr), len(out) // 4) or 1
            out[-fade_len:] *= np.linspace(1, 0, fade_len)
        else:
            category = "pads"
            out = time_stretch_to_duration(shifted, sr, musical["pad_clip_duration"])

        out_path = stems_dir / category / f"{stem_base}_{q['quantized_midi']}.wav"
        sf.write(out_path, out, sr)
        outputs.append(
            {"category": category, "path": str(out_path.relative_to(stems_dir.parent)), "midi_note": q["quantized_midi"]}
        )
        logger.info(f"{entry['filename']}: quantized to MIDI {q['quantized_midi']} -> {category}")

    else:
        out = time_stretch_to_duration(y, sr, musical["texture_clip_duration"])
        out_path = stems_dir / "texture" / f"{stem_base}_texture.wav"
        sf.write(out_path, out, sr)
        outputs.append({"category": "texture", "path": str(out_path.relative_to(stems_dir.parent))})
        logger.info(f"{entry['filename']}: rendered texture/drone stem")

    return outputs


def run(config: dict, logger) -> list:
    catalog = load_catalog(config)
    all_outputs = []
    changed = False

    for entry in catalog:
        if entry.get("location") != "processed" or entry.get("staged_to_stems"):
            continue
        outputs = process_clip(entry, config, logger)
        entry["staged_to_stems"] = True
        entry["stems"] = outputs
        all_outputs.extend(outputs)
        changed = True

    if changed:
        save_catalog(config, catalog)

    logger.info(f"Processing complete: {len(all_outputs)} stem(s) generated")
    return all_outputs


def main():
    argparse.ArgumentParser(description="Turn curated clips into categorized musical stems").parse_args()
    config = load_config()
    ensure_dirs(config)
    logger = setup_logging(config, "process")
    run(config, logger)


if __name__ == "__main__":
    main()
