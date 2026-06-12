from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from db.database import get_db
from db.models import Match, Segment, Team
from stats.calculator import compute_match_stats, compute_team_stats

router = APIRouter(prefix="/stats", tags=["stats"])


@router.get("/match/{match_id}")
def match_stats(match_id: int, db: Session = Depends(get_db)):
    match = db.query(Match).get(match_id)
    if not match:
        raise HTTPException(404, "Match not found")
    segments = db.query(Segment).filter(Segment.match_id == match_id).all()
    return compute_match_stats(match, segments)


@router.get("/team/{team_id}")
def team_stats(team_id: int, db: Session = Depends(get_db)):
    team = db.query(Team).get(team_id)
    if not team:
        raise HTTPException(404, "Team not found")

    matches = (
        db.query(Match)
        .filter((Match.home_team_id == team_id) | (Match.away_team_id == team_id))
        .all()
    )
    all_segments = [
        db.query(Segment).filter(Segment.match_id == m.id).all() for m in matches
    ]
    return compute_team_stats(team.name, matches, all_segments)


@router.get("/teams")
def all_teams(db: Session = Depends(get_db)):
    teams = db.query(Team).all()
    return [{"id": t.id, "name": t.name, "short_name": t.short_name, "color": t.color} for t in teams]
