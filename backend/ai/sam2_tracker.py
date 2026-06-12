"""
SAM 2.1 (Segment Anything Model 2.1) video object tracking.
Used for precise player segmentation and tracking within a segment.

Install: git clone https://github.com/facebookresearch/sam2.git && cd sam2 && pip install -e .
Download checkpoint: sam2.1_hiera_large.pt from Meta's releases (scripts/download_ckpts.sh).
"""
import os
import numpy as np
from pathlib import Path

SAM2_CHECKPOINT = os.getenv("SAM2_CHECKPOINT", "./models/sam2_hiera_large.pt")
SAM2_CONFIG = os.getenv("SAM2_CONFIG", "sam2_hiera_l.yaml")

_predictor = None


def _get_predictor():
    global _predictor
    if _predictor is not None:
        return _predictor
    try:
        from sam2.build_sam import build_sam2_video_predictor
        _predictor = build_sam2_video_predictor(SAM2_CONFIG, SAM2_CHECKPOINT)
    except ImportError:
        raise RuntimeError(
            "SAM 2 not installed. Run: pip install git+https://github.com/facebookresearch/sam2.git"
        )
    return _predictor


def track_players_in_segment(
    frames_dir: str,
    initial_points: list[list[float]],
    initial_labels: list[int],
) -> dict[int, list[dict]]:
    """
    Track objects across frames given initial point prompts on frame 0.

    Args:
        frames_dir: directory of extracted JPEG frames (000000.jpg, ...)
        initial_points: [[x, y], ...] prompt points on frame 0
        initial_labels: [1=foreground, 0=background] per point

    Returns:
        dict mapping frame_index → list of mask info dicts
    """
    predictor = _get_predictor()

    with predictor.init_state(video_path=frames_dir) as inference_state:
        points = np.array(initial_points, dtype=np.float32)
        labels = np.array(initial_labels, dtype=np.int32)

        predictor.add_new_points_or_box(
            inference_state=inference_state,
            frame_idx=0,
            obj_id=1,
            points=points,
            labels=labels,
        )

        results = {}
        for frame_idx, obj_ids, mask_logits in predictor.propagate_in_video(inference_state):
            masks = []
            for obj_id, logit in zip(obj_ids, mask_logits):
                mask = (logit[0] > 0).cpu().numpy()
                masks.append({"obj_id": int(obj_id), "mask": mask.tolist()})
            results[frame_idx] = masks

    return results
