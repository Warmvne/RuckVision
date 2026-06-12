from datetime import datetime
from sqlalchemy import Column, Integer, String, Float, DateTime, ForeignKey, Enum, Text, Boolean
from sqlalchemy.orm import relationship, DeclarativeBase
import enum


class Base(DeclarativeBase):
    pass


class PhaseType(str, enum.Enum):
    ruck = "ruck"
    scrum = "scrum"
    lineout = "lineout"
    open_play = "open_play"
    try_ = "try"
    conversion = "conversion"
    penalty = "penalty"
    kickoff = "kickoff"
    unknown = "unknown"


class SegmentStatus(str, enum.Enum):
    ai_proposed = "ai_proposed"
    validated = "validated"
    rejected = "rejected"
    edited = "edited"


class Team(Base):
    __tablename__ = "teams"

    id = Column(Integer, primary_key=True)
    name = Column(String, nullable=False, unique=True)
    short_name = Column(String(5))
    color = Column(String(7), default="#3B82F6")
    created_at = Column(DateTime, default=datetime.utcnow)

    matches_home = relationship("Match", foreign_keys="Match.home_team_id", back_populates="home_team")
    matches_away = relationship("Match", foreign_keys="Match.away_team_id", back_populates="away_team")


class Match(Base):
    __tablename__ = "matches"

    id = Column(Integer, primary_key=True)
    title = Column(String, nullable=False)
    home_team_id = Column(Integer, ForeignKey("teams.id"))
    away_team_id = Column(Integer, ForeignKey("teams.id"))
    match_date = Column(DateTime)
    venue = Column(String)
    competition = Column(String)
    video_path = Column(String)
    hls_path = Column(String)
    thumbnail_path = Column(String)
    duration_seconds = Column(Float)
    status = Column(String, default="pending")  # pending | processing | ready | error
    ai_analyzed = Column(Boolean, default=False)
    created_at = Column(DateTime, default=datetime.utcnow)

    home_team = relationship("Team", foreign_keys=[home_team_id], back_populates="matches_home")
    away_team = relationship("Team", foreign_keys=[away_team_id], back_populates="matches_away")
    segments = relationship("Segment", back_populates="match", cascade="all, delete-orphan")
    score_events = relationship("ScoreEvent", back_populates="match", cascade="all, delete-orphan")


class Segment(Base):
    __tablename__ = "segments"

    id = Column(Integer, primary_key=True)
    match_id = Column(Integer, ForeignKey("matches.id"), nullable=False)
    start_time = Column(Float, nullable=False)  # seconds
    end_time = Column(Float, nullable=False)    # seconds
    phase_type = Column(Enum(PhaseType), default=PhaseType.unknown)
    status = Column(Enum(SegmentStatus), default=SegmentStatus.ai_proposed)
    team_possession = Column(String)  # home | away | null
    field_zone = Column(String)       # own_22 | own_half | opp_half | opp_22
    notes = Column(Text)
    ai_confidence = Column(Float)
    label = Column(String)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    match = relationship("Match", back_populates="segments")


class ScoreEvent(Base):
    __tablename__ = "score_events"

    id = Column(Integer, primary_key=True)
    match_id = Column(Integer, ForeignKey("matches.id"), nullable=False)
    time_seconds = Column(Float)
    team = Column(String)  # home | away
    event_type = Column(String)  # try | conversion | penalty | drop_goal
    points = Column(Integer)
    scorer = Column(String)

    match = relationship("Match", back_populates="score_events")
