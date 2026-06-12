import os
import shutil
from pathlib import Path
from fastapi import APIRouter, Depends, UploadFile, File, HTTPException, BackgroundTasks
from sqlalchemy.orm import Session
from pydantic import BaseModel
from typing import Optional
from datetime import datetime

from db.database import get_db
from db.models import Match, Team, Segment, SegmentStatus
from video.processor import get_video_info, generate_hls, extract_thumbnail
from ai.segmenter import analyze_video

router = APIRouter(prefix="/matches", tags=["matches"])

VIDEOS_DIR = Path(os.getenv("VIDEOS_DIR", "./data/videos"))


class MatchCreate(BaseModel):
    title: str
    home_team: str
    away_team: str
    match_date: Optional[str] = None
    venue: Optional[str] = None
    competition: Optional[str] = None


class MatchUpdate(BaseModel):
    title: Optional[str] = None
    venue: Optional[str] = None
    competition: Optional[str] = None


def _get_or_create_team(db: Session, name: str) -> Team:
    team = db.query(Team).filter(Team.name == name).first()
    if not team:
        team = Team(name=name, short_name=name[:5].upper())
        db.add(team)
        db.flush()
    return team


async def _process_match(match_id: int, video_path: str, db_url: str):
    from db.database import SessionLocal
    db = SessionLocal()
    try:
        match = db.query(Match).get(match_id)
        match.status = "processing"
        db.commit()

        info = await get_video_info(video_path)
        match.duration_seconds = info["duration"]

        hls_path = await generate_hls(video_path, match_id)
        match.hls_path = hls_path

        thumb = await extract_thumbnail(video_path, match_id)
        match.thumbnail_path = thumb

        match.status = "ready"
        db.commit()
    except Exception as e:
        match.status = "error"
        db.commit()
        raise
    finally:
        db.close()


@router.get("/")
def list_matches(db: Session = Depends(get_db)):
    matches = db.query(Match).order_by(Match.created_at.desc()).all()
    return [
        {
            "id": m.id,
            "title": m.title,
            "home_team": m.home_team.name if m.home_team else None,
            "away_team": m.away_team.name if m.away_team else None,
            "match_date": m.match_date,
            "status": m.status,
            "ai_analyzed": m.ai_analyzed,
            "thumbnail_path": m.thumbnail_path,
            "duration_seconds": m.duration_seconds,
        }
        for m in matches
    ]


@router.post("/")
async def create_match(
    background_tasks: BackgroundTasks,
    file: UploadFile = File(...),
    title: str = "",
    home_team: str = "Home",
    away_team: str = "Away",
    match_date: Optional[str] = None,
    venue: Optional[str] = None,
    competition: Optional[str] = None,
    db: Session = Depends(get_db),
):
    VIDEOS_DIR.mkdir(parents=True, exist_ok=True)

    safe_name = Path(file.filename).name
    video_path = VIDEOS_DIR / safe_name

    with open(video_path, "wb") as f:
        shutil.copyfileobj(file.file, f)

    home = _get_or_create_team(db, home_team)
    away = _get_or_create_team(db, away_team)

    parsed_date = None
    if match_date:
        try:
            parsed_date = datetime.fromisoformat(match_date)
        except ValueError:
            pass

    match = Match(
        title=title or safe_name,
        home_team_id=home.id,
        away_team_id=away.id,
        match_date=parsed_date,
        venue=venue,
        competition=competition,
        video_path=str(video_path),
        status="pending",
    )
    db.add(match)
    db.commit()
    db.refresh(match)

    from db.database import DATABASE_URL
    background_tasks.add_task(_process_match, match.id, str(video_path), DATABASE_URL)

    return {"id": match.id, "status": "pending"}


@router.get("/{match_id}")
def get_match(match_id: int, db: Session = Depends(get_db)):
    match = db.query(Match).get(match_id)
    if not match:
        raise HTTPException(404, "Match not found")
    return {
        "id": match.id,
        "title": match.title,
        "home_team": match.home_team.name if match.home_team else None,
        "away_team": match.away_team.name if match.away_team else None,
        "match_date": match.match_date,
        "venue": match.venue,
        "competition": match.competition,
        "status": match.status,
        "ai_analyzed": match.ai_analyzed,
        "duration_seconds": match.duration_seconds,
        "hls_path": match.hls_path,
        "thumbnail_path": match.thumbnail_path,
    }


@router.post("/{match_id}/analyze")
async def run_ai_analysis(match_id: int, background_tasks: BackgroundTasks, db: Session = Depends(get_db)):
    match = db.query(Match).get(match_id)
    if not match:
        raise HTTPException(404, "Match not found")
    if match.status != "ready":
        raise HTTPException(400, f"Match is not ready (status: {match.status})")

    async def _analyze(mid: int, path: str):
        from db.database import SessionLocal
        inner_db = SessionLocal()
        try:
            m = inner_db.query(Match).get(mid)
            segments_data = analyze_video(path)
            for sd in segments_data:
                seg = Segment(match_id=mid, **sd)
                inner_db.add(seg)
            m.ai_analyzed = True
            inner_db.commit()
        finally:
            inner_db.close()

    background_tasks.add_task(_analyze, match_id, match.video_path)
    return {"status": "analysis_started"}


@router.delete("/{match_id}")
def delete_match(match_id: int, db: Session = Depends(get_db)):
    match = db.query(Match).get(match_id)
    if not match:
        raise HTTPException(404, "Match not found")
    db.delete(match)
    db.commit()
    return {"deleted": True}
