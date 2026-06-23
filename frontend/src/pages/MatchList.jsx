import { useState, useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { api } from '../api'
import { Upload, Play, BarChart2, Trash2, RefreshCw, CheckCircle, Clock, AlertCircle, Cpu, Zap, TrendingUp } from 'lucide-react'

const STATUS_CONFIG = {
  pending:    { icon: Clock,       color: '#ffd600', label: 'En attente',    bg: 'rgba(255,214,0,0.1)' },
  processing: { icon: RefreshCw,   color: '#00b0ff', label: 'Traitement...',  bg: 'rgba(0,176,255,0.1)', spin: true },
  ready:      { icon: CheckCircle, color: '#00e676', label: 'Prêt',           bg: 'rgba(0,230,118,0.1)' },
  error:      { icon: AlertCircle, color: '#ff5252', label: 'Erreur',         bg: 'rgba(255,82,82,0.1)' },
}

function StatusBadge({ status }) {
  const cfg = STATUS_CONFIG[status] || STATUS_CONFIG.pending
  const Icon = cfg.icon
  return (
    <span className="flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium"
      style={{ background: cfg.bg, color: cfg.color, border: `1px solid ${cfg.color}30` }}>
      <Icon size={11} className={cfg.spin ? 'animate-spin' : ''} />
      {cfg.label}
    </span>
  )
}

function MatchCard({ match, onDelete, onAnalyze, onReview, onStats }) {
  const [hovered, setHovered] = useState(false)

  return (
    <div
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      className="rounded-2xl overflow-hidden transition-all duration-300 fade-in"
      style={{
        background: 'var(--navy-2)',
        border: `1px solid ${hovered ? 'rgba(0,230,118,0.3)' : 'var(--glass-border)'}`,
        boxShadow: hovered ? '0 8px 40px rgba(0,230,118,0.08), 0 0 0 1px rgba(0,230,118,0.1)' : '0 4px 24px rgba(0,0,0,0.3)',
        transform: hovered ? 'translateY(-2px)' : 'translateY(0)',
      }}>

      {/* Thumbnail */}
      <div className="relative aspect-video overflow-hidden" style={{ background: 'var(--navy-3)' }}>
        {match.thumbnail_path ? (
          <img src={`/thumbnails/${match.id}.jpg`} className="w-full h-full object-cover" alt="" />
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <div className="w-16 h-16 rounded-full flex items-center justify-center"
              style={{ background: 'var(--green-glow)', border: '1px solid rgba(0,230,118,0.2)' }}>
              <Play size={24} style={{ color: 'var(--green)' }} />
            </div>
          </div>
        )}

        {/* Overlay gradient */}
        <div className="absolute inset-0" style={{ background: 'linear-gradient(to top, var(--navy-2) 0%, transparent 60%)' }} />

        {/* Badges */}
        <div className="absolute top-3 right-3">
          <StatusBadge status={match.status} />
        </div>
        {match.ai_analyzed && (
          <div className="absolute top-3 left-3 flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium"
            style={{ background: 'rgba(124,58,237,0.2)', color: '#a78bfa', border: '1px solid rgba(167,139,250,0.3)' }}>
            <Cpu size={11} /> IA analysé
          </div>
        )}

        {/* Duration */}
        {match.duration_seconds && (
          <div className="absolute bottom-3 right-3 font-mono text-xs px-2 py-0.5 rounded-md"
            style={{ background: 'rgba(5,13,26,0.8)', color: 'var(--text-secondary)' }}>
            {Math.floor(match.duration_seconds / 60)}:{String(Math.floor(match.duration_seconds % 60)).padStart(2,'0')}
          </div>
        )}
      </div>

      {/* Content */}
      <div className="p-4">
        <h3 className="font-semibold text-base truncate" style={{ color: 'var(--text-primary)' }}>{match.title}</h3>
        {(match.home_team || match.away_team) && (
          <p className="text-sm mt-1 font-medium" style={{ color: 'var(--text-secondary)' }}>
            {match.home_team} <span style={{ color: 'var(--text-muted)' }}>vs</span> {match.away_team}
          </p>
        )}

        {/* Action buttons */}
        <div className="flex gap-2 mt-4">
          {match.status === 'ready' && !match.ai_analyzed && (
            <button onClick={() => onAnalyze(match.id)}
              className="flex-1 flex items-center justify-center gap-1.5 py-2 rounded-xl text-xs font-semibold transition-all duration-200"
              style={{ background: 'rgba(124,58,237,0.15)', color: '#a78bfa', border: '1px solid rgba(167,139,250,0.25)' }}
              onMouseEnter={e => e.currentTarget.style.background = 'rgba(124,58,237,0.3)'}
              onMouseLeave={e => e.currentTarget.style.background = 'rgba(124,58,237,0.15)'}>
              <Zap size={12} /> Analyser IA
            </button>
          )}
          {match.status === 'ready' && (
            <button onClick={() => onReview(match.id)}
              className="flex-1 flex items-center justify-center gap-1.5 py-2 rounded-xl text-xs font-semibold transition-all duration-200"
              style={{ background: 'rgba(0,230,118,0.1)', color: 'var(--green)', border: '1px solid rgba(0,230,118,0.25)' }}
              onMouseEnter={e => { e.currentTarget.style.background = 'rgba(0,230,118,0.2)'; e.currentTarget.style.boxShadow = '0 0 16px rgba(0,230,118,0.2)'; }}
              onMouseLeave={e => { e.currentTarget.style.background = 'rgba(0,230,118,0.1)'; e.currentTarget.style.boxShadow = 'none'; }}>
              <Play size={12} /> Revue
            </button>
          )}
          {match.ai_analyzed && (
            <button onClick={() => onStats(match.id)}
              className="flex-1 flex items-center justify-center gap-1.5 py-2 rounded-xl text-xs font-semibold transition-all duration-200"
              style={{ background: 'rgba(0,176,255,0.1)', color: '#00b0ff', border: '1px solid rgba(0,176,255,0.25)' }}
              onMouseEnter={e => e.currentTarget.style.background = 'rgba(0,176,255,0.2)'}
              onMouseLeave={e => e.currentTarget.style.background = 'rgba(0,176,255,0.1)'}>
              <BarChart2 size={12} /> Stats
            </button>
          )}
          <button onClick={() => onDelete(match.id)}
            className="w-8 h-8 flex items-center justify-center rounded-xl transition-all duration-200"
            style={{ background: 'var(--glass)', border: '1px solid var(--glass-border)', color: 'var(--text-muted)' }}
            onMouseEnter={e => { e.currentTarget.style.background = 'rgba(255,82,82,0.1)'; e.currentTarget.style.color = '#ff5252'; }}
            onMouseLeave={e => { e.currentTarget.style.background = 'var(--glass)'; e.currentTarget.style.color = 'var(--text-muted)'; }}>
            <Trash2 size={13} />
          </button>
        </div>
      </div>
    </div>
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
    if (!file || !file.type.startsWith('video/')) return
    setUploading(true)
    const fd = new FormData()
    fd.append('file', file)
    fd.append('title', file.name.replace(/\.[^.]+$/, ''))
    try {
      await api.uploadMatch(fd)
      await load()
    } finally {
      setUploading(false)
      if (fileRef.current) fileRef.current.value = ''
    }
  }

  const handleDrop = (e) => {
    e.preventDefault()
    setDragOver(false)
    const file = e.dataTransfer.files[0]
    handleFile(file)
  }

  const ready = matches.filter(m => m.status === 'ready').length
  const analyzed = matches.filter(m => m.ai_analyzed).length

  return (
    <div className="min-h-full p-8" style={{ background: 'var(--navy)' }}>

      {/* Header */}
      <div className="mb-10">
        <div className="flex items-start justify-between">
          <div>
            <p className="text-xs font-semibold tracking-widest mb-2" style={{ color: 'var(--green)' }}>ANALYSE VIDÉO</p>
            <h1 className="text-4xl font-bold" style={{ color: 'var(--text-primary)', letterSpacing: '-0.02em' }}>
              Matchs
            </h1>
            <p className="mt-2 text-sm" style={{ color: 'var(--text-secondary)' }}>
              {matches.length} match{matches.length !== 1 ? 's' : ''} · {ready} prêt{ready !== 1 ? 's' : ''} · {analyzed} analysé{analyzed !== 1 ? 's' : ''} par IA
            </p>
          </div>

          {/* Upload button */}
          <label
            className="flex items-center gap-2 px-5 py-2.5 rounded-xl cursor-pointer font-semibold text-sm transition-all duration-200 relative overflow-hidden"
            style={uploading
              ? { background: 'var(--navy-3)', color: 'var(--text-muted)', border: '1px solid var(--glass-border)' }
              : { background: 'linear-gradient(135deg, #00e676, #00b0ff)', color: '#050d1a', boxShadow: '0 0 24px rgba(0,230,118,0.3)' }
            }>
            <Upload size={15} />
            {uploading ? 'Upload en cours...' : 'Importer un match'}
            <input ref={fileRef} type="file" accept="video/*" className="hidden"
              onChange={e => handleFile(e.target.files[0])} disabled={uploading} />
          </label>
        </div>

        {/* Separator */}
        <div className="mt-6 h-px" style={{ background: 'linear-gradient(90deg, var(--green), rgba(0,176,255,0.5), transparent)' }} />
      </div>

      {/* Empty state / Drop zone */}
      {matches.length === 0 && (
        <div
          onDrop={handleDrop}
          onDragOver={e => { e.preventDefault(); setDragOver(true) }}
          onDragLeave={() => setDragOver(false)}
          className="flex flex-col items-center justify-center rounded-2xl py-24 transition-all duration-300 cursor-pointer"
          style={{
            border: `2px dashed ${dragOver ? 'var(--green)' : 'var(--navy-4)'}`,
            background: dragOver ? 'var(--green-glow)' : 'transparent',
          }}
          onClick={() => fileRef.current?.click()}>
          <div className="w-20 h-20 rounded-full flex items-center justify-center mb-6"
            style={{ background: 'var(--green-glow)', border: '1px solid rgba(0,230,118,0.2)' }}>
            <Upload size={32} style={{ color: 'var(--green)' }} />
          </div>
          <p className="text-lg font-semibold mb-2" style={{ color: 'var(--text-primary)' }}>
            Glissez une vidéo ici
          </p>
          <p className="text-sm" style={{ color: 'var(--text-muted)' }}>
            MP4, MKV, AVI, MOV, WebM — tous formats supportés
          </p>
        </div>
      )}

      {/* Drop overlay when matches exist */}
      {matches.length > 0 && (
        <div
          onDrop={handleDrop}
          onDragOver={e => { e.preventDefault(); setDragOver(true) }}
          onDragLeave={() => setDragOver(false)}
          className={`mb-6 flex items-center justify-center rounded-xl py-4 transition-all duration-300 ${dragOver ? 'opacity-100' : 'opacity-0 pointer-events-none h-0 py-0 mb-0 overflow-hidden'}`}
          style={{ border: '2px dashed var(--green)', background: 'var(--green-glow)' }}>
          <p className="text-sm font-medium" style={{ color: 'var(--green)' }}>Déposer la vidéo</p>
        </div>
      )}

      {/* Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
        {matches.map(m => (
          <MatchCard
            key={m.id}
            match={m}
            onDelete={async (id) => {
              if (!confirm('Supprimer ce match ?')) return
              await api.deleteMatch(id)
              setMatches(prev => prev.filter(x => x.id !== id))
            }}
            onAnalyze={async (id) => {
              await api.analyzeMatch(id)
              await load()
            }}
            onReview={(id) => navigate(`/match/${id}/review`)}
            onStats={(id) => navigate(`/match/${id}/dashboard`)}
          />
        ))}
      </div>
    </div>
  )
}
