import { useState, useEffect, useRef, useCallback } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { api } from '../api'
import VideoPlayer from '../components/VideoPlayer'
import SegmentTimeline from '../components/SegmentTimeline'
import {
  CheckCircle, XCircle, Scissors, ChevronLeft, ChevronRight,
  Plus, ArrowLeft, Save, Zap, Edit3
} from 'lucide-react'

const PHASES = ['ruck', 'scrum', 'lineout', 'open_play', 'try', 'conversion', 'penalty', 'kickoff', 'unknown']
const PHASE_LABELS = {
  ruck: 'Ruck', scrum: 'Mêlée', lineout: 'Touche', open_play: 'Jeu ouvert',
  try: 'Essai', conversion: 'Transformation', penalty: 'Pénalité',
  kickoff: "Coup d'envoi", unknown: 'Inconnu',
}
const ZONES = ['own_22', 'own_half', 'opp_half', 'opp_22']
const ZONE_LABELS = {
  own_22: '22m défensif', own_half: 'Mi-terrain déf.',
  opp_half: 'Mi-terrain att.', opp_22: '22m offensif',
}

const STATUS_STYLE = {
  ai_proposed: { bg: 'rgba(124,58,237,0.15)', color: '#a78bfa', label: 'IA' },
  validated:   { bg: 'rgba(0,230,118,0.12)', color: '#00e676', label: '✓' },
  rejected:    { bg: 'rgba(255,82,82,0.1)',  color: '#ff5252', label: '✗' },
  edited:      { bg: 'rgba(0,176,255,0.12)', color: '#00b0ff', label: '✎' },
}

const PHASE_DOT = {
  ruck: '#f97316', scrum: '#3b82f6', lineout: '#a855f7', open_play: '#00e676',
  try: '#ffd600', conversion: '#fde047', penalty: '#ef4444', kickoff: '#06b6d4', unknown: '#334155',
}

function formatTime(s) {
  const m = Math.floor(s / 60)
  const sec = Math.floor(s % 60)
  return `${m}:${sec.toString().padStart(2, '0')}`
}

function ActionBtn({ onClick, icon: Icon, label, color, bg, hoverBg }) {
  const [hov, setHov] = useState(false)
  return (
    <button
      onClick={onClick}
      onMouseEnter={() => setHov(true)}
      onMouseLeave={() => setHov(false)}
      className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold transition-all duration-150"
      style={{ background: hov ? hoverBg : bg, color, border: `1px solid ${color}30` }}>
      <Icon size={13} /> {label}
    </button>
  )
}

export default function ReviewPage() {
  const { id } = useParams()
  const navigate = useNavigate()
  const playerRef = useRef(null)

  const [match, setMatch] = useState(null)
  const [segments, setSegments] = useState([])
  const [selected, setSelected] = useState(null)
  const [currentTime, setCurrentTime] = useState(0)
  const [editing, setEditing] = useState(null)

  const load = useCallback(async () => {
    const [m, segs] = await Promise.all([api.getMatch(id), api.getSegments(id)])
    setMatch(m)
    setSegments(segs)
  }, [id])

  useEffect(() => { load() }, [load])

  const select = (seg) => {
    setSelected(seg)
    setEditing({ ...seg })
    playerRef.current?.currentTime(seg.start_time)
  }

  const navigateSeg = (dir) => {
    const active = segments.filter(s => s.status !== 'rejected')
    const idx = active.findIndex(s => s.id === selected?.id)
    const next = active[idx + dir]
    if (next) select(next)
  }

  const handleValidate = async () => {
    await api.validateSegment(selected.id)
    await load()
    navigateSeg(1)
  }

  const handleReject = async () => {
    await api.rejectSegment(selected.id)
    await load()
    navigateSeg(1)
  }

  const handleSave = async () => {
    await api.updateSegment(selected.id, {
      start_time: editing.start_time,
      end_time: editing.end_time,
      phase_type: editing.phase_type,
      team_possession: editing.team_possession,
      field_zone: editing.field_zone,
      notes: editing.notes,
      label: editing.label,
    })
    await load()
  }

  const handleSplit = async () => {
    if (!selected) return
    const t = playerRef.current?.currentTime() ?? currentTime
    if (t <= selected.start_time || t >= selected.end_time) {
      alert('Placez la tête de lecture à l\'intérieur du segment.')
      return
    }
    await api.splitSegment(selected.id, t)
    await load()
  }

  const hlsSrc = `/hls/${id}/index.m3u8`

  const stats = {
    total: segments.length,
    validated: segments.filter(s => s.status === 'validated').length,
    pending: segments.filter(s => s.status === 'ai_proposed').length,
    pct: segments.length ? Math.round(segments.filter(s => s.status === 'validated').length / segments.length * 100) : 0,
  }

  return (
    <div className="flex flex-col h-screen" style={{ background: 'var(--navy)' }}>

      {/* Top bar */}
      <header className="flex items-center gap-4 px-6 py-3 shrink-0"
        style={{ background: 'var(--navy-2)', borderBottom: '1px solid var(--glass-border)' }}>
        <button onClick={() => navigate('/')}
          className="w-8 h-8 flex items-center justify-center rounded-lg transition-colors"
          style={{ color: 'var(--text-muted)' }}
          onMouseEnter={e => e.currentTarget.style.color = 'var(--text-primary)'}
          onMouseLeave={e => e.currentTarget.style.color = 'var(--text-muted)'}>
          <ArrowLeft size={17} />
        </button>

        <div className="h-4 w-px" style={{ background: 'var(--glass-border)' }} />

        <div className="flex items-center gap-2">
          <div className="w-2 h-2 rounded-full pulse-dot" style={{ background: 'var(--green)' }} />
          <h2 className="font-semibold text-sm" style={{ color: 'var(--text-primary)' }}>{match?.title}</h2>
        </div>

        {match?.home_team && (
          <span className="text-sm" style={{ color: 'var(--text-secondary)' }}>
            {match.home_team} <span style={{ color: 'var(--text-muted)' }}>vs</span> {match.away_team}
          </span>
        )}

        <div className="ml-auto flex items-center gap-4">
          {/* Progress bar */}
          <div className="flex items-center gap-3">
            <span className="text-xs" style={{ color: 'var(--text-muted)' }}>
              {stats.validated}/{stats.total} validés
            </span>
            <div className="w-24 h-1.5 rounded-full overflow-hidden" style={{ background: 'var(--navy-3)' }}>
              <div className="h-full rounded-full transition-all duration-500"
                style={{ width: `${stats.pct}%`, background: 'linear-gradient(90deg, var(--green), #00b0ff)' }} />
            </div>
            <span className="text-xs font-mono" style={{ color: 'var(--green)' }}>{stats.pct}%</span>
          </div>

          <button onClick={() => navigate(`/match/${id}/dashboard`)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all"
            style={{ background: 'rgba(0,176,255,0.1)', color: '#00b0ff', border: '1px solid rgba(0,176,255,0.2)' }}
            onMouseEnter={e => e.currentTarget.style.background = 'rgba(0,176,255,0.2)'}
            onMouseLeave={e => e.currentTarget.style.background = 'rgba(0,176,255,0.1)'}>
            <Zap size={12} /> Stats
          </button>
        </div>
      </header>

      {/* Body */}
      <div className="flex flex-1 overflow-hidden">

        {/* Main: video + timeline + controls */}
        <div className="flex flex-col flex-1 p-4 gap-3 overflow-hidden">

          {/* Video */}
          <div className="flex-1 rounded-2xl overflow-hidden" style={{ background: '#000', minHeight: 0 }}>
            <VideoPlayer src={hlsSrc} onTimeUpdate={setCurrentTime} playerRef={playerRef} />
          </div>

          {/* Timeline */}
          <div className="shrink-0 px-1">
            <SegmentTimeline
              segments={segments}
              duration={match?.duration_seconds}
              currentTime={currentTime}
              onSeek={t => playerRef.current?.currentTime(t)}
              selectedId={selected?.id}
              onSelect={select}
            />
          </div>

          {/* Controls */}
          <div className="flex items-center gap-2 shrink-0">
            <button onClick={() => navigateSeg(-1)}
              className="w-8 h-8 flex items-center justify-center rounded-lg transition-colors"
              style={{ background: 'var(--navy-3)', color: 'var(--text-secondary)', border: '1px solid var(--glass-border)' }}
              onMouseEnter={e => e.currentTarget.style.borderColor = 'var(--green)'}
              onMouseLeave={e => e.currentTarget.style.borderColor = 'var(--glass-border)'}>
              <ChevronLeft size={16} />
            </button>
            <button onClick={() => navigateSeg(1)}
              className="w-8 h-8 flex items-center justify-center rounded-lg transition-colors"
              style={{ background: 'var(--navy-3)', color: 'var(--text-secondary)', border: '1px solid var(--glass-border)' }}
              onMouseEnter={e => e.currentTarget.style.borderColor = 'var(--green)'}
              onMouseLeave={e => e.currentTarget.style.borderColor = 'var(--glass-border)'}>
              <ChevronRight size={16} />
            </button>

            <div className="w-px h-5 mx-1" style={{ background: 'var(--glass-border)' }} />

            <ActionBtn onClick={handleSplit} icon={Scissors} label="Couper"
              color="#ffd600" bg="rgba(255,214,0,0.08)" hoverBg="rgba(255,214,0,0.16)" />
            <ActionBtn onClick={async () => {
              const t = playerRef.current?.currentTime() ?? currentTime
              await api.createSegment({ match_id: parseInt(id), start_time: t, end_time: Math.min(t + 10, match?.duration_seconds ?? t + 10) })
              await load()
            }} icon={Plus} label="Segment"
              color="var(--green)" bg="rgba(0,230,118,0.08)" hoverBg="rgba(0,230,118,0.16)" />

            {selected && (
              <div className="ml-auto flex gap-2">
                <ActionBtn onClick={handleValidate} icon={CheckCircle} label="Valider"
                  color="#00e676" bg="rgba(0,230,118,0.1)" hoverBg="rgba(0,230,118,0.2)" />
                <ActionBtn onClick={handleReject} icon={XCircle} label="Rejeter"
                  color="#ff5252" bg="rgba(255,82,82,0.1)" hoverBg="rgba(255,82,82,0.2)" />
              </div>
            )}
          </div>
        </div>

        {/* Sidebar */}
        <div className="w-80 flex flex-col overflow-hidden"
          style={{ borderLeft: '1px solid var(--glass-border)', background: 'var(--navy-2)' }}>

          {/* Edit panel */}
          {editing && selected && (
            <div className="p-4 shrink-0" style={{ borderBottom: '1px solid var(--glass-border)' }}>
              <div className="flex items-center gap-2 mb-3">
                <Edit3 size={13} style={{ color: 'var(--green)' }} />
                <span className="text-xs font-semibold" style={{ color: 'var(--green)' }}>ÉDITION</span>
                <span className="ml-auto font-mono text-xs" style={{ color: 'var(--text-muted)' }}>
                  {formatTime(selected.start_time)} → {formatTime(selected.end_time)}
                </span>
              </div>

              <div className="space-y-2.5">
                {/* Phase */}
                <select
                  value={editing.phase_type || 'unknown'}
                  onChange={e => setEditing(d => ({ ...d, phase_type: e.target.value }))}
                  className="w-full text-sm rounded-xl px-3 py-2.5 font-medium"
                  style={{ background: 'var(--navy-3)', color: 'var(--text-primary)', border: '1px solid var(--glass-border)', outline: 'none' }}>
                  {PHASES.map(p => <option key={p} value={p}>{PHASE_LABELS[p]}</option>)}
                </select>

                {/* Possession */}
                <div className="grid grid-cols-3 gap-1.5">
                  {['home', 'away', ''].map(t => (
                    <button key={t}
                      onClick={() => setEditing(d => ({ ...d, team_possession: t || null }))}
                      className="py-2 rounded-xl text-xs font-medium transition-all duration-150"
                      style={editing.team_possession === (t || null)
                        ? { background: 'rgba(0,230,118,0.15)', color: 'var(--green)', border: '1px solid rgba(0,230,118,0.4)' }
                        : { background: 'var(--navy-3)', color: 'var(--text-muted)', border: '1px solid var(--glass-border)' }}>
                      {t === 'home' ? match?.home_team?.slice(0, 8) ?? 'Domicile'
                        : t === 'away' ? match?.away_team?.slice(0, 8) ?? 'Extérieur'
                        : 'Aucun'}
                    </button>
                  ))}
                </div>

                {/* Zone */}
                <select
                  value={editing.field_zone || ''}
                  onChange={e => setEditing(d => ({ ...d, field_zone: e.target.value || null }))}
                  className="w-full text-sm rounded-xl px-3 py-2.5"
                  style={{ background: 'var(--navy-3)', color: 'var(--text-primary)', border: '1px solid var(--glass-border)', outline: 'none' }}>
                  <option value="">Zone du terrain</option>
                  {ZONES.map(z => <option key={z} value={z}>{ZONE_LABELS[z]}</option>)}
                </select>

                {/* Label */}
                <input
                  value={editing.label || ''}
                  placeholder="Étiquette libre"
                  onChange={e => setEditing(d => ({ ...d, label: e.target.value }))}
                  className="w-full text-sm rounded-xl px-3 py-2.5"
                  style={{ background: 'var(--navy-3)', color: 'var(--text-primary)', border: '1px solid var(--glass-border)', outline: 'none' }} />

                {/* Notes */}
                <textarea
                  value={editing.notes || ''}
                  placeholder="Notes..."
                  onChange={e => setEditing(d => ({ ...d, notes: e.target.value }))}
                  className="w-full text-sm rounded-xl px-3 py-2.5 resize-none h-16"
                  style={{ background: 'var(--navy-3)', color: 'var(--text-primary)', border: '1px solid var(--glass-border)', outline: 'none' }} />

                <button onClick={handleSave}
                  className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-semibold transition-all duration-200"
                  style={{ background: 'linear-gradient(135deg, rgba(0,230,118,0.2), rgba(0,176,255,0.2))', color: 'var(--green)', border: '1px solid rgba(0,230,118,0.3)' }}
                  onMouseEnter={e => e.currentTarget.style.background = 'linear-gradient(135deg, rgba(0,230,118,0.3), rgba(0,176,255,0.3))'}
                  onMouseLeave={e => e.currentTarget.style.background = 'linear-gradient(135deg, rgba(0,230,118,0.2), rgba(0,176,255,0.2))'}>
                  <Save size={14} /> Enregistrer
                </button>
              </div>
            </div>
          )}

          {/* Segment list */}
          <div className="flex-1 overflow-y-auto p-3 space-y-1.5">
            {segments.map(seg => {
              const style = STATUS_STYLE[seg.status] || STATUS_STYLE.ai_proposed
              const dot = PHASE_DOT[seg.phase_type] || PHASE_DOT.unknown
              const isSelected = seg.id === selected?.id

              return (
                <button key={seg.id} onClick={() => select(seg)}
                  className="w-full text-left px-3 py-3 rounded-xl transition-all duration-150"
                  style={{
                    background: isSelected ? 'rgba(0,230,118,0.06)' : 'var(--glass)',
                    border: `1px solid ${isSelected ? 'rgba(0,230,118,0.3)' : 'var(--glass-border)'}`,
                    boxShadow: isSelected ? '0 0 16px rgba(0,230,118,0.1)' : 'none',
                  }}>
                  <div className="flex items-center justify-between mb-1.5">
                    <span className="font-mono text-xs" style={{ color: 'var(--text-muted)' }}>
                      {formatTime(seg.start_time)} — {formatTime(seg.end_time)}
                    </span>
                    <span className="text-xs px-1.5 py-0.5 rounded-md font-semibold"
                      style={{ background: style.bg, color: style.color }}>
                      {style.label}
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 rounded-full shrink-0" style={{ background: dot }} />
                    <span className="text-sm font-medium" style={{ color: 'var(--text-primary)' }}>
                      {PHASE_LABELS[seg.phase_type] || seg.phase_type}
                    </span>
                    {seg.label && (
                      <span className="text-xs truncate" style={{ color: 'var(--text-muted)' }}>{seg.label}</span>
                    )}
                  </div>
                  {seg.ai_confidence != null && (
                    <div className="mt-2 flex items-center gap-2">
                      <div className="flex-1 h-1 rounded-full overflow-hidden" style={{ background: 'var(--navy-3)' }}>
                        <div className="h-full rounded-full" style={{
                          width: `${seg.ai_confidence * 100}%`,
                          background: seg.ai_confidence > 0.7 ? 'var(--green)' : seg.ai_confidence > 0.4 ? '#ffd600' : '#ff5252',
                        }} />
                      </div>
                      <span className="font-mono text-xs" style={{ color: 'var(--text-muted)' }}>
                        {Math.round(seg.ai_confidence * 100)}%
                      </span>
                    </div>
                  )}
                </button>
              )
            })}
          </div>
        </div>
      </div>
    </div>
  )
}
