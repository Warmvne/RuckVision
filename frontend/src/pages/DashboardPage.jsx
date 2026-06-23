import { useState, useEffect, useRef } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { api } from '../api'
import {
  PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, Tooltip,
  ResponsiveContainer, CartesianGrid, AreaChart, Area,
} from 'recharts'
import { ArrowLeft, TrendingUp, Clock, Layers, Target } from 'lucide-react'
import ProgressRing from '../components/ProgressRing'
import Tilt3D from '../components/Tilt3D'

const PHASE_COLORS = {
  ruck: '#f97316', scrum: '#3b82f6', lineout: '#a855f7', open_play: '#00ff88',
  try: '#ffc640', conversion: '#fde047', penalty: '#ef4444', kickoff: '#00c8ff', unknown: '#1a3357',
}
const PHASE_LABELS = {
  ruck: 'Ruck', scrum: 'Mêlée', lineout: 'Touche', open_play: 'Jeu ouvert',
  try: 'Essai', conversion: 'Transfo', penalty: 'Pénalité', kickoff: 'Envoi', unknown: 'Inconnu',
}

const CustomTooltip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null
  return (
    <div style={{
      padding: '10px 14px', borderRadius: 12,
      background: 'var(--navy-3)', border: '1px solid var(--glass-border)',
      boxShadow: '0 12px 32px rgba(0,0,0,0.6)',
      fontSize: 13, color: 'var(--text-primary)',
    }}>
      <p style={{ fontWeight: 700, marginBottom: 4 }}>{label}</p>
      {payload.map(p => (
        <p key={p.name} style={{ color: p.fill || 'var(--green)', fontFamily: 'JetBrains Mono, monospace' }}>
          {p.value}
        </p>
      ))}
    </div>
  )
}

function KpiCard({ icon: Icon, label, value, sub, color = 'var(--green)', index = 0 }) {
  const ref = useRef(null)
  return (
    <Tilt3D intensity={6} className={`fade-in-delay-${index + 1}`}
      style={{
        borderRadius: 20, padding: '22px 20px',
        background: 'var(--navy-2)', border: '1px solid var(--glass-border)',
        position: 'relative', overflow: 'hidden',
      }}>
      {/* Background blob */}
      <div style={{
        position: 'absolute', top: -20, right: -20,
        width: 100, height: 100, borderRadius: '50%',
        background: color, opacity: 0.04,
        filter: 'blur(20px)',
      }} />
      <div style={{
        width: 38, height: 38, borderRadius: 10, marginBottom: 14,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        background: `${color}15`, border: `1px solid ${color}25`,
      }}>
        <Icon size={16} style={{ color }} />
      </div>
      <p style={{ fontSize: 11, fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 6 }}>
        {label}
      </p>
      <p style={{ fontSize: 26, fontWeight: 900, color: 'var(--text-primary)', letterSpacing: '-0.03em', lineHeight: 1 }}>
        {value}
      </p>
      {sub && <p style={{ fontSize: 11, color: 'var(--text-secondary)', marginTop: 6 }}>{sub}</p>}
    </Tilt3D>
  )
}

export default function DashboardPage() {
  const { id } = useParams()
  const navigate = useNavigate()
  const [stats, setStats] = useState(null)
  const [match, setMatch] = useState(null)

  useEffect(() => {
    if (!id) return
    Promise.all([api.getMatchStats(id), api.getMatch(id)]).then(([s, m]) => { setStats(s); setMatch(m) })
  }, [id])

  if (!stats) return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%', flexDirection: 'column', gap: 12 }}>
      <div className="shimmer" style={{ width: 120, height: 24 }} />
      <div className="shimmer" style={{ width: 80, height: 14 }} />
    </div>
  )

  const phaseData = Object.entries(stats.phase_counts || {}).map(([k, v]) => ({
    name: PHASE_LABELS[k] || k, count: v,
    duration: Math.round(stats.phase_durations_seconds?.[k] || 0),
    fill: PHASE_COLORS[k] || '#1a3357',
  })).sort((a, b) => b.count - a.count)

  const possessionData = Object.entries(stats.possession_percent || {}).map(([k, v]) => ({
    name: k === 'home' ? match?.home_team || 'Domicile' : match?.away_team || 'Extérieur',
    value: v, fill: k === 'home' ? 'var(--green)' : 'var(--blue)',
  }))

  const topPhase = phaseData[0]
  const topPoss = possessionData.sort((a, b) => b.value - a.value)[0]

  return (
    <div style={{ minHeight: '100%', padding: '40px 36px', background: 'var(--navy)' }}>

      {/* ── Header ── */}
      <div style={{ marginBottom: 36 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 14, marginBottom: 4 }}>
          {id && (
            <button onClick={() => navigate(`/match/${id}/review`)}
              style={{
                width: 34, height: 34, borderRadius: 10,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                background: 'var(--glass)', border: '1px solid var(--glass-border)',
                color: 'var(--text-muted)', cursor: 'pointer',
              }}
              onMouseEnter={e => e.currentTarget.style.color = 'var(--text-primary)'}
              onMouseLeave={e => e.currentTarget.style.color = 'var(--text-muted)'}>
              <ArrowLeft size={16} />
            </button>
          )}
          <div>
            <p style={{ fontSize: 10, fontWeight: 700, letterSpacing: '0.15em', color: 'var(--green)', textTransform: 'uppercase' }}>
              Statistiques
            </p>
            <h1 className="text-hero text-chrome">{match?.title || 'Dashboard'}</h1>
          </div>
          {match?.home_team && (
            <div style={{
              marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: 12,
              padding: '8px 18px', borderRadius: 12,
              background: 'var(--navy-2)', border: '1px solid var(--glass-border)',
            }}>
              <span style={{ fontWeight: 700, fontSize: 14, color: 'var(--green)' }}>{match.home_team}</span>
              <span style={{ color: 'var(--text-muted)', fontSize: 12 }}>vs</span>
              <span style={{ fontWeight: 700, fontSize: 14, color: 'var(--blue)' }}>{match.away_team}</span>
            </div>
          )}
        </div>
        <div style={{ height: 1, marginTop: 16, background: 'linear-gradient(90deg, var(--green), var(--blue), transparent)' }} />
      </div>

      {/* ── KPIs ── */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 16, marginBottom: 24 }}>
        <KpiCard icon={Layers}     label="Segments"        value={stats.total_segments} sub="phases analysées"     color="var(--green)" index={0} />
        <KpiCard icon={Clock}      label="Durée"           value={`${Math.round((stats.total_duration||0)/60)} min`} color="var(--blue)"  index={1} />
        <KpiCard icon={TrendingUp} label="Phase dominante" value={topPhase?.name||'—'}  sub={`${topPhase?.count||0}×`} color="#a855f7" index={2} />
        <KpiCard icon={Target}     label="Équipe dom."     value={topPoss?.name||'—'}   sub={`${topPoss?.value||0}%`} color="var(--gold)" index={3} />
      </div>

      {/* ── Charts row ── */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20, marginBottom: 20 }}>

        {/* Bar chart — phases */}
        <div style={{ borderRadius: 20, padding: 24, background: 'var(--navy-2)', border: '1px solid var(--glass-border)' }}>
          <p style={{ fontWeight: 700, fontSize: 15, color: 'var(--text-primary)', marginBottom: 2, letterSpacing: '-0.01em' }}>
            Distribution des phases
          </p>
          <p style={{ fontSize: 12, color: 'var(--text-muted)', marginBottom: 20 }}>Occurrences par type</p>
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={phaseData} layout="vertical" margin={{ left: 0, right: 16 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.03)" horizontal={false} />
              <XAxis type="number" stroke="#1a3357" fontSize={11} tickLine={false} axisLine={false} />
              <YAxis type="category" dataKey="name" width={72} stroke="#1a3357" fontSize={11} tickLine={false} axisLine={false} />
              <Tooltip content={<CustomTooltip />} cursor={{ fill: 'rgba(255,255,255,0.02)' }} />
              <Bar dataKey="count" radius={[0, 8, 8, 0]} maxBarSize={22}>
                {phaseData.map(e => <Cell key={e.name} fill={e.fill} />)}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Possession donut + gamification rings */}
        <div style={{ borderRadius: 20, padding: 24, background: 'var(--navy-2)', border: '1px solid var(--glass-border)' }}>
          <p style={{ fontWeight: 700, fontSize: 15, color: 'var(--text-primary)', marginBottom: 2, letterSpacing: '-0.01em' }}>
            Possession
          </p>
          <p style={{ fontSize: 12, color: 'var(--text-muted)', marginBottom: 20 }}>Répartition par équipe</p>
          {possessionData.length === 0 ? (
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: 180, gap: 12 }}>
              <p style={{ fontSize: 12, color: 'var(--text-muted)', textAlign: 'center' }}>
                Annotez la possession<br />dans la revue vidéo
              </p>
            </div>
          ) : (
            <div style={{ display: 'flex', alignItems: 'center', gap: 24 }}>
              <ResponsiveContainer width="50%" height={180}>
                <PieChart>
                  <Pie data={possessionData} dataKey="value" cx="50%" cy="50%"
                    innerRadius={50} outerRadius={72} paddingAngle={4} strokeWidth={0}>
                    {possessionData.map(e => <Cell key={e.name} fill={e.fill} />)}
                  </Pie>
                  <Tooltip content={<CustomTooltip />} />
                </PieChart>
              </ResponsiveContainer>
              <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 16 }}>
                {possessionData.map(d => (
                  <div key={d.name} style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                    <ProgressRing pct={d.value} size={52} stroke={4} color={d.fill} />
                    <div>
                      <p style={{ fontSize: 12, color: 'var(--text-secondary)' }}>{d.name}</p>
                      <p style={{ fontSize: 22, fontWeight: 900, color: d.fill, fontFamily: 'JetBrains Mono, monospace', letterSpacing: '-0.02em' }}>
                        {d.value}%
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* ── Duration area chart ── */}
      <div style={{ borderRadius: 20, padding: 24, background: 'var(--navy-2)', border: '1px solid var(--glass-border)' }}>
        <p style={{ fontWeight: 700, fontSize: 15, color: 'var(--text-primary)', marginBottom: 2, letterSpacing: '-0.01em' }}>
          Temps par phase
        </p>
        <p style={{ fontSize: 12, color: 'var(--text-muted)', marginBottom: 20 }}>Durée cumulée (secondes)</p>
        <ResponsiveContainer width="100%" height={200}>
          <BarChart data={phaseData} margin={{ left: 0, right: 16, bottom: 0 }}>
            <defs>
              {phaseData.map(e => (
                <linearGradient key={e.name} id={`grad-${e.name}`} x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor={e.fill} stopOpacity={1} />
                  <stop offset="100%" stopColor={e.fill} stopOpacity={0.4} />
                </linearGradient>
              ))}
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.03)" vertical={false} />
            <XAxis dataKey="name" stroke="#1a3357" fontSize={11} tickLine={false} axisLine={false} />
            <YAxis stroke="#1a3357" fontSize={11} tickLine={false} axisLine={false} tickFormatter={v => `${v}s`} />
            <Tooltip content={<CustomTooltip />} cursor={{ fill: 'rgba(255,255,255,0.02)' }} />
            <Bar dataKey="duration" radius={[8,8,0,0]} maxBarSize={44}>
              {phaseData.map(e => <Cell key={e.name} fill={`url(#grad-${e.name})`} />)}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  )
}
