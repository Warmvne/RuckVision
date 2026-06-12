"""
YOLO-based player/ball detection used to feed scene-change heuristics
for automatic segment boundary detection.
"""
import os
import cv2
import numpy as np
from pathlib import Path

_model = None


def _get_model():
    global _model
    if _model is None:
        from ultralytics import YOLO
        model_name = os.getenv("YOLO_MODEL", "yolov8m.pt")
        _model = YOLO(model_name)
    return _model


def detect_frame(frame: np.ndarray) -> list[dict]:
    model = _get_model()
    results = model(frame, verbose=False)[0]
    detections = []
    for box in results.boxes:
        cls_id = int(box.cls[0])
        label = model.names[cls_id]
        if label not in ("person", "sports ball"):
            continue
        x1, y1, x2, y2 = box.xyxy[0].tolist()
        detections.append({
            "label": label,
            "confidence": float(box.conf[0]),
            "bbox": [x1, y1, x2, y2],
        })
    return detections


def sample_video_detections(video_path: str, sample_fps: float = 2.0) -> list[dict]:
    """Sample the video at sample_fps and return per-frame detections."""
    cap = cv2.VideoCapture(video_path)
    native_fps = cap.get(cv2.CAP_PROP_FPS) or 25
    step = max(1, int(native_fps / sample_fps))
    results = []
    frame_idx = 0

    while True:
        ret, frame = cap.read()
        if not ret:
            break
        if frame_idx % step == 0:
            timestamp = frame_idx / native_fps
            detections = detect_frame(frame)
            results.append({"timestamp": timestamp, "detections": detections})
        frame_idx += 1

    cap.release()
    return results
