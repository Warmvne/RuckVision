import { useState, useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { api } from '../api'
import { Upload, Play, BarChart2, Trash2, RefreshCw, CheckCircle, Clock, AlertCircle, Zap } from 'lucide-react'
import Tilt3D from '../components/Tilt3D'
import RippleButton from '../components/RippleButton'
import ProgressRing from '../components/ProgressRing'

const STATUS = {
  pending:    { icon: Clock,       color: 'var(--gold)',   bg: 'var(--gold-soft)',   label: 'En attente',  spin: false },
  processing: { icon: RefreshCw,   color: 'var(--blue)',   bg: 'var(--blue-soft)',   label: 'Traitement',  spin: true  },
  ready:      { icon: CheckCircle, color: 'var(--green)',  bg: 'var(--green-soft)',  label: 'Prêt',        spin: false },
  error:      { icon: AlertCircle, color: 'var(--red)',    bg: 'rgba(248,113,113,0.1)', label: 'Erreur',   spin: false },
}

function Badge({ status }) {
  const c = STATUS[status] || STATUS.pending
  const Icon = c.icon
  return (
    <span style={{
      display: 'inline-flex', alignItems: 'center', gap: 5,
      padding: '4px 10px', borderRadius: 99,
      background: c.bg, color: c.color,
      border: `1px solid ${c.color}40`,
      fontSize: 11, fontWeight: 600,
    }}>
      <Icon size={10} className={c.spin ? 'animate-spin' : ''} />
      {c.label}
    </span>
  )
}

function MatchCard({ match, index, onDelete, onAnalyze, onReview, onStats }) {
  return (
    <Tilt3D intensity={7} className={`fade-in-delay-${(index % 3) + 1}`}
      style={{ borderRadius: 20, overflow: 'hidden', background: 'var(--bg-2)', border: '1px solid var(--border)' }}>

      {/* Thumbnail */}
      <div style={{ position: 'relative', aspectRatio: '16/9', background: 'var(--bg-3)', overflow: 'hidden' }}>
        {match.thumbnail_path
          ? <img src={`/thumbnails/${match.id}.jpg`} style={{ width: '100%', height: '100%', objectFit: 'cover' }} alt="" />
          : (
            <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <div style={{
                width: 60, height: 60, borderRadius: '50%',
                background: 'var(--green-soft)', border: '1px solid rgba(0,229,160,0.25)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
              }}>
                <Play size={22} style={{ color: 'var(--green)' }} />
              </div>
            </div>
          )}
        {/* gradient overlay */}
        <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(to top, var(--bg-2) 0%, transparent 55%)' }} />

        <div style={{ position: 'absolute', top: 10, right: 10 }}><Badge status={match.status} /></div>
        {match.ai_analyzed && (
          <div style={{
            position: 'absolute', top: 10, left: 10,
            display: 'inline-flex', alignItems: 'center', gap: 5,
            padding: '4px 10px', borderRadius: 99,
            background: 'var(--purple-soft)', color: 'var(--purple)',
            border: '1px solid rgba(167,139,250,0.3)', fontSize: 11, fontWeight: 600,
          }}>
            <Zap size={10} fill="currentColor" /> IA analysé
          </div>
        )}
        {match.duration_seconds && (
          <span style={{
            position: 'absolute', bottom: 10, right: 10,
            fontFamily: 'JetBrains Mono, monospace', fontSize: 11,
            padding: '2px 8px', borderRadius: 6,
            background: 'rgba(14,20,32,0.85)', color: 'var(--t2)',
            border: '1px solid var(--border)',
          }}>
            {Math.floor(match.duration_seconds / 60)}:{String(Math.floor(match.duration_seconds % 60)).padStart(2,'0')}
          </span>
        )}
      </div>

      {/* Body */}
      <div style={{ padding: '14px 16px 16px' }}>
        <div style={{ display: 'flex', alignItems: 'flex-start', gap: 10, marginBottom: 14 }}>
          <div style={{ flex: 1, minWidth: 0 }}>
            <p style={{ fontWeight: 700, fontSize: 15, color: 'var(--t1)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', letterSpacing: '-0.01em' }}>
              {match.title}
            </p>
            {(match.home_team || match.away_team) && (
              <p style={{ fontSize: 12, color: 'var(--t2)', marginTop: 2 }}>
                {match.home_team} <span style={{ color: 'var(--t3)' }}>vs</span> {match.away_team}
              </p>
            )}
          </div>
          <ProgressRing
            pct={match.ai_analyzed ? 100 : 0} size={40} stroke={3}
            color={match.ai_analyzed ? 'var(--green)' : 'var(--t4)'}
            label={match.ai_analyzed ? '✓' : '—'}
          />
        </div>

        {/* Actions */}
        <div style={{ display: 'flex', gap: 7 }}>
          {match.status === 'ready' && !match.ai_analyzed && (
            <RippleButton onClick={() => onAnalyze(match.id)} style={{
              flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
              padding: '8px 0', borderRadius: 11,
              background: 'var(--purple-soft)', color: 'var(--purple)',
              border: '1px solid rgba(167,139,250,0.3)',
              fontSize: 12, fontWeight: 600, cursor: 'pointer',
            }}>
              <Zap size={12} /> Analyser IA
            </RippleButton>
          )}
          {match.status === 'ready' && (
            <RippleButton onClick={() => onReview(match.id)} style={{
              flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
              padding: '8px 0', borderRadius: 11,
              background: 'var(--green-soft)', color: 'var(--green)',
              border: '1px solid rgba(0,229,160,0.3)',
              fontSize: 12, fontWeight: 600, cursor: 'pointer',
            }}>
              <Play size={12} /> Revue
            </RippleButton>
          )}
          {match.ai_analyzed && (
            <RippleButton onClick={() => onStats(match.id)} style={{
              flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
              padding: '8px 0', borderRadius: 11,
              background: 'var(--blue-soft)', color: 'var(--blue)',
              border: '1px solid rgba(56,189,248,0.25)',
              fontSize: 12, fontWeight: 600, cursor: 'pointer',
            }}>
              <BarChart2 size={12} /> Stats
            </RippleButton>
          )}
          <button onClick={() => onDelete(match.id)} style={{
            width: 34, height: 34, borderRadius: 10, display: 'flex',
            alignItems: 'center', justifyContent: 'center', flexShrink: 0,
            background: 'var(--glass)', border: '1px solid var(--border)',
            color: 'var(--t3)', cursor: 'pointer', transition: 'all 0.2s',
          }}
            onMouseEnter={e => { e.currentTarget.style.background = 'rgba(248,113,113,0.12)'; e.currentTarget.style.color = 'var(--red)' }}
            onMouseLeave={e => { e.currentTarget.style.background = 'var(--glass)'; e.currentTarget.style.color = 'var(--t3)' }}>
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

  const load = async () => setMatches(await api.getMatches().catch(() => []))

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

  const ready    = matches.filter(m => m.status === 'ready').length
  const analyzed = matches.filter(m => m.ai_analyzed).length

  return (
    <div style={{ minHeight: '100%', padding: '36px 32px', background: 'var(--bg)' }}>

      {/* ── Ticker ── */}
      <div className="ticker-wrap" style={{ borderRadius: 10, marginBottom: 28, height: 32, display: 'flex', alignItems: 'center' }}>
        <div className="ticker-inner" style={{ alignItems: 'center', height: 32 }}>
          {Array(2).fill(null).map((_, i) => (
            <span key={i} style={{ display: 'inline-flex', alignItems: 'center', height: 32 }}>
              {['ANALYSE VIDÉO', 'RUGBY IA', 'SAM 3.1', 'YOLOV8', 'DÉTECTION JOUEURS', 'SEGMENTATION AUTO', 'STATS EN TEMPS RÉEL'].map((t, j) => (
                <span key={j} style={{ display: 'inline-flex', alignItems: 'center', gap: 20, paddingRight: 40,
                  fontSize: 11, fontWeight: 700, letterSpacing: '0.12em', color: 'var(--ticker-text)', textTransform: 'uppercase' }}>
                  <span style={{ color: 'var(--ticker-accent)', fontSize: 8 }}>◆</span>
                  {t}
                </span>
              ))}
            </span>
          ))}
        </div>
      </div>

      {/* ── Header ── */}
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 8 }}>
        <div>
          <p style={{ fontSize: 10, fontWeight: 700, letterSpacing: '0.15em', color: 'var(--green)', textTransform: 'uppercase', marginBottom: 6 }}>
            Analyse vidéo
          </p>
          <h1 className="text-display text-chrome" style={{ marginBottom: 8 }}>RuckVision</h1>
          <p style={{ fontSize: 13, color: 'var(--t2)' }}>
            {matches.length} match{matches.length !== 1 ? 's' : ''}
            <span style={{ color: 'var(--t4)', margin: '0 8px' }}>·</span>
            <span style={{ color: 'var(--green)', fontWeight: 600 }}>{ready}</span> prêt{ready !== 1 ? 's' : ''}
            <span style={{ color: 'var(--t4)', margin: '0 8px' }}>·</span>
            <span style={{ color: 'var(--blue)', fontWeight: 600 }}>{analyzed}</span> analysé{analyzed !== 1 ? 's' : ''} par IA
          </p>
        </div>

        <RippleButton onClick={() => fileRef.current?.click()} disabled={uploading} style={{
          display: 'flex', alignItems: 'center', gap: 8,
          padding: '10px 20px', borderRadius: 13,
          background: uploading ? 'var(--bg-3)' : 'linear-gradient(135deg, var(--green), var(--blue))',
          color: uploading ? 'var(--t3)' : 'var(--bg)',
          border: 'none', fontSize: 13, fontWeight: 700, cursor: uploading ? 'not-allowed' : 'pointer',
          boxShadow: uploading ? 'none' : '0 0 24px var(--green-glow)',
          transition: 'all 0.3s',
        }}>
          <Upload size={14} />
          {uploading ? 'Upload...' : 'Importer une vidéo'}
        </RippleButton>
        <input ref={fileRef} type="file" accept="video/*" style={{ display: 'none' }} onChange={e => handleFile(e.target.files[0])} />
      </div>

      {/* Separator */}
      <div style={{ height: 1, margin: '20px 0 28px', background: 'linear-gradient(90deg, var(--green), var(--blue), transparent)' }} />

      {/* ── Empty / Drop zone ── */}
      {matches.length === 0 && (
        <div
          onDrop={e => { e.preventDefault(); setDragOver(false); handleFile(e.dataTransfer.files[0]) }}
          onDragOver={e => { e.preventDefault(); setDragOver(true) }}
          onDragLeave={() => setDragOver(false)}
          onClick={() => fileRef.current?.click()}
          style={{
            borderRadius: 22, padding: '72px 40px',
            display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
            cursor: 'pointer', transition: 'all 0.3s',
            border: `2px dashed ${dragOver ? 'var(--green)' : 'var(--bg-4)'}`,
            background: dragOver ? 'var(--green-soft)' : 'transparent',
          }}>
          <div style={{
            width: 72, height: 72, borderRadius: '50%', marginBottom: 18,
            background: 'var(--green-soft)', border: '1px solid rgba(0,229,160,0.3)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            boxShadow: '0 0 32px var(--green-glow)',
          }}>
            <Upload size={28} style={{ color: 'var(--green)' }} />
          </div>
          <p style={{ fontSize: 17, fontWeight: 700, color: 'var(--t1)', marginBottom: 6, letterSpacing: '-0.02em' }}>
            Glissez une vidéo ici
          </p>
          <p style={{ fontSize: 13, color: 'var(--t2)' }}>MP4 · MKV · AVI · MOV · WebM — tous formats supportés</p>
        </div>
      )}

      {/* ── Cards grid ── */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(295px, 1fr))', gap: 18 }}>
        {matches.map((m, i) => (
          <MatchCard key={m.id} match={m} index={i}
            onDelete={async id => { if (!confirm('Supprimer ce match ?')) return; await api.deleteMatch(id); setMatches(p => p.filter(x => x.id !== id)) }}
            onAnalyze={async id => { await api.analyzeMatch(id); await load() }}
            onReview={id => navigate(`/match/${id}/review`)}
            onStats={id => navigate(`/match/${id}/dashboard`)}
          />
        ))}
      </div>
    </div>
  )
}
