import { useState, useEffect, useRef, useCallback } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { api } from '../api'
import VideoPlayer from '../components/VideoPlayer'
import SegmentTimeline from '../components/SegmentTimeline'
import {
  CheckCircle, XCircle, Scissors, ChevronLeft, ChevronRight,
  Edit2, Plus, ArrowLeft, Save
} from 'lucide-react'
import clsx from 'clsx'

const PHASES = ['ruck', 'scrum', 'lineout', 'open_play', 'try', 'conversion', 'penalty', 'kickoff', 'unknown']
const PHASE_LABELS = {
  ruck: 'Ruck', scrum: 'Mêlée', lineout: 'Touche', open_play: 'Jeu ouvert',
  try: 'Essai', conversion: 'Transformation', penalty: 'Pénalité', kickoff: 'Coup d\'envoi', unknown: 'Inconnu'
}
const ZONES = ['own_22', 'own_half', 'opp_half', 'opp_22']
const ZONE_LABELS = { own_22: '22m défensif', own_half: 'Mi-terrain déf.', opp_half: 'Mi-terrain att.', opp_22: '22m offensif' }

function formatTime(s) {
  const m = Math.floor(s / 60)
  const sec = Math.floor(s % 60)
  return `${m}:${sec.toString().padStart(2, '0')}`
}

const STATUS_BADGE = {
  ai_proposed: 'bg-purple-800 text-purple-200',
  validated: 'bg-green-800 text-green-200',
  rejected: 'bg-red-900 text-red-300 line-through',
  edited: 'bg-blue-800 text-blue-200',
}

export default function ReviewPage() {
  const { id } = useParams()
  const navigate = useNavigate()
  const playerRef = useRef(null)

  const [match, setMatch] = useState(null)
  const [segments, setSegments] = useState([])
  const [selected, setSelected] = useState(null)
  const [currentTime, setCurrentTime] = useState(0)
  const [editing, setEditing] = useState(null) // draft state

  const load = useCallback(async () => {
    const [m, segs] = await Promise.all([api.getMatch(id), api.getSegments(id)])
    setMatch(m)
    setSegments(segs)
  }, [id])

  useEffect(() => { load() }, [load])

  const select = (seg) => {
    setSelected(seg)
    setEditing({ ...seg })
    if (playerRef.current) playerRef.current.currentTime(seg.start_time)
  }

  const navigate_segment = (dir) => {
    const active = segments.filter(s => s.status !== 'rejected')
    const idx = active.findIndex(s => s.id === selected?.id)
    const next = active[idx + dir]
    if (next) select(next)
  }

  const handleValidate = async () => {
    await api.validateSegment(selected.id)
    await load()
    navigate_segment(1)
  }

  const handleReject = async () => {
    await api.rejectSegment(selected.id)
    await load()
    navigate_segment(1)
  }

  const handleSaveEdit = async () => {
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
    setSelected(s => ({ ...s, ...editing }))
  }

  const handleSplit = async () => {
    if (!selected) return
    const t = playerRef.current?.currentTime() ?? currentTime
    if (t <= selected.start_time || t >= selected.end_time) {
      alert('Placez la tête de lecture à l\'intérieur du segment pour couper.')
      return
    }
    await api.splitSegment(selected.id, t)
    await load()
  }

  const handleAddSegment = async () => {
    const t = playerRef.current?.currentTime() ?? currentTime
    await api.createSegment({
      match_id: parseInt(id),
      start_time: t,
      end_time: Math.min(t + 10, match?.duration_seconds ?? t + 10),
    })
    await load()
  }

  const hlsSrc = match?.hls_path ? `/hls/${id}/index.m3u8` : null
  const videoSrc = match?.video_path ? `/videos/${encodeURIComponent(match.video_path.split('/').pop())}` : null
  const src = hlsSrc || videoSrc

  const stats = {
    total: segments.length,
    validated: segments.filter(s => s.status === 'validated').length,
    pending: segments.filter(s => s.status === 'ai_proposed').length,
  }

  return (
    <div className="flex flex-col h-screen bg-gray-950">
      {/* Header */}
      <div className="flex items-center gap-4 px-6 py-3 bg-gray-900 border-b border-gray-800 shrink-0">
        <button onClick={() => navigate('/')} className="text-gray-400 hover:text-white">
          <ArrowLeft size={18} />
        </button>
        <h2 className="font-semibold text-white">{match?.title}</h2>
        <span className="text-gray-500 text-sm ml-auto">{stats.validated}/{stats.total} validés · {stats.pending} en attente</span>
        <button onClick={() => navigate(`/match/${id}/dashboard`)}
          className="px-3 py-1.5 bg-rugby-green hover:bg-rugby-light text-white rounded-lg text-sm">
          Voir les stats
        </button>
      </div>

      <div className="flex flex-1 overflow-hidden">
        {/* Video + timeline */}
        <div className="flex flex-col flex-1 p-4 gap-3 overflow-hidden">
          <div className="flex-1 bg-black rounded-xl overflow-hidden">
            {src && <VideoPlayer src={src} onTimeUpdate={setCurrentTime} playerRef={playerRef} />}
          </div>

          <div className="shrink-0">
            <SegmentTimeline
              segments={segments}
              duration={match?.duration_seconds}
              currentTime={currentTime}
              onSeek={(t) => playerRef.current?.currentTime(t)}
              selectedId={selected?.id}
              onSelect={select}
            />
            <div className="flex justify-between mt-1 text-xs text-gray-600">
              <span>0:00</span>
              <span>{formatTime(match?.duration_seconds ?? 0)}</span>
            </div>
          </div>

          {/* Quick actions */}
          <div className="flex gap-2 shrink-0">
            <button onClick={() => navigate_segment(-1)} className="p-2 rounded-lg bg-gray-800 hover:bg-gray-700 text-gray-300">
              <ChevronLeft size={16} />
            </button>
            <button onClick={() => navigate_segment(1)} className="p-2 rounded-lg bg-gray-800 hover:bg-gray-700 text-gray-300">
              <ChevronRight size={16} />
            </button>
            <button onClick={handleSplit} title="Couper au playhead"
              className="flex items-center gap-1 px-3 py-2 rounded-lg bg-gray-800 hover:bg-yellow-900 text-gray-300 text-sm">
              <Scissors size={14} /> Couper
            </button>
            <button onClick={handleAddSegment} title="Ajouter un segment"
              className="flex items-center gap-1 px-3 py-2 rounded-lg bg-gray-800 hover:bg-rugby-green text-gray-300 text-sm">
              <Plus size={14} /> Segment
            </button>
            {selected && (
              <>
                <button onClick={handleValidate}
                  className="flex items-center gap-1 px-3 py-2 rounded-lg bg-green-800 hover:bg-green-700 text-white text-sm ml-auto">
                  <CheckCircle size={14} /> Valider
                </button>
                <button onClick={handleReject}
                  className="flex items-center gap-1 px-3 py-2 rounded-lg bg-red-900 hover:bg-red-800 text-white text-sm">
                  <XCircle size={14} /> Rejeter
                </button>
              </>
            )}
          </div>
        </div>

        {/* Sidebar: segment list + edit */}
        <div className="w-80 bg-gray-900 border-l border-gray-800 flex flex-col overflow-hidden">
          {/* Edit panel */}
          {editing && selected && (
            <div className="p-4 border-b border-gray-800 shrink-0">
              <p className="text-xs text-gray-500 mb-3 flex items-center gap-1">
                <Edit2 size={11} /> Édition — {formatTime(selected.start_time)} → {formatTime(selected.end_time)}
              </p>

              <div className="space-y-2">
                <select value={editing.phase_type || 'unknown'}
                  onChange={e => setEditing(d => ({ ...d, phase_type: e.target.value }))}
                  className="w-full bg-gray-800 text-white text-sm rounded-lg px-3 py-2 border border-gray-700">
                  {PHASES.map(p => <option key={p} value={p}>{PHASE_LABELS[p]}</option>)}
                </select>

                <div className="flex gap-2">
                  {['home', 'away', ''].map(t => (
                    <button key={t} onClick={() => setEditing(d => ({ ...d, team_possession: t || null }))}
                      className={clsx('flex-1 py-1.5 rounded-lg text-xs font-medium border transition',
                        editing.team_possession === (t || null)
                          ? 'bg-rugby-green border-rugby-green text-white'
                          : 'bg-gray-800 border-gray-700 text-gray-400')}>
                      {t === 'home' ? match?.home_team : t === 'away' ? match?.away_team : 'Aucun'}
                    </button>
                  ))}
                </div>

                <select value={editing.field_zone || ''}
                  onChange={e => setEditing(d => ({ ...d, field_zone: e.target.value || null }))}
                  className="w-full bg-gray-800 text-white text-sm rounded-lg px-3 py-2 border border-gray-700">
                  <option value="">Zone du terrain</option>
                  {ZONES.map(z => <option key={z} value={z}>{ZONE_LABELS[z]}</option>)}
                </select>

                <input value={editing.label || ''} placeholder="Étiquette libre"
                  onChange={e => setEditing(d => ({ ...d, label: e.target.value }))}
                  className="w-full bg-gray-800 text-white text-sm rounded-lg px-3 py-2 border border-gray-700" />

                <textarea value={editing.notes || ''} placeholder="Notes..."
                  onChange={e => setEditing(d => ({ ...d, notes: e.target.value }))}
                  className="w-full bg-gray-800 text-white text-sm rounded-lg px-3 py-2 border border-gray-700 resize-none h-16" />

                <button onClick={handleSaveEdit}
                  className="w-full flex items-center justify-center gap-1 py-2 rounded-lg bg-rugby-green hover:bg-rugby-light text-white text-sm font-medium">
                  <Save size={13} /> Enregistrer
                </button>
              </div>
            </div>
          )}

          {/* Segment list */}
          <div className="flex-1 overflow-y-auto p-2">
            {segments.map(seg => (
              <button key={seg.id} onClick={() => select(seg)}
                className={clsx(
                  'w-full text-left px-3 py-2.5 rounded-xl mb-1 transition border',
                  seg.id === selected?.id
                    ? 'bg-rugby-green/20 border-rugby-green'
                    : 'bg-gray-800/50 border-transparent hover:border-gray-700'
                )}>
                <div className="flex items-center justify-between">
                  <span className="text-xs font-mono text-gray-400">
                    {formatTime(seg.start_time)} → {formatTime(seg.end_time)}
                  </span>
                  <span className={clsx('text-xs px-1.5 py-0.5 rounded font-medium', STATUS_BADGE[seg.status])}>
                    {seg.status === 'ai_proposed' ? 'IA' : seg.status === 'validated' ? '✓' : seg.status === 'rejected' ? '✗' : '✎'}
                  </span>
                </div>
                <p className="text-sm text-white mt-0.5">{PHASE_LABELS[seg.phase_type] || seg.phase_type}</p>
                {seg.label && <p className="text-xs text-gray-500 truncate">{seg.label}</p>}
                {seg.ai_confidence && (
                  <div className="mt-1 h-1 bg-gray-700 rounded-full overflow-hidden">
                    <div className="h-full bg-purple-500 rounded-full" style={{ width: `${seg.ai_confidence * 100}%` }} />
                  </div>
                )}
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
