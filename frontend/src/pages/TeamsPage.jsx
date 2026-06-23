import { useState, useEffect } from 'react'
import { api } from '../api'
import { Users, Trophy, Activity, Target } from 'lucide-react'

export default function TeamsPage() {
  const [teams, setTeams] = useState([])
  const [selected, setSelected] = useState(null)
  const [stats, setStats] = useState(null)

  useEffect(() => { api.getTeams().then(setTeams) }, [])

  const handleSelect = async (team) => {
    setSelected(team)
    const s = await api.getTeamStats(team.id)
    setStats(s)
  }

  const totalPhases = stats ? Object.values(stats.phase_totals).reduce((a, b) => a + b, 0) : 0
  const maxPhase = stats ? Math.max(...Object.values(stats.phase_totals), 1) : 1

  return (
    <div className="min-h-full p-8" style={{ background: 'var(--navy)' }}>

      {/* Header */}
      <div className="mb-8">
        <p className="text-xs font-semibold tracking-widest mb-2" style={{ color: 'var(--green)' }}>GESTION</p>
        <h1 className="text-4xl font-bold" style={{ color: 'var(--text-primary)', letterSpacing: '-0.02em' }}>
          Équipes
        </h1>
        <div className="h-px mt-5" style={{ background: 'linear-gradient(90deg, var(--green), rgba(0,176,255,0.5), transparent)' }} />
      </div>

      <div className="grid grid-cols-12 gap-6">

        {/* Team list */}
        <div className="col-span-4">
          <p className="text-xs font-semibold tracking-widest mb-4" style={{ color: 'var(--text-muted)' }}>
            {teams.length} ÉQUIPE{teams.length !== 1 ? 'S' : ''}
          </p>
          <div className="space-y-2">
            {teams.map(t => (
              <button key={t.id} onClick={() => handleSelect(t)}
                className="w-full text-left px-4 py-3.5 rounded-xl transition-all duration-200"
                style={{
                  background: selected?.id === t.id ? 'rgba(0,230,118,0.06)' : 'var(--navy-2)',
                  border: `1px solid ${selected?.id === t.id ? 'rgba(0,230,118,0.3)' : 'var(--glass-border)'}`,
                  boxShadow: selected?.id === t.id ? '0 0 16px rgba(0,230,118,0.08)' : 'none',
                }}>
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-xl flex items-center justify-center font-bold text-sm"
                    style={{ background: t.color + '22', color: t.color, border: `1px solid ${t.color}40` }}>
                    {t.short_name?.slice(0, 2) || t.name?.slice(0, 2)}
                  </div>
                  <div>
                    <p className="font-semibold text-sm" style={{ color: 'var(--text-primary)' }}>{t.name}</p>
                    <p className="text-xs font-mono" style={{ color: 'var(--text-muted)' }}>{t.short_name}</p>
                  </div>
                  {selected?.id === t.id && (
                    <div className="ml-auto w-1.5 h-1.5 rounded-full" style={{ background: 'var(--green)' }} />
                  )}
                </div>
              </button>
            ))}

            {teams.length === 0 && (
              <div className="flex flex-col items-center justify-center py-12 rounded-xl"
                style={{ border: '2px dashed var(--navy-4)' }}>
                <Users size={28} style={{ color: 'var(--text-muted)', marginBottom: 12 }} />
                <p className="text-sm" style={{ color: 'var(--text-muted)' }}>
                  Importez des matchs pour créer des équipes
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Stats panel */}
        <div className="col-span-8">
          {stats && selected ? (
            <div className="fade-in">
              {/* Team header */}
              <div className="flex items-center gap-4 mb-6 p-5 rounded-2xl"
                style={{ background: 'var(--navy-2)', border: '1px solid var(--glass-border)' }}>
                <div className="w-14 h-14 rounded-2xl flex items-center justify-center text-2xl font-bold"
                  style={{ background: selected.color + '20', color: selected.color, border: `2px solid ${selected.color}40` }}>
                  {selected.short_name?.slice(0, 2)}
                </div>
                <div>
                  <h2 className="text-2xl font-bold" style={{ color: 'var(--text-primary)', letterSpacing: '-0.02em' }}>
                    {selected.name}
                  </h2>
                  <p className="text-sm mt-0.5" style={{ color: 'var(--text-secondary)' }}>
                    {stats.match_count} match{stats.match_count !== 1 ? 's' : ''} enregistré{stats.match_count !== 1 ? 's' : ''}
                  </p>
                </div>
              </div>

              {/* KPIs */}
              <div className="grid grid-cols-3 gap-4 mb-6">
                {[
                  { icon: Trophy, label: 'Matchs', value: stats.match_count, color: '#ffd600' },
                  { icon: Activity, label: 'Possession moy.', value: `${Math.round(stats.avg_possession_seconds / 60)} min`, color: 'var(--green)' },
                  { icon: Target, label: 'Total phases', value: totalPhases, color: '#00b0ff' },
                ].map(({ icon: Icon, label, value, color }) => (
                  <div key={label} className="p-4 rounded-xl relative overflow-hidden"
                    style={{ background: 'var(--navy-2)', border: '1px solid var(--glass-border)' }}>
                    <div className="absolute top-0 right-0 w-16 h-16 rounded-full opacity-5 -translate-y-4 translate-x-4"
                      style={{ background: color }} />
                    <Icon size={16} style={{ color, marginBottom: 8 }} />
                    <p className="text-xs" style={{ color: 'var(--text-muted)' }}>{label}</p>
                    <p className="text-2xl font-bold mt-1" style={{ color: 'var(--text-primary)' }}>{value}</p>
                  </div>
                ))}
              </div>

              {/* Phase breakdown */}
              <div className="p-5 rounded-2xl" style={{ background: 'var(--navy-2)', border: '1px solid var(--glass-border)' }}>
                <h3 className="font-semibold mb-4" style={{ color: 'var(--text-primary)' }}>Répartition des phases</h3>
                <div className="space-y-3">
                  {Object.entries(stats.phase_totals)
                    .sort((a, b) => b[1] - a[1])
                    .map(([phase, count]) => (
                      <div key={phase} className="flex items-center gap-3">
                        <div className="w-2 h-2 rounded-full shrink-0"
                          style={{ background: { ruck: '#f97316', scrum: '#3b82f6', lineout: '#a855f7', open_play: '#00e676', try: '#ffd600', penalty: '#ef4444', kickoff: '#06b6d4', unknown: '#334155' }[phase] || '#334155' }} />
                        <span className="text-sm w-28 capitalize" style={{ color: 'var(--text-secondary)' }}>
                          {phase.replace('_', ' ')}
                        </span>
                        <div className="flex-1 h-1.5 rounded-full overflow-hidden" style={{ background: 'var(--navy-3)' }}>
                          <div className="h-full rounded-full transition-all duration-700"
                            style={{
                              width: `${(count / maxPhase) * 100}%`,
                              background: `linear-gradient(90deg, var(--green), #00b0ff)`,
                            }} />
                        </div>
                        <span className="font-mono text-sm w-8 text-right font-semibold"
                          style={{ color: 'var(--text-primary)' }}>{count}</span>
                      </div>
                    ))}
                </div>
              </div>
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center h-64 rounded-2xl"
              style={{ border: '2px dashed var(--navy-4)' }}>
              <Users size={32} style={{ color: 'var(--text-muted)', marginBottom: 12 }} />
              <p style={{ color: 'var(--text-muted)' }}>Sélectionnez une équipe</p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
