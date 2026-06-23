import { useState, useEffect } from 'react'
import { api } from '../api'
import { Users, Trophy, Activity, Target } from 'lucide-react'
import Tilt3D from '../components/Tilt3D'
import ProgressRing from '../components/ProgressRing'

const PHASE_COLORS = {
  ruck: '#f97316', scrum: '#3b82f6', lineout: '#a855f7', open_play: '#00ff88',
  try: '#ffc640', conversion: '#fde047', penalty: '#ef4444', kickoff: '#00c8ff', unknown: '#1a3357',
}

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
    <div style={{ minHeight: '100%', padding: '40px 36px', background: 'var(--navy)' }}>

      {/* Header */}
      <div style={{ marginBottom: 36 }}>
        <p style={{ fontSize: 10, fontWeight: 700, letterSpacing: '0.15em', color: 'var(--green)', textTransform: 'uppercase', marginBottom: 4 }}>
          Gestion
        </p>
        <h1 className="text-hero text-chrome">Équipes</h1>
        <div style={{ height: 1, marginTop: 16, background: 'linear-gradient(90deg, var(--green), var(--blue), transparent)' }} />
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '280px 1fr', gap: 24 }}>

        {/* Team list */}
        <div>
          <p style={{ fontSize: 10, fontWeight: 700, letterSpacing: '0.12em', color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: 12 }}>
            {teams.length} équipe{teams.length !== 1 ? 's' : ''}
          </p>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {teams.map((t, i) => (
              <button key={t.id} onClick={() => handleSelect(t)}
                className={`fade-in-delay-${Math.min(i+1,3)}`}
                style={{
                  display: 'flex', alignItems: 'center', gap: 12,
                  padding: '12px 14px', borderRadius: 14, cursor: 'pointer',
                  background: selected?.id === t.id ? 'rgba(0,255,136,0.05)' : 'var(--navy-2)',
                  border: `1px solid ${selected?.id === t.id ? 'rgba(0,255,136,0.25)' : 'var(--glass-border)'}`,
                  boxShadow: selected?.id === t.id ? '0 0 20px rgba(0,255,136,0.07)' : 'none',
                  transition: 'all 0.2s ease', textAlign: 'left',
                }}>
                <div style={{
                  width: 38, height: 38, borderRadius: 10, flexShrink: 0,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontWeight: 800, fontSize: 13,
                  background: t.color + '18', color: t.color, border: `1px solid ${t.color}35`,
                }}>
                  {t.short_name?.slice(0,2) || '??'}
                </div>
                <div style={{ minWidth: 0 }}>
                  <p style={{ fontWeight: 600, fontSize: 14, color: 'var(--text-primary)' }}>{t.name}</p>
                  <p style={{ fontSize: 11, color: 'var(--text-muted)', fontFamily: 'JetBrains Mono, monospace' }}>{t.short_name}</p>
                </div>
                {selected?.id === t.id && (
                  <div className="pulse-dot" style={{
                    marginLeft: 'auto', width: 7, height: 7, borderRadius: '50%',
                    background: 'var(--green)', flexShrink: 0,
                  }} />
                )}
              </button>
            ))}

            {teams.length === 0 && (
              <div style={{
                borderRadius: 16, padding: '48px 24px', textAlign: 'center',
                border: '2px dashed var(--navy-4)',
              }}>
                <Users size={28} style={{ color: 'var(--text-muted)', marginBottom: 10, display: 'block', margin: '0 auto 10px' }} />
                <p style={{ fontSize: 13, color: 'var(--text-muted)' }}>Importez des matchs<br />pour créer des équipes</p>
              </div>
            )}
          </div>
        </div>

        {/* Stats panel */}
        <div>
          {stats && selected ? (
            <div className="fade-in">
              {/* Team hero */}
              <div style={{
                display: 'flex', alignItems: 'center', gap: 16,
                padding: '20px 24px', borderRadius: 20, marginBottom: 20,
                background: 'var(--navy-2)', border: '1px solid var(--glass-border)',
                position: 'relative', overflow: 'hidden',
              }}>
                <div style={{
                  position: 'absolute', top: -30, right: -30,
                  width: 120, height: 120, borderRadius: '50%',
                  background: selected.color, opacity: 0.04, filter: 'blur(30px)',
                }} />
                <div style={{
                  width: 56, height: 56, borderRadius: 16, flexShrink: 0,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontWeight: 900, fontSize: 18,
                  background: selected.color + '20', color: selected.color,
                  border: `2px solid ${selected.color}40`,
                  boxShadow: `0 0 24px ${selected.color}20`,
                }}>
                  {selected.short_name?.slice(0,2)}
                </div>
                <div>
                  <h2 style={{ fontSize: 22, fontWeight: 800, color: 'var(--text-primary)', letterSpacing: '-0.02em' }}>
                    {selected.name}
                  </h2>
                  <p style={{ fontSize: 13, color: 'var(--text-secondary)', marginTop: 2 }}>
                    {stats.match_count} match{stats.match_count !== 1 ? 's' : ''} enregistré{stats.match_count !== 1 ? 's' : ''}
                  </p>
                </div>
              </div>

              {/* KPI cards */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 14, marginBottom: 20 }}>
                {[
                  { icon: Trophy,   label: 'Matchs',          value: stats.match_count,                                  color: 'var(--gold)' },
                  { icon: Activity, label: 'Possession moy.',  value: `${Math.round(stats.avg_possession_seconds/60)} min`, color: 'var(--green)' },
                  { icon: Target,   label: 'Total phases',     value: totalPhases,                                        color: 'var(--blue)' },
                ].map(({ icon: Icon, label, value, color }, i) => (
                  <Tilt3D key={label} intensity={7} className={`fade-in-delay-${i+1}`}
                    style={{
                      borderRadius: 16, padding: '18px 16px',
                      background: 'var(--navy-2)', border: '1px solid var(--glass-border)',
                      position: 'relative', overflow: 'hidden',
                    }}>
                    <div style={{
                      position: 'absolute', top: -20, right: -20,
                      width: 80, height: 80, borderRadius: '50%',
                      background: color, opacity: 0.05, filter: 'blur(16px)',
                    }} />
                    <Icon size={16} style={{ color, marginBottom: 10 }} />
                    <p style={{ fontSize: 11, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 4 }}>
                      {label}
                    </p>
                    <p style={{ fontSize: 24, fontWeight: 900, color: 'var(--text-primary)', letterSpacing: '-0.03em' }}>
                      {value}
                    </p>
                  </Tilt3D>
                ))}
              </div>

              {/* Phase bars */}
              <div style={{ borderRadius: 20, padding: 24, background: 'var(--navy-2)', border: '1px solid var(--glass-border)' }}>
                <p style={{ fontWeight: 700, fontSize: 15, color: 'var(--text-primary)', marginBottom: 20, letterSpacing: '-0.01em' }}>
                  Répartition des phases
                </p>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                  {Object.entries(stats.phase_totals)
                    .sort((a, b) => b[1] - a[1])
                    .map(([phase, count]) => {
                      const color = PHASE_COLORS[phase] || 'var(--text-muted)'
                      const pct = Math.round((count / maxPhase) * 100)
                      return (
                        <div key={phase} style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                          <div style={{ width: 8, height: 8, borderRadius: '50%', background: color, flexShrink: 0 }} />
                          <span style={{ fontSize: 13, color: 'var(--text-secondary)', width: 90, textTransform: 'capitalize' }}>
                            {phase.replace('_', ' ')}
                          </span>
                          <div style={{ flex: 1, height: 6, borderRadius: 4, background: 'var(--navy-3)', overflow: 'hidden' }}>
                            <div style={{
                              height: '100%', borderRadius: 4,
                              width: `${pct}%`,
                              background: `linear-gradient(90deg, ${color}, ${color}80)`,
                              boxShadow: `0 0 8px ${color}40`,
                              transition: 'width 0.8s cubic-bezier(0.4,0,0.2,1)',
                            }} />
                          </div>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 8, width: 60, justifyContent: 'flex-end' }}>
                            <span style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: 13, fontWeight: 600, color: 'var(--text-primary)' }}>
                              {count}
                            </span>
                          </div>
                        </div>
                      )
                    })}
                </div>
              </div>
            </div>
          ) : (
            <div style={{
              display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
              height: 280, borderRadius: 20, border: '2px dashed var(--navy-4)',
            }}>
              <Users size={32} style={{ color: 'var(--text-muted)', marginBottom: 12 }} />
              <p style={{ fontSize: 14, color: 'var(--text-muted)' }}>Sélectionnez une équipe</p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
