import { useState, useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { api } from '../api'
import { Upload, Play, BarChart2, Trash2, RefreshCw, CheckCircle, Clock, AlertCircle, Cpu } from 'lucide-react'
import clsx from 'clsx'

const STATUS_ICON = {
  pending: <Clock size={14} className="text-yellow-400" />,
  processing: <RefreshCw size={14} className="text-blue-400 animate-spin" />,
  ready: <CheckCircle size={14} className="text-green-400" />,
  error: <AlertCircle size={14} className="text-red-400" />,
}

export default function MatchList() {
  const [matches, setMatches] = useState([])
  const [uploading, setUploading] = useState(false)
  const fileRef = useRef()
  const navigate = useNavigate()

  const load = async () => {
    const data = await api.getMatches()
    setMatches(data)
  }

  useEffect(() => {
    load()
    const iv = setInterval(load, 4000)
    return () => clearInterval(iv)
  }, [])

  const handleUpload = async (e) => {
    const file = e.target.files[0]
    if (!file) return
    setUploading(true)
    const fd = new FormData()
    fd.append('file', file)
    fd.append('title', file.name.replace(/\.[^.]+$/, ''))
    try {
      await api.uploadMatch(fd)
      await load()
    } finally {
      setUploading(false)
      fileRef.current.value = ''
    }
  }

  const handleDelete = async (id, e) => {
    e.stopPropagation()
    if (!confirm('Supprimer ce match ?')) return
    await api.deleteMatch(id)
    setMatches(m => m.filter(x => x.id !== id))
  }

  const handleAnalyze = async (id, e) => {
    e.stopPropagation()
    await api.analyzeMatch(id)
    await load()
  }

  return (
    <div className="p-8">
      <div className="flex items-center justify-between mb-8">
        <h1 className="text-2xl font-bold text-white">Matchs</h1>
        <label className={clsx(
          'flex items-center gap-2 px-4 py-2 rounded-lg cursor-pointer font-medium text-sm transition',
          uploading ? 'bg-gray-700 text-gray-400' : 'bg-rugby-green hover:bg-rugby-light text-white'
        )}>
          <Upload size={16} />
          {uploading ? 'Upload...' : 'Importer un match'}
          <input ref={fileRef} type="file" accept="video/*" className="hidden" onChange={handleUpload} disabled={uploading} />
        </label>
      </div>

      {matches.length === 0 && (
        <div className="text-center py-20 text-gray-500">
          <Film size={48} className="mx-auto mb-4 opacity-30" />
          <p>Aucun match. Importez une vidéo pour commencer.</p>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
        {matches.map(m => (
          <div key={m.id} className="bg-gray-900 rounded-2xl overflow-hidden border border-gray-800 hover:border-rugby-green transition group">
            <div className="relative aspect-video bg-gray-800">
              {m.thumbnail_path ? (
                <img src={`/thumbnails/${m.id}.jpg`} className="w-full h-full object-cover" alt="" />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-gray-600">
                  <Film size={40} />
                </div>
              )}
              <div className="absolute top-2 right-2 flex items-center gap-1 bg-black/60 px-2 py-1 rounded-full text-xs">
                {STATUS_ICON[m.status]}
                <span className="capitalize text-gray-300">{m.status}</span>
              </div>
              {m.ai_analyzed && (
                <div className="absolute top-2 left-2 bg-purple-700/80 px-2 py-1 rounded-full text-xs text-white flex items-center gap-1">
                  <Cpu size={10} /> IA analysé
                </div>
              )}
            </div>

            <div className="p-4">
              <p className="font-semibold text-white truncate">{m.title}</p>
              {(m.home_team || m.away_team) && (
                <p className="text-sm text-gray-400 mt-1">{m.home_team} vs {m.away_team}</p>
              )}
              {m.duration_seconds && (
                <p className="text-xs text-gray-600 mt-1">{Math.round(m.duration_seconds / 60)} min</p>
              )}

              <div className="flex gap-2 mt-4">
                {m.status === 'ready' && !m.ai_analyzed && (
                  <button onClick={(e) => handleAnalyze(m.id, e)}
                    className="flex-1 flex items-center justify-center gap-1 py-2 rounded-lg bg-purple-700 hover:bg-purple-600 text-white text-xs font-medium">
                    <Cpu size={13} /> Analyser IA
                  </button>
                )}
                {m.status === 'ready' && (
                  <button onClick={() => navigate(`/match/${m.id}/review`)}
                    className="flex-1 flex items-center justify-center gap-1 py-2 rounded-lg bg-rugby-green hover:bg-rugby-light text-white text-xs font-medium">
                    <Play size={13} /> Revue
                  </button>
                )}
                {m.ai_analyzed && (
                  <button onClick={() => navigate(`/match/${m.id}/dashboard`)}
                    className="flex-1 flex items-center justify-center gap-1 py-2 rounded-lg bg-gray-700 hover:bg-gray-600 text-white text-xs font-medium">
                    <BarChart2 size={13} /> Stats
                  </button>
                )}
                <button onClick={(e) => handleDelete(m.id, e)}
                  className="p-2 rounded-lg bg-gray-800 hover:bg-red-900 text-gray-400 hover:text-red-400">
                  <Trash2 size={14} />
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

function Film({ size, className }) {
  return <svg width={size} height={size} className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="2" y="2" width="20" height="20" rx="2.18" ry="2.18"/><line x1="7" y1="2" x2="7" y2="22"/><line x1="17" y1="2" x2="17" y2="22"/><line x1="2" y1="12" x2="22" y2="12"/><line x1="2" y1="7" x2="7" y2="7"/><line x1="2" y1="17" x2="7" y2="17"/><line x1="17" y1="17" x2="22" y2="17"/><line x1="17" y1="7" x2="22" y2="7"/></svg>
}
