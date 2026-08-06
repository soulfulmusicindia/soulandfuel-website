"""Step 5: Generate a probabilistic arrangement from /stems and render it.

Builds a JSON timeline: percussion hits are placed probabilistically on a
16th-note grid (weighted toward downbeats), pad/texture stems form sustained
harmonic beds, and bass stems land on downbeats (with extra hits at higher
complexity). The timeline is mixed to a WAV with pydub and also exported as
a lightweight MIDI sketch (via pretty_midi) for reference. Density/complexity
are config parameters. The rendered track is written to review/pending/ so
it can be accepted or rejected before it's finalized into /output.
"""
import argparse
import json
import random
from pathlib import Path

import pretty_midi
from pydub import AudioSegment

from common import ensure_dirs, load_config, resolve_path, setup_logging, timestamp


def collect_stems(stems_dir: Path, category: str) -> list:
    return sorted((stems_dir / category).glob("*.wav"))


def build_timeline(config: dict, stems_dir: Path, rng: random.Random) -> dict:
    arrangement_cfg = config["arrangement"]
    musical = config["musical"]

    tempo = musical["tempo_bpm"]
    beats_per_bar = 4
    subdivisions = 4  # 16th notes
    bar_count = arrangement_cfg["bar_count"]

    step_sec = (60.0 / tempo) / subdivisions
    total_steps = bar_count * beats_per_bar * subdivisions
    total_duration_sec = total_steps * step_sec

    density = arrangement_cfg["density"]
    complexity = arrangement_cfg["complexity"]

    percussion_stems = collect_stems(stems_dir, "percussion")
    bass_stems = collect_stems(stems_dir, "bass")
    pad_stems = collect_stems(stems_dir, "pads")
    texture_stems = collect_stems(stems_dir, "texture")

    events = []

    for step in range(total_steps):
        if not percussion_stems:
            break
        beat_position = step % subdivisions
        is_downbeat = (step % (beats_per_bar * subdivisions)) == 0
        weight = density * (1.4 if is_downbeat else (1.0 if beat_position == 0 else 0.5 + complexity * 0.5))
        if rng.random() < min(weight, 0.95):
            stem = rng.choice(percussion_stems)
            events.append(
                {
                    "type": "percussion",
                    "stem": str(stem.relative_to(stems_dir.parent)),
                    "start_sec": round(step * step_sec, 4),
                    "gain_db": round(rng.uniform(-4, 0), 2),
                }
            )

    for bar in range(bar_count):
        if not bass_stems:
            break
        bar_start_step = bar * beats_per_bar * subdivisions
        stem = rng.choice(bass_stems)
        events.append(
            {
                "type": "bass",
                "stem": str(stem.relative_to(stems_dir.parent)),
                "start_sec": round(bar_start_step * step_sec, 4),
                "gain_db": -2,
            }
        )
        if complexity > 0.6 and rng.random() < complexity:
            extra_step = bar_start_step + (beats_per_bar // 2) * subdivisions
            events.append(
                {
                    "type": "bass",
                    "stem": str(rng.choice(bass_stems).relative_to(stems_dir.parent)),
                    "start_sec": round(extra_step * step_sec, 4),
                    "gain_db": -6,
                }
            )

    bed_pool = pad_stems + texture_stems
    layer_count = 1 if complexity < 0.5 else 2
    for i in range(min(layer_count, len(bed_pool))):
        stem = rng.choice(bed_pool)
        events.append(
            {
                "type": "bed",
                "stem": str(stem.relative_to(stems_dir.parent)),
                "start_sec": 0.0,
                "gain_db": -8 - i * 3,
            }
        )

    return {
        "tempo_bpm": tempo,
        "bar_count": bar_count,
        "total_duration_sec": round(total_duration_sec, 3),
        "density": density,
        "complexity": complexity,
        "events": events,
    }


def render_audio(timeline: dict, project_root: Path, sample_rate: int) -> AudioSegment:
    total_ms = int(timeline["total_duration_sec"] * 1000) + 2000
    mix = AudioSegment.silent(duration=total_ms, frame_rate=sample_rate)

    for event in timeline["events"]:
        stem_path = project_root / event["stem"]
        if not stem_path.exists():
            continue
        clip = AudioSegment.from_wav(stem_path).apply_gain(event["gain_db"])
        start_ms = int(event["start_sec"] * 1000)

        if event["type"] == "bed":
            layered = AudioSegment.silent(duration=total_ms, frame_rate=sample_rate)
            pos = 0
            while pos < total_ms:
                layered = layered.overlay(clip, position=pos)
                pos += max(len(clip), 1)
            mix = mix.overlay(layered, position=start_ms)
        else:
            mix = mix.overlay(clip, position=start_ms)

    return mix[: int(timeline["total_duration_sec"] * 1000)]


def build_midi(timeline: dict, out_path: Path) -> None:
    pm = pretty_midi.PrettyMIDI(initial_tempo=timeline["tempo_bpm"])
    bass_track = pretty_midi.Instrument(program=33, name="bass")
    drum_track = pretty_midi.Instrument(program=0, is_drum=True, name="percussion")

    for event in timeline["events"]:
        start = event["start_sec"]
        if event["type"] == "bass":
            try:
                midi_note = int(Path(event["stem"]).stem.rsplit("_", 1)[-1])
            except ValueError:
                midi_note = 40
            bass_track.notes.append(pretty_midi.Note(velocity=100, pitch=midi_note, start=start, end=start + 0.8))
        elif event["type"] == "percussion":
            drum_track.notes.append(pretty_midi.Note(velocity=100, pitch=36, start=start, end=start + 0.1))

    pm.instruments.extend([bass_track, drum_track])
    pm.write(str(out_path))


def run(config: dict, logger, seed: int = None) -> Path:
    rng = random.Random(seed)
    stems_dir = resolve_path(config, "stems")
    project_root = stems_dir.parent
    review_pending_dir = resolve_path(config, "review") / "pending"
    logs_dir = resolve_path(config, "logs")

    timeline = build_timeline(config, stems_dir, rng)
    if not timeline["events"]:
        logger.warning("No stems available; arrangement is empty. Run process.py first.")

    mix = render_audio(timeline, project_root, config["audio"]["sample_rate"])

    ts = timestamp()
    out_name = f"soundscape_{ts}.wav"
    out_path = review_pending_dir / out_name
    mix.export(out_path, format="wav")

    schema_path = logs_dir / f"arrangement_{ts}.json"
    with open(schema_path, "w") as f:
        json.dump(timeline, f, indent=2)

    build_midi(timeline, logs_dir / f"arrangement_{ts}.mid")

    logger.info(
        f"Rendered arrangement -> {out_path} "
        f"({len(timeline['events'])} events, {timeline['total_duration_sec']}s) awaiting review"
    )
    return out_path


def main():
    parser = argparse.ArgumentParser(description="Generate and render a probabilistic arrangement from /stems")
    parser.add_argument("--seed", type=int, default=None, help="Random seed for reproducible arrangements")
    args = parser.parse_args()

    config = load_config()
    ensure_dirs(config)
    logger = setup_logging(config, "arrange")
    run(config, logger, seed=args.seed)


if __name__ == "__main__":
    main()
