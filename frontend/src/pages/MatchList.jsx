import { useState, useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { api } from '../api'
import { Upload, Play, BarChart2, Trash2, RefreshCw, CheckCircle, Clock, AlertCircle, Zap } from 'lucide-react'
import Tilt3D from '../components/Tilt3D'
import RippleButton from '../components/RippleButton'
import ProgressRing from '../components/ProgressRing'

const STATUS_CONFIG = {
  pending:    { icon: Clock,       color: '#ffc640', label: 'En attente',   bg: 'rgba(255,198,64,0.08)' },
  processing: { icon: RefreshCw,   color: 'var(--blue)', label: 'Traitement', bg: 'rgba(0,200,255,0.08)', spin: true },
  ready:      { icon: CheckCircle, color: 'var(--green)', label: 'Prêt',     bg: 'rgba(0,255,136,0.08)' },
  error:      { icon: AlertCircle, color: '#ff5252', label: 'Erreur',        bg: 'rgba(255,82,82,0.08)' },
}

function StatusBadge({ status }) {
  const c = STATUS_CONFIG[status] || STATUS_CONFIG.pending
  const Icon = c.icon
  return (
    <span style={{
      display: 'inline-flex', alignItems: 'center', gap: 5,
      padding: '3px 10px', borderRadius: 99,
      background: c.bg, color: c.color,
      border: `1px solid ${c.color}30`,
      fontSize: 11, fontWeight: 600,
    }}>
      <Icon size={10} className={c.spin ? 'animate-spin' : ''} />
      {c.label}
    </span>
  )
}

function MatchCard({ match, onDelete, onAnalyze, onReview, onStats, index }) {
  const aiPct = match.ai_analyzed ? 100 : 0

  return (
    <Tilt3D
      intensity={8}
      className={`fade-in-delay-${Math.min(index % 3 + 1, 3)}`}
      style={{
        borderRadius: 20,
        overflow: 'hidden',
        background: 'var(--navy-2)',
        border: '1px solid var(--glass-border)',
        transition: 'border-color 0.3s ease',
      }}>
      {/* Thumbnail */}
      <div style={{ position: 'relative', aspectRatio: '16/9', background: 'var(--navy-3)', overflow: 'hidden' }}>
        {match.thumbnail_path
          ? <img src={`/thumbnails/${match.id}.jpg`} style={{ width: '100%', height: '100%', objectFit: 'cover' }} alt="" />
          : (
            <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              {/* Retro-futurist placeholder */}
              <div style={{
                width: 64, height: 64, borderRadius: '50%',
                background: 'radial-gradient(circle, rgba(0,255,136,0.15) 0%, transparent 70%)',
                border: '1px solid rgba(0,255,136,0.2)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
              }}>
                <Play size={22} style={{ color: 'var(--green)' }} />
              </div>
            </div>
          )}

        {/* Cinematic gradient overlay */}
        <div style={{
          position: 'absolute', inset: 0,
          background: 'linear-gradient(to top, var(--navy-2) 0%, rgba(7,15,28,0.6) 50%, transparent 100%)',
        }} />

        {/* Badges */}
        <div style={{ position: 'absolute', top: 10, right: 10 }}>
          <StatusBadge status={match.status} />
        </div>
        {match.ai_analyzed && (
          <div style={{
            position: 'absolute', top: 10, left: 10,
            display: 'flex', alignItems: 'center', gap: 5,
            padding: '3px 10px', borderRadius: 99,
            background: 'rgba(100,60,200,0.2)', color: '#b39ddb',
            border: '1px solid rgba(179,157,219,0.25)',
            fontSize: 11, fontWeight: 600,
          }}>
            <Zap size={10} fill="currentColor" /> IA analysé
          </div>
        )}

        {/* Duration badge */}
        {match.duration_seconds && (
          <div style={{
            position: 'absolute', bottom: 10, right: 10,
            fontFamily: 'JetBrains Mono, monospace', fontSize: 11,
            padding: '2px 8px', borderRadius: 6,
            background: 'rgba(3,8,15,0.8)', color: 'var(--text-secondary)',
            border: '1px solid var(--glass-border)',
          }}>
            {Math.floor(match.duration_seconds / 60)}:{String(Math.floor(match.duration_seconds % 60)).padStart(2,'0')}
          </div>
        )}
      </div>

      {/* Card body */}
      <div style={{ padding: '16px 16px 14px' }}>
        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 8 }}>
          <div style={{ minWidth: 0 }}>
            <h3 style={{
              fontWeight: 700, fontSize: 15,
              color: 'var(--text-primary)',
              overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
              letterSpacing: '-0.01em',
            }}>{match.title}</h3>
            {(match.home_team || match.away_team) && (
              <p style={{ fontSize: 12, marginTop: 3, color: 'var(--text-secondary)' }}>
                {match.home_team} <span style={{ color: 'var(--text-muted)' }}>vs</span> {match.away_team}
              </p>
            )}
          </div>
          {/* Progress ring gamification */}
          <ProgressRing pct={aiPct} size={42} stroke={3}
            color={aiPct === 100 ? 'var(--green)' : 'var(--text-muted)'}
            label={aiPct === 100 ? '✓' : '—'} />
        </div>

        {/* Actions */}
        <div style={{ display: 'flex', gap: 8, marginTop: 14 }}>
          {match.status === 'ready' && !match.ai_analyzed && (
            <RippleButton onClick={() => onAnalyze(match.id)}
              style={{
                flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
                padding: '8px 0', borderRadius: 12, border: '1px solid rgba(179,157,219,0.3)',
                background: 'rgba(100,60,200,0.12)', color: '#b39ddb',
                fontSize: 12, fontWeight: 600, cursor: 'pointer',
              }}>
              <Zap size={12} /> Analyser IA
            </RippleButton>
          )}
          {match.status === 'ready' && (
            <RippleButton onClick={() => onReview(match.id)}
              style={{
                flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
                padding: '8px 0', borderRadius: 12, border: '1px solid rgba(0,255,136,0.25)',
                background: 'var(--green-faint)', color: 'var(--green)',
                fontSize: 12, fontWeight: 600, cursor: 'pointer',
              }}>
              <Play size={12} /> Revue
            </RippleButton>
          )}
          {match.ai_analyzed && (
            <RippleButton onClick={() => onStats(match.id)}
              style={{
                flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
                padding: '8px 0', borderRadius: 12, border: '1px solid rgba(0,200,255,0.2)',
                background: 'rgba(0,200,255,0.06)', color: 'var(--blue)',
                fontSize: 12, fontWeight: 600, cursor: 'pointer',
              }}>
              <BarChart2 size={12} /> Stats
            </RippleButton>
          )}
          <button onClick={() => onDelete(match.id)}
            style={{
              width: 34, height: 34, borderRadius: 10, flexShrink: 0,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              background: 'var(--glass)', border: '1px solid var(--glass-border)',
              color: 'var(--text-muted)', cursor: 'pointer', transition: 'all 0.2s',
            }}
            onMouseEnter={e => { e.currentTarget.style.background = 'rgba(255,82,82,0.1)'; e.currentTarget.style.color = '#ff5252' }}
            onMouseLeave={e => { e.currentTarget.style.background = 'var(--glass)'; e.currentTarget.style.color = 'var(--text-muted)' }}>
            <Trash2 size={13} />
          </button>
        </div>
      </div>
    </Tilt3D>
  )
}

export default function MatchList() {
  const [matches, setMatches] = useState([])
  const [uploading, setUploading] = useState(false)
  const [dragOver, setDragOver] = useState(false)
  const fileRef = useRef()
  const navigate = useNavigate()

  const load = async () => {
    const data = await api.getMatches().catch(() => [])
    setMatches(data)
  }

  useEffect(() => {
    load()
    const iv = setInterval(load, 4000)
    return () => clearInterval(iv)
  }, [])

  const handleFile = async (file) => {
    if (!file?.type.startsWith('video/')) return
    setUploading(true)
    const fd = new FormData()
    fd.append('file', file)
    fd.append('title', file.name.replace(/\.[^.]+$/, ''))
    try { await api.uploadMatch(fd); await load() }
    finally { setUploading(false); if (fileRef.current) fileRef.current.value = '' }
  }

  const ready     = matches.filter(m => m.status === 'ready').length
  const analyzed  = matches.filter(m => m.ai_analyzed).length

  return (
    <div style={{ minHeight: '100%', padding: '40px 36px', background: 'var(--navy)' }}>

      {/* ── Kinetic ticker ── */}
      <div className="ticker-wrap" style={{ marginBottom: 32, height: 28 }}>
        <div className="ticker-inner" style={{ height: '100%', alignItems: 'center' }}>
          {Array(2).fill(null).map((_, i) => (
            <span key={i} style={{
              display: 'inline-flex', gap: 0, alignItems: 'center',
              fontSize: 10, fontWeight: 700, letterSpacing: '0.15em',
              color: 'var(--text-muted)', textTransform: 'uppercase',
            }}>
              {['ANALYSE VIDÉO', 'RUGBY', 'IA TEMPS RÉEL', 'SAM 3.1', 'YOLOv8', 'DÉTECTION AVANCÉE', 'SEGMENTATION AUTO'].map((t, j) => (
                <span key={j} style={{ display: 'inline-flex', alignItems: 'center', gap: 32, paddingRight: 32 }}>
                  <span style={{ color: 'var(--green)', marginRight: 8 }}>◆</span>{t}
                </span>
              ))}
            </span>
          ))}
        </div>
      </div>

      {/* ── Header ── */}
      <div style={{ marginBottom: 36 }}>
        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between' }}>
          <div>
            <h1 className="text-display text-chrome fade-in" style={{ marginBottom: 6 }}>
              RuckVision
            </h1>
            <p className="fade-in-delay-1" style={{ color: 'var(--text-secondary)', fontSize: 14 }}>
              {matches.length} match{matches.length !== 1 ? 's' : ''}
              <span style={{ color: 'var(--text-muted)', margin: '0 8px' }}>·</span>
              <span style={{ color: 'var(--green)' }}>{ready}</span> prêt{ready !== 1 ? 's' : ''}
              <span style={{ color: 'var(--text-muted)', margin: '0 8px' }}>·</span>
              <span style={{ color: 'var(--blue)' }}>{analyzed}</span> analysé{analyzed !== 1 ? 's' : ''} par IA
            </p>
          </div>

          <RippleButton
            onClick={() => fileRef.current?.click()}
            disabled={uploading}
            style={{
              display: 'flex', alignItems: 'center', gap: 8,
              padding: '10px 22px', borderRadius: 14,
              background: uploading ? 'var(--navy-3)' : 'linear-gradient(135deg, var(--green), var(--blue))',
              color: uploading ? 'var(--text-muted)' : 'var(--navy)',
              border: 'none', fontSize: 13, fontWeight: 700,
              cursor: uploading ? 'not-allowed' : 'pointer',
              boxShadow: uploading ? 'none' : '0 0 28px rgba(0,255,136,0.25)',
              transition: 'all 0.3s ease',
            }}>
            <Upload size={14} />
            {uploading ? 'Upload...' : 'Importer'}
          </RippleButton>
          <input ref={fileRef} type="file" accept="video/*" style={{ display: 'none' }}
            onChange={e => handleFile(e.target.files[0])} />
        </div>

        {/* Gradient separator */}
        <div style={{
          height: 1, marginTop: 20,
          background: 'linear-gradient(90deg, var(--green), var(--blue), transparent)',
        }} />
      </div>

      {/* ── Empty / Drop Zone ── */}
      {matches.length === 0 && (
        <div
          onDrop={e => { e.preventDefault(); setDragOver(false); handleFile(e.dataTransfer.files[0]) }}
          onDragOver={e => { e.preventDefault(); setDragOver(true) }}
          onDragLeave={() => setDragOver(false)}
          onClick={() => fileRef.current?.click()}
          style={{
            display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
            borderRadius: 24, padding: '80px 40px',
            border: `2px dashed ${dragOver ? 'var(--green)' : 'var(--navy-4)'}`,
            background: dragOver ? 'var(--green-faint)' : 'transparent',
            cursor: 'pointer', transition: 'all 0.3s ease',
          }}>
          <div style={{
            width: 80, height: 80, borderRadius: '50%', marginBottom: 20,
            background: 'radial-gradient(circle, rgba(0,255,136,0.12) 0%, transparent 70%)',
            border: '1px solid rgba(0,255,136,0.2)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            boxShadow: '0 0 40px rgba(0,255,136,0.1)',
          }}>
            <Upload size={28} style={{ color: 'var(--green)' }} />
          </div>
          <p style={{ fontSize: 18, fontWeight: 700, color: 'var(--text-primary)', marginBottom: 8, letterSpacing: '-0.02em' }}>
            Glissez une vidéo ici
          </p>
          <p style={{ fontSize: 13, color: 'var(--text-muted)' }}>
            MP4 · MKV · AVI · MOV · WebM — tous formats supportés via FFmpeg
          </p>
        </div>
      )}

      {/* ── Drop overlay when matches exist ── */}
      {matches.length > 0 && dragOver && (
        <div
          onDrop={e => { e.preventDefault(); setDragOver(false); handleFile(e.dataTransfer.files[0]) }}
          onDragOver={e => e.preventDefault()}
          onDragLeave={() => setDragOver(false)}
          style={{
            marginBottom: 20, padding: '16px',
            borderRadius: 16, border: '2px dashed var(--green)',
            background: 'var(--green-faint)',
            textAlign: 'center', fontSize: 13, color: 'var(--green)', fontWeight: 600,
          }}>
          Déposer la vidéo
        </div>
      )}

      {/* ── Grid ── */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))',
        gap: 20,
      }}>
        {matches.map((m, i) => (
          <MatchCard
            key={m.id}
            match={m}
            index={i}
            onDelete={async (id) => {
              if (!confirm('Supprimer ce match ?')) return
              await api.deleteMatch(id)
              setMatches(prev => prev.filter(x => x.id !== id))
            }}
            onAnalyze={async (id) => { await api.analyzeMatch(id); await load() }}
            onReview={(id) => navigate(`/match/${id}/review`)}
            onStats={(id) => navigate(`/match/${id}/dashboard`)}
          />
        ))}
      </div>
    </div>
  )
}
