"""
Automatic segment boundary detection using scene-change heuristics
from YOLO detections, then optionally refined with SAM 2 tracking.
"""
import numpy as np
from .detector import sample_video_detections
from db.models import PhaseType


PHASE_KEYWORDS = {
    PhaseType.ruck: ["ruck", "breakdown"],
    PhaseType.scrum: ["scrum", "mêlée"],
    PhaseType.lineout: ["lineout", "touche"],
    PhaseType.try_: ["try", "essai"],
    PhaseType.penalty: ["penalty", "pénalité"],
    PhaseType.kickoff: ["kickoff", "coup d'envoi"],
}

MIN_SEGMENT_DURATION = 3.0   # seconds
SCENE_CHANGE_THRESHOLD = 0.4  # fraction change in player count


def _detect_boundaries(frame_detections: list[dict]) -> list[float]:
    """Return timestamps where a significant scene change is detected."""
    if not frame_detections:
        return []

    boundaries = [frame_detections[0]["timestamp"]]
    prev_count = len([d for d in frame_detections[0]["detections"] if d["label"] == "person"])

    for i in range(1, len(frame_detections)):
        cur = frame_detections[i]
        cur_count = len([d for d in cur["detections"] if d["label"] == "person"])
        delta = abs(cur_count - prev_count) / max(prev_count, 1)

        if delta >= SCENE_CHANGE_THRESHOLD:
            last_boundary = boundaries[-1]
            if cur["timestamp"] - last_boundary >= MIN_SEGMENT_DURATION:
                boundaries.append(cur["timestamp"])

        prev_count = cur_count

    return boundaries


def _classify_segment(start: float, end: float, frame_detections: list[dict]) -> dict:
    """Heuristic phase classification based on player clustering."""
    window = [
        f for f in frame_detections if start <= f["timestamp"] <= end
    ]
    if not window:
        return {"phase_type": PhaseType.unknown, "confidence": 0.0}

    player_counts = [
        len([d for d in f["detections"] if d["label"] == "person"]) for f in window
    ]
    avg_players = np.mean(player_counts)
    ball_visible = any(
        any(d["label"] == "sports ball" for d in f["detections"]) for f in window
    )

    # Heuristic rules — will be improved with fine-tuned classifier
    if avg_players >= 12:
        phase = PhaseType.scrum
        conf = 0.6
    elif avg_players >= 8 and not ball_visible:
        phase = PhaseType.lineout
        conf = 0.55
    elif avg_players >= 6:
        phase = PhaseType.ruck
        conf = 0.65
    else:
        phase = PhaseType.open_play
        conf = 0.5

    return {"phase_type": phase, "confidence": conf}


def analyze_video(video_path: str, sample_fps: float = 2.0) -> list[dict]:
    """
    Full pipeline: sample → detect → boundary detection → classify.
    Returns list of segment dicts ready to insert in DB.
    """
    frame_detections = sample_video_detections(video_path, sample_fps)
    if not frame_detections:
        return []

    boundaries = _detect_boundaries(frame_detections)
    total_duration = frame_detections[-1]["timestamp"]

    # Build segment time ranges from boundaries
    segments = []
    for i, start in enumerate(boundaries):
        end = boundaries[i + 1] if i + 1 < len(boundaries) else total_duration
        if end - start < MIN_SEGMENT_DURATION:
            continue
        classification = _classify_segment(start, end, frame_detections)
        segments.append({
            "start_time": round(start, 2),
            "end_time": round(end, 2),
            "phase_type": classification["phase_type"],
            "ai_confidence": round(classification["confidence"], 3),
            "status": "ai_proposed",
        })

    return segments
