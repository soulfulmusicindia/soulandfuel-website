"""Step 4: Turn curated clips in /processed into categorized musical stems.

Categories are not mutually exclusive: a single clip can contribute to
several stem folders, which matters when source recordings are short and/or
purely percussive (no long, sustained takes available). Tonal clips are
pitch-quantized to the nearest note in the configured scale and routed to
/stems/bass or /stems/pads by register. Every non-tonal clip is also
time-stretched into an ambient bed in /stems/texture, regardless of its
original duration. Clips with dense onsets have their transients isolated
into one-shots in /stems/percussion; a percussive, non-tonal clip additionally
donates its strongest transient, pitched down and quantized to the scale's
root register, as a /stems/bass hit so percussion-only material still gets
some low end.
"""
import argparse
from pathlib import Path

import librosa
import numpy as np
import soundfile as sf

from common import (
    ensure_dirs,
    hz_to_midi,
    load_catalog,
    load_config,
    parse_scale,
    quantize_to_scale,
    resolve_path,
    save_catalog,
    scale_midi_notes,
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


def make_noise_bass(y: np.ndarray, sr: int, entry: dict, config: dict, root_semitone: int, intervals: list):
    """Derive a low-register bass hit from a percussive, non-tonal clip's strongest transient."""
    musical = config["musical"]
    hit_len = int(musical["percussion_hit_duration"] * sr)
    onset_samples = librosa.onset.onset_detect(y=y, sr=sr, units="samples")
    candidates = list(onset_samples) if len(onset_samples) else [0]

    def energy_at(start: int) -> float:
        window = y[start : start + hit_len]
        return float(np.sqrt(np.mean(np.square(window)))) if len(window) else 0.0

    best_start = max(candidates, key=energy_at)
    hit = y[best_start : best_start + hit_len]
    if len(hit) < hit_len:
        hit = np.pad(hit, (0, hit_len - len(hit)))

    low, high = musical["noise_bass_midi_range"]
    scale_notes = scale_midi_notes(root_semitone, intervals, low, high)
    target_midi = min(scale_notes) if scale_notes else low

    source_hz = entry["spectral_centroid_hz"] or 200.0
    source_midi = hz_to_midi(max(source_hz, 20.0))
    shift = target_midi - source_midi
    shift_min, shift_max = musical["noise_bass_shift_range"]
    shift = max(shift_min, min(shift_max, shift))

    shifted = librosa.effects.pitch_shift(hit, sr=sr, n_steps=shift).copy()
    fade_len = min(int(0.01 * sr), len(shifted) // 4) or 1
    shifted[-fade_len:] *= np.linspace(1, 0, fade_len)
    return shifted.astype(np.float32), target_midi


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
    root_semitone, intervals = parse_scale(musical["scale"])

    if is_percussive:
        hits = extract_one_shots(y, sr, musical["percussion_hit_duration"])
        for i, hit in enumerate(hits[: musical["max_hits_per_clip"]]):
            out_path = stems_dir / "percussion" / f"{stem_base}_hit{i:02d}.wav"
            sf.write(out_path, hit, sr)
            outputs.append({"category": "percussion", "path": str(out_path.relative_to(stems_dir.parent))})
        logger.info(f"{entry['filename']}: extracted {len([o for o in outputs if o['category'] == 'percussion'])} percussion hit(s)")

    if is_tonal:
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
        # Non-tonal clips (short or long) always donate an ambient bed: time-stretch
        # already handles source clips shorter than the target duration by stretching
        # them out, so this doesn't require long takes.
        out = time_stretch_to_duration(y, sr, musical["texture_clip_duration"])
        out_path = stems_dir / "texture" / f"{stem_base}_texture.wav"
        sf.write(out_path, out, sr)
        outputs.append({"category": "texture", "path": str(out_path.relative_to(stems_dir.parent))})
        logger.info(f"{entry['filename']}: rendered texture/drone stem")

        if is_percussive:
            bass_audio, target_midi = make_noise_bass(y, sr, entry, config, root_semitone, intervals)
            out_path = stems_dir / "bass" / f"{stem_base}_noisebass{target_midi}.wav"
            sf.write(out_path, bass_audio, sr)
            outputs.append(
                {
                    "category": "bass",
                    "path": str(out_path.relative_to(stems_dir.parent)),
                    "midi_note": target_midi,
                    "source": "pitched_transient",
                }
            )
            logger.info(f"{entry['filename']}: derived noise-bass hit at MIDI {target_midi}")

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
