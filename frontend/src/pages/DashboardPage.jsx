import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { api } from '../api'
import {
  PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, Tooltip,
  ResponsiveContainer, CartesianGrid,
} from 'recharts'
import { ArrowLeft, TrendingUp, Clock, Layers, Target } from 'lucide-react'

const PHASE_COLORS = {
  ruck: '#f97316', scrum: '#3b82f6', lineout: '#a855f7',
  open_play: '#00e676', try: '#ffd600', conversion: '#fde047',
  penalty: '#ef4444', kickoff: '#06b6d4', unknown: '#334155',
}
const PHASE_LABELS = {
  ruck: 'Ruck', scrum: 'Mêlée', lineout: 'Touche', open_play: 'Jeu ouvert',
  try: 'Essai', conversion: 'Transfo', penalty: 'Pénalité', kickoff: 'Envoi', unknown: 'Inconnu',
}

const CustomTooltip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null
  return (
    <div className="px-3 py-2 rounded-xl text-sm"
      style={{ background: 'var(--navy-3)', border: '1px solid var(--glass-border)', color: 'var(--text-primary)', boxShadow: '0 8px 24px rgba(0,0,0,0.5)' }}>
      <p className="font-semibold mb-1">{label}</p>
      {payload.map(p => (
        <p key={p.name} style={{ color: p.color || 'var(--green)' }}>
          {p.value}{typeof p.value === 'number' && p.name?.includes('s') ? 's' : ''}
        </p>
      ))}
    </div>
  )
}

function KpiCard({ icon: Icon, label, value, sub, color = 'var(--green)', accent }) {
  return (
    <div className="rounded-2xl p-5 relative overflow-hidden transition-all duration-300"
      style={{ background: 'var(--navy-2)', border: '1px solid var(--glass-border)' }}
      onMouseEnter={e => e.currentTarget.style.border = `1px solid ${color}30`}
      onMouseLeave={e => e.currentTarget.style.border = '1px solid var(--glass-border)'}>
      <div className="absolute top-0 right-0 w-24 h-24 rounded-full opacity-5 -translate-y-6 translate-x-6"
        style={{ background: color }} />
      <div className="w-9 h-9 rounded-xl flex items-center justify-center mb-3"
        style={{ background: `${color}18`, border: `1px solid ${color}30` }}>
        <Icon size={17} style={{ color }} />
      </div>
      <p className="text-xs font-medium mb-1" style={{ color: 'var(--text-muted)' }}>{label}</p>
      <p className="text-2xl font-bold" style={{ color: 'var(--text-primary)', letterSpacing: '-0.02em' }}>{value}</p>
      {sub && <p className="text-xs mt-1" style={{ color: 'var(--text-secondary)' }}>{sub}</p>}
    </div>
  )
}

export default function DashboardPage() {
  const { id } = useParams()
  const navigate = useNavigate()
  const [stats, setStats] = useState(null)
  const [match, setMatch] = useState(null)

  useEffect(() => {
    if (!id) return
    Promise.all([api.getMatchStats(id), api.getMatch(id)]).then(([s, m]) => {
      setStats(s)
      setMatch(m)
    })
  }, [id])

  if (!stats) return (
    <div className="p-8 flex items-center justify-center h-full">
      <div className="text-center">
        <div className="w-12 h-12 rounded-full mx-auto mb-4 flex items-center justify-center shimmer" />
        <p style={{ color: 'var(--text-muted)' }}>{id ? 'Chargement...' : 'Sélectionnez un match'}</p>
      </div>
    </div>
  )

  const phaseData = Object.entries(stats.phase_counts || {}).map(([k, v]) => ({
    name: PHASE_LABELS[k] || k,
    count: v,
    duration: Math.round(stats.phase_durations_seconds?.[k] || 0),
    fill: PHASE_COLORS[k] || '#334155',
  })).sort((a, b) => b.count - a.count)

  const possessionData = Object.entries(stats.possession_percent || {}).map(([k, v]) => ({
    name: k === 'home' ? match?.home_team || 'Domicile' : match?.away_team || 'Extérieur',
    value: v,
    fill: k === 'home' ? '#00e676' : '#00b0ff',
  }))

  const topPhase = phaseData[0]
  const topPossession = possessionData.sort((a, b) => b.value - a.value)[0]

  return (
    <div className="min-h-full p-8 overflow-auto" style={{ background: 'var(--navy)' }}>

      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center gap-4 mb-2">
          {id && (
            <button onClick={() => navigate(`/match/${id}/review`)}
              className="w-8 h-8 flex items-center justify-center rounded-lg transition-colors"
              style={{ color: 'var(--text-muted)' }}
              onMouseEnter={e => e.currentTarget.style.color = 'var(--text-primary)'}
              onMouseLeave={e => e.currentTarget.style.color = 'var(--text-muted)'}>
              <ArrowLeft size={17} />
            </button>
          )}
          <div>
            <p className="text-xs font-semibold tracking-widest" style={{ color: 'var(--green)' }}>STATISTIQUES</p>
            <h1 className="text-3xl font-bold" style={{ color: 'var(--text-primary)', letterSpacing: '-0.02em' }}>
              {match?.title || 'Dashboard'}
            </h1>
          </div>
          {match?.home_team && (
            <div className="ml-auto flex items-center gap-3 px-4 py-2 rounded-xl"
              style={{ background: 'var(--navy-2)', border: '1px solid var(--glass-border)' }}>
              <span className="font-semibold text-sm" style={{ color: 'var(--green)' }}>{match.home_team}</span>
              <span className="text-xs" style={{ color: 'var(--text-muted)' }}>vs</span>
              <span className="font-semibold text-sm" style={{ color: '#00b0ff' }}>{match.away_team}</span>
            </div>
          )}
        </div>
        <div className="h-px mt-4" style={{ background: 'linear-gradient(90deg, var(--green), rgba(0,176,255,0.5), transparent)' }} />
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <KpiCard icon={Layers} label="Segments" value={stats.total_segments} sub="phases analysées" color="var(--green)" />
        <KpiCard icon={Clock} label="Durée match" value={`${Math.round((stats.total_duration || 0) / 60)} min`} color="#00b0ff" />
        <KpiCard icon={TrendingUp} label="Phase dominante" value={topPhase?.name || '—'} sub={`${topPhase?.count || 0} occurrences`} color="#a855f7" />
        <KpiCard icon={Target} label="Équipe dominante" value={topPossession?.name || '—'} sub={`${topPossession?.value || 0}% possession`} color="#ffd600" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
        {/* Phase count bar chart */}
        <div className="rounded-2xl p-6" style={{ background: 'var(--navy-2)', border: '1px solid var(--glass-border)' }}>
          <h3 className="font-semibold mb-1" style={{ color: 'var(--text-primary)' }}>Phases par occurrence</h3>
          <p className="text-xs mb-5" style={{ color: 'var(--text-muted)' }}>Nombre de fois que chaque phase a été jouée</p>
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={phaseData} layout="vertical" margin={{ left: 8, right: 16 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" horizontal={false} />
              <XAxis type="number" stroke="#3d5070" fontSize={11} tickLine={false} />
              <YAxis type="category" dataKey="name" width={76} stroke="#3d5070" fontSize={11} tickLine={false} />
              <Tooltip content={<CustomTooltip />} cursor={{ fill: 'rgba(255,255,255,0.03)' }} />
              <Bar dataKey="count" radius={[0, 6, 6, 0]} maxBarSize={28}>
                {phaseData.map(entry => <Cell key={entry.name} fill={entry.fill} />)}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Possession pie */}
        <div className="rounded-2xl p-6" style={{ background: 'var(--navy-2)', border: '1px solid var(--glass-border)' }}>
          <h3 className="font-semibold mb-1" style={{ color: 'var(--text-primary)' }}>Possession du ballon</h3>
          <p className="text-xs mb-5" style={{ color: 'var(--text-muted)' }}>Répartition par équipe sur les segments validés</p>
          {possessionData.length === 0 ? (
            <div className="flex items-center justify-center h-48">
              <p className="text-sm text-center" style={{ color: 'var(--text-muted)' }}>
                Annotez la possession dans la revue<br />pour voir ce graphique
              </p>
            </div>
          ) : (
            <div className="flex items-center gap-6">
              <ResponsiveContainer width="55%" height={200}>
                <PieChart>
                  <Pie data={possessionData} dataKey="value" cx="50%" cy="50%"
                    innerRadius={55} outerRadius={80} paddingAngle={3}>
                    {possessionData.map(entry => (
                      <Cell key={entry.name} fill={entry.fill} />
                    ))}
                  </Pie>
                  <Tooltip content={<CustomTooltip />} />
                </PieChart>
              </ResponsiveContainer>
              <div className="space-y-3">
                {possessionData.map(d => (
                  <div key={d.name} className="flex items-center gap-3">
                    <div className="w-3 h-3 rounded-full" style={{ background: d.fill }} />
                    <div>
                      <p className="text-sm font-semibold" style={{ color: 'var(--text-primary)' }}>{d.name}</p>
                      <p className="text-2xl font-bold font-mono" style={{ color: d.fill }}>{d.value}%</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Duration bar */}
      <div className="rounded-2xl p-6" style={{ background: 'var(--navy-2)', border: '1px solid var(--glass-border)' }}>
        <h3 className="font-semibold mb-1" style={{ color: 'var(--text-primary)' }}>Temps par phase</h3>
        <p className="text-xs mb-5" style={{ color: 'var(--text-muted)' }}>Durée cumulée en secondes</p>
        <ResponsiveContainer width="100%" height={200}>
          <BarChart data={phaseData} margin={{ left: 0, right: 16 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" vertical={false} />
            <XAxis dataKey="name" stroke="#3d5070" fontSize={11} tickLine={false} />
            <YAxis stroke="#3d5070" fontSize={11} tickLine={false} tickFormatter={v => `${v}s`} />
            <Tooltip content={<CustomTooltip />} cursor={{ fill: 'rgba(255,255,255,0.03)' }} />
            <Bar dataKey="duration" radius={[6, 6, 0, 0]} maxBarSize={40}>
              {phaseData.map(entry => <Cell key={entry.name} fill={entry.fill} />)}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  )
}
