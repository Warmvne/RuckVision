from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from pydantic import BaseModel
from typing import Optional

from db.database import get_db
from db.models import Segment, SegmentStatus, PhaseType

router = APIRouter(prefix="/segments", tags=["segments"])


class SegmentUpdate(BaseModel):
    start_time: Optional[float] = None
    end_time: Optional[float] = None
    phase_type: Optional[str] = None
    status: Optional[str] = None
    team_possession: Optional[str] = None
    field_zone: Optional[str] = None
    notes: Optional[str] = None
    label: Optional[str] = None


class SegmentCreate(BaseModel):
    match_id: int
    start_time: float
    end_time: float
    phase_type: Optional[str] = "unknown"
    team_possession: Optional[str] = None
    field_zone: Optional[str] = None
    notes: Optional[str] = None
    label: Optional[str] = None


@router.get("/match/{match_id}")
def get_segments(match_id: int, db: Session = Depends(get_db)):
    segments = (
        db.query(Segment)
        .filter(Segment.match_id == match_id)
        .order_by(Segment.start_time)
        .all()
    )
    return [_serialize(s) for s in segments]


@router.post("/")
def create_segment(data: SegmentCreate, db: Session = Depends(get_db)):
    seg = Segment(
        match_id=data.match_id,
        start_time=data.start_time,
        end_time=data.end_time,
        phase_type=PhaseType(data.phase_type) if data.phase_type else PhaseType.unknown,
        status=SegmentStatus.validated,
        team_possession=data.team_possession,
        field_zone=data.field_zone,
        notes=data.notes,
        label=data.label,
    )
    db.add(seg)
    db.commit()
    db.refresh(seg)
    return _serialize(seg)


@router.patch("/{segment_id}")
def update_segment(segment_id: int, data: SegmentUpdate, db: Session = Depends(get_db)):
    seg = db.query(Segment).get(segment_id)
    if not seg:
        raise HTTPException(404, "Segment not found")

    if data.start_time is not None:
        seg.start_time = data.start_time
    if data.end_time is not None:
        seg.end_time = data.end_time
    if data.phase_type is not None:
        seg.phase_type = PhaseType(data.phase_type)
    if data.status is not None:
        seg.status = SegmentStatus(data.status)
    if data.team_possession is not None:
        seg.team_possession = data.team_possession
    if data.field_zone is not None:
        seg.field_zone = data.field_zone
    if data.notes is not None:
        seg.notes = data.notes
    if data.label is not None:
        seg.label = data.label

    # Auto-mark as edited if previously ai_proposed
    if seg.status == SegmentStatus.ai_proposed:
        seg.status = SegmentStatus.edited

    db.commit()
    db.refresh(seg)
    return _serialize(seg)


@router.patch("/{segment_id}/validate")
def validate_segment(segment_id: int, db: Session = Depends(get_db)):
    seg = db.query(Segment).get(segment_id)
    if not seg:
        raise HTTPException(404, "Segment not found")
    seg.status = SegmentStatus.validated
    db.commit()
    return _serialize(seg)


@router.patch("/{segment_id}/reject")
def reject_segment(segment_id: int, db: Session = Depends(get_db)):
    seg = db.query(Segment).get(segment_id)
    if not seg:
        raise HTTPException(404, "Segment not found")
    seg.status = SegmentStatus.rejected
    db.commit()
    return _serialize(seg)


@router.post("/{segment_id}/split")
def split_segment(segment_id: int, split_time: float, db: Session = Depends(get_db)):
    seg = db.query(Segment).get(segment_id)
    if not seg:
        raise HTTPException(404, "Segment not found")
    if not (seg.start_time < split_time < seg.end_time):
        raise HTTPException(400, "split_time must be within segment bounds")

    original_end = seg.end_time
    seg.end_time = split_time
    seg.status = SegmentStatus.edited

    new_seg = Segment(
        match_id=seg.match_id,
        start_time=split_time,
        end_time=original_end,
        phase_type=seg.phase_type,
        status=SegmentStatus.edited,
        team_possession=seg.team_possession,
        field_zone=seg.field_zone,
    )
    db.add(new_seg)
    db.commit()
    db.refresh(seg)
    db.refresh(new_seg)
    return {"original": _serialize(seg), "new": _serialize(new_seg)}


@router.delete("/{segment_id}")
def delete_segment(segment_id: int, db: Session = Depends(get_db)):
    seg = db.query(Segment).get(segment_id)
    if not seg:
        raise HTTPException(404, "Segment not found")
    db.delete(seg)
    db.commit()
    return {"deleted": True}


def _serialize(s: Segment) -> dict:
    return {
        "id": s.id,
        "match_id": s.match_id,
        "start_time": s.start_time,
        "end_time": s.end_time,
        "duration": round(s.end_time - s.start_time, 2),
        "phase_type": s.phase_type.value if s.phase_type else None,
        "status": s.status.value if s.status else None,
        "team_possession": s.team_possession,
        "field_zone": s.field_zone,
        "notes": s.notes,
        "label": s.label,
        "ai_confidence": s.ai_confidence,
    }
