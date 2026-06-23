"""
SAM 3.1 (Segment Anything Model 3.1, Meta, March 2026) video tracking.
Replaces SAM 2.1 — uses a session/request-handler pattern with native text prompts.

Install:
  conda create -n sam3 python=3.12 && conda activate sam3
  pip install torch==2.10.0 torchvision --index-url https://download.pytorch.org/whl/cu128
  git clone https://github.com/facebookresearch/sam3.git
  cd sam3 && pip install -e .

Checkpoints (gated on HuggingFace — request access first):
  https://huggingface.co/facebook/sam3.1
  Then: huggingface-cli download facebook/sam3.1 --local-dir ./models/sam3.1

Requirements: Python 3.12+, PyTorch 2.7+, CUDA 12.6+
"""

import os

_predictor = None


def _get_predictor():
    global _predictor
    if _predictor is not None:
        return _predictor
    try:
        from sam3.model_builder import build_sam3_video_predictor
        _predictor = build_sam3_video_predictor()
    except ImportError:
        raise RuntimeError(
            "SAM 3.1 not installed. See backend/ai/sam3_tracker.py for install instructions."
        )
    return _predictor


def track_with_text_prompt(video_path: str, text_prompt: str, frame_index: int = 0) -> dict:
    """
    Track objects matching a text description across all frames.

    Args:
        video_path:   Path to video file
        text_prompt:  Natural language description, e.g. "rugby player in red jersey"
        frame_index:  Frame to anchor the initial prompt on

    Returns:
        dict with session_id and per-frame mask outputs
    """
    predictor = _get_predictor()

    resp = predictor.handle_request(
        request=dict(type="start_session", resource_path=video_path)
    )
    session_id = resp["session_id"]

    resp = predictor.handle_request(
        request=dict(
            type="add_prompt",
            session_id=session_id,
            frame_index=frame_index,
            text=text_prompt,
        )
    )

    resp = predictor.handle_request(
        request=dict(type="propagate", session_id=session_id)
    )

    return {"session_id": session_id, "outputs": resp.get("outputs", {})}


def track_with_point_prompt(
    video_path: str,
    points: list[list[float]],
    labels: list[int],
    frame_index: int = 0,
) -> dict:
    """
    Track objects via point prompts (SAM 2-compatible interface on SAM 3.1).

    Args:
        video_path:   Path to video file
        points:       [[x, y], ...] click coordinates on frame_index
        labels:       [1=foreground, 0=background] per point
        frame_index:  Frame to anchor the prompts on

    Returns:
        dict with session_id and per-frame mask outputs
    """
    predictor = _get_predictor()

    resp = predictor.handle_request(
        request=dict(type="start_session", resource_path=video_path)
    )
    session_id = resp["session_id"]

    resp = predictor.handle_request(
        request=dict(
            type="add_prompt",
            session_id=session_id,
            frame_index=frame_index,
            points=points,
            labels=labels,
        )
    )

    resp = predictor.handle_request(
        request=dict(type="propagate", session_id=session_id)
    )

    return {"session_id": session_id, "outputs": resp.get("outputs", {})}
