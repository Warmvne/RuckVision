from collections import defaultdict
from db.models import Segment, Match, PhaseType, SegmentStatus


def compute_match_stats(match: Match, segments: list[Segment]) -> dict:
    validated = [s for s in segments if s.status != SegmentStatus.rejected]

    total_duration = match.duration_seconds or 0
    phase_durations = defaultdict(float)
    possession = defaultdict(float)
    zone_time = defaultdict(float)

    for seg in validated:
        duration = seg.end_time - seg.start_time
        phase_durations[seg.phase_type.value if seg.phase_type else "unknown"] += duration
        if seg.team_possession:
            possession[seg.team_possession] += duration
        if seg.field_zone:
            zone_time[seg.field_zone] += duration

    total_possession = sum(possession.values()) or 1
    possession_pct = {k: round(v / total_possession * 100, 1) for k, v in possession.items()}

    phase_counts = defaultdict(int)
    for seg in validated:
        key = seg.phase_type.value if seg.phase_type else "unknown"
        phase_counts[key] += 1

    return {
        "match_id": match.id,
        "total_duration": total_duration,
        "total_segments": len(validated),
        "phase_counts": dict(phase_counts),
        "phase_durations_seconds": {k: round(v, 1) for k, v in phase_durations.items()},
        "possession_percent": possession_pct,
        "zone_time_seconds": {k: round(v, 1) for k, v in zone_time.items()},
    }


def compute_team_stats(team_name: str, matches: list[Match], all_segments: list[list[Segment]]) -> dict:
    totals = defaultdict(float)
    phase_totals = defaultdict(int)
    match_count = len(matches)

    for match, segments in zip(matches, all_segments):
        for seg in segments:
            if seg.status == SegmentStatus.rejected:
                continue
            if seg.team_possession == team_name:
                duration = seg.end_time - seg.start_time
                totals["possession_seconds"] += duration
                key = seg.phase_type.value if seg.phase_type else "unknown"
                phase_totals[key] += 1

    return {
        "team": team_name,
        "match_count": match_count,
        "avg_possession_seconds": round(totals["possession_seconds"] / max(match_count, 1), 1),
        "phase_totals": dict(phase_totals),
    }
