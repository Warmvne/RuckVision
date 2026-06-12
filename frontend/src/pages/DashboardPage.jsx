import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { api } from '../api'
import {
  PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, Tooltip,
  ResponsiveContainer, Legend
} from 'recharts'
import { ArrowLeft } from 'lucide-react'

const PHASE_COLORS = {
  ruck: '#f97316', scrum: '#3b82f6', lineout: '#a855f7',
  open_play: '#22c55e', try: '#eab308', conversion: '#fde047',
  penalty: '#ef4444', kickoff: '#06b6d4', unknown: '#6b7280'
}
const PHASE_LABELS = {
  ruck: 'Ruck', scrum: 'Mêlée', lineout: 'Touche', open_play: 'Jeu ouvert',
  try: 'Essai', conversion: 'Transfo', penalty: 'Pénalité', kickoff: 'Envoi', unknown: 'Inconnu'
}

function StatCard({ label, value, sub }) {
  return (
    <div className="bg-gray-900 rounded-2xl p-5 border border-gray-800">
      <p className="text-gray-500 text-sm">{label}</p>
      <p className="text-3xl font-bold text-white mt-1">{value}</p>
      {sub && <p className="text-gray-600 text-xs mt-1">{sub}</p>}
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
    <div className="p-8 text-gray-500">
      {id ? 'Chargement des stats...' : 'Sélectionnez un match'}
    </div>
  )

  const phaseData = Object.entries(stats.phase_counts || {}).map(([k, v]) => ({
    name: PHASE_LABELS[k] || k,
    value: v,
    duration: stats.phase_durations_seconds?.[k] || 0,
    color: PHASE_COLORS[k] || '#6b7280',
  })).sort((a, b) => b.value - a.value)

  const possessionData = Object.entries(stats.possession_percent || {}).map(([k, v]) => ({
    name: k === 'home' ? match?.home_team || 'Domicile' : match?.away_team || 'Extérieur',
    value: v,
    color: k === 'home' ? '#1a5c2a' : '#1e3a8a',
  }))

  return (
    <div className="p-8 overflow-auto">
      <div className="flex items-center gap-4 mb-8">
        {id && (
          <button onClick={() => navigate(`/match/${id}/review`)} className="text-gray-400 hover:text-white">
            <ArrowLeft size={18} />
          </button>
        )}
        <h1 className="text-2xl font-bold text-white">
          {match ? `${match.title}` : 'Dashboard'}
        </h1>
        {match?.home_team && (
          <span className="text-gray-500 text-sm">{match.home_team} vs {match.away_team}</span>
        )}
      </div>

      {/* KPI cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
        <StatCard label="Segments analysés" value={stats.total_segments} />
        <StatCard
          label="Durée match"
          value={`${Math.round((stats.total_duration || 0) / 60)} min`}
        />
        <StatCard
          label="Phase dominante"
          value={phaseData[0]?.name || '-'}
          sub={`${phaseData[0]?.value || 0} occurrences`}
        />
        <StatCard
          label="Possession dominante"
          value={possessionData.length ? possessionData.sort((a, b) => b.value - a.value)[0]?.name : '-'}
          sub={`${possessionData[0]?.value || 0}%`}
        />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
        {/* Phase distribution */}
        <div className="bg-gray-900 rounded-2xl p-6 border border-gray-800">
          <h3 className="text-white font-semibold mb-4">Distribution des phases</h3>
          <ResponsiveContainer width="100%" height={240}>
            <BarChart data={phaseData} layout="vertical">
              <XAxis type="number" stroke="#6b7280" fontSize={11} />
              <YAxis type="category" dataKey="name" width={80} stroke="#6b7280" fontSize={11} />
              <Tooltip
                contentStyle={{ background: '#111827', border: '1px solid #374151', borderRadius: 8 }}
                labelStyle={{ color: '#fff' }}
              />
              <Bar dataKey="value" radius={4}>
                {phaseData.map((entry) => (
                  <Cell key={entry.name} fill={entry.color} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Possession pie */}
        <div className="bg-gray-900 rounded-2xl p-6 border border-gray-800">
          <h3 className="text-white font-semibold mb-4">Possession du ballon</h3>
          {possessionData.length === 0 ? (
            <p className="text-gray-500 text-sm">Pas de données de possession (annoter les segments)</p>
          ) : (
            <ResponsiveContainer width="100%" height={240}>
              <PieChart>
                <Pie data={possessionData} dataKey="value" nameKey="name" cx="50%" cy="50%"
                  outerRadius={90} label={({ name, value }) => `${name} ${value}%`}>
                  {possessionData.map((entry) => (
                    <Cell key={entry.name} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip contentStyle={{ background: '#111827', border: '1px solid #374151' }} />
              </PieChart>
            </ResponsiveContainer>
          )}
        </div>
      </div>

      {/* Phase duration breakdown */}
      <div className="bg-gray-900 rounded-2xl p-6 border border-gray-800">
        <h3 className="text-white font-semibold mb-4">Temps par phase (secondes)</h3>
        <ResponsiveContainer width="100%" height={220}>
          <BarChart data={phaseData}>
            <XAxis dataKey="name" stroke="#6b7280" fontSize={11} />
            <YAxis stroke="#6b7280" fontSize={11} />
            <Tooltip
              contentStyle={{ background: '#111827', border: '1px solid #374151', borderRadius: 8 }}
              formatter={(v) => [`${v}s`, 'Durée']}
            />
            <Bar dataKey="duration" radius={4}>
              {phaseData.map((entry) => (
                <Cell key={entry.name} fill={entry.color} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  )
}
