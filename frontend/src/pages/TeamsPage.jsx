import { useState, useEffect } from 'react'
import { api } from '../api'
import { Users, Trophy, Activity, Target } from 'lucide-react'
import Tilt3D from '../components/Tilt3D'
import ProgressRing from '../components/ProgressRing'

const PC = { ruck:'#f97316', scrum:'#38bdf8', lineout:'#a78bfa', open_play:'#00e5a0', try:'#fbbf24', conversion:'#fde68a', penalty:'#f87171', kickoff:'#00c8ff', unknown:'var(--bg-4)' }

export default function TeamsPage() {
  const [teams, setTeams] = useState([])
  const [sel, setSel]     = useState(null)
  const [stats, setStats] = useState(null)

  useEffect(() => { api.getTeams().then(setTeams) }, [])

  const pick = async t => { setSel(t); setStats(await api.getTeamStats(t.id)) }

  const total   = stats ? Object.values(stats.phase_totals).reduce((a,b)=>a+b,0) : 0
  const maxPhase= stats ? Math.max(...Object.values(stats.phase_totals),1) : 1

  return (
    <div style={{ minHeight:'100%', padding:'36px 32px', background:'var(--bg)' }}>

      <div style={{ marginBottom:32 }}>
        <p style={{ fontSize:10, fontWeight:700, letterSpacing:'0.15em', color:'var(--green)', textTransform:'uppercase', marginBottom:4 }}>Gestion</p>
        <h1 className="text-hero text-chrome">Équipes</h1>
        <div style={{ height:1, marginTop:14, background:'linear-gradient(90deg, var(--green), var(--blue), transparent)' }} />
      </div>

      <div style={{ display:'grid', gridTemplateColumns:'260px 1fr', gap:22 }}>

        {/* List */}
        <div>
          <p style={{ fontSize:10, fontWeight:700, letterSpacing:'0.12em', color:'var(--t3)', textTransform:'uppercase', marginBottom:12 }}>
            {teams.length} équipe{teams.length!==1?'s':''}
          </p>
          <div style={{ display:'flex', flexDirection:'column', gap:7 }}>
            {teams.map((t,i) => (
              <button key={t.id} onClick={()=>pick(t)} className={`fade-in-delay-${Math.min(i+1,3)}`}
                style={{
                  display:'flex', alignItems:'center', gap:11,
                  padding:'12px 13px', borderRadius:13, cursor:'pointer', textAlign:'left',
                  background: sel?.id===t.id ? 'rgba(0,229,160,0.06)' : 'var(--bg-2)',
                  border:`1px solid ${sel?.id===t.id ? 'rgba(0,229,160,0.3)' : 'var(--border)'}`,
                  boxShadow: sel?.id===t.id ? '0 0 18px var(--green-glow)' : 'none',
                  transition:'all 0.2s',
                }}>
                <div style={{ width:38, height:38, borderRadius:10, flexShrink:0, display:'flex', alignItems:'center', justifyContent:'center', fontWeight:800, fontSize:13, background:`${t.color}1a`, color:t.color, border:`1px solid ${t.color}35` }}>
                  {t.short_name?.slice(0,2)||'??'}
                </div>
                <div style={{ minWidth:0 }}>
                  <p style={{ fontWeight:600, fontSize:14, color:'var(--t1)' }}>{t.name}</p>
                  <p style={{ fontSize:11, color:'var(--t3)', fontFamily:'JetBrains Mono,monospace' }}>{t.short_name}</p>
                </div>
                {sel?.id===t.id && (
                  <div className="pulse-dot" style={{ marginLeft:'auto', width:7, height:7, borderRadius:'50%', background:'var(--green)', flexShrink:0 }} />
                )}
              </button>
            ))}
            {teams.length===0 && (
              <div style={{ borderRadius:14, padding:'44px 20px', textAlign:'center', border:'2px dashed var(--bg-4)' }}>
                <Users size={26} style={{ color:'var(--t3)', display:'block', margin:'0 auto 10px' }} />
                <p style={{ fontSize:13, color:'var(--t3)' }}>Importez des matchs<br/>pour créer des équipes</p>
              </div>
            )}
          </div>
        </div>

        {/* Stats */}
        <div>
          {stats && sel ? (
            <div className="fade-in">
              {/* Team hero */}
              <div style={{ display:'flex', alignItems:'center', gap:14, padding:'18px 20px', borderRadius:18, marginBottom:18, background:'var(--bg-2)', border:'1px solid var(--border)', position:'relative', overflow:'hidden' }}>
                <div style={{ position:'absolute', top:-30, right:-30, width:100, height:100, borderRadius:'50%', background:sel.color, opacity:0.06, filter:'blur(28px)' }} />
                <div style={{ width:52, height:52, borderRadius:14, display:'flex', alignItems:'center', justifyContent:'center', fontWeight:900, fontSize:17, flexShrink:0, background:`${sel.color}1a`, color:sel.color, border:`2px solid ${sel.color}40`, boxShadow:`0 0 20px ${sel.color}20` }}>
                  {sel.short_name?.slice(0,2)}
                </div>
                <div>
                  <h2 style={{ fontSize:20, fontWeight:800, color:'var(--t1)', letterSpacing:'-0.02em' }}>{sel.name}</h2>
                  <p style={{ fontSize:13, color:'var(--t2)', marginTop:2 }}>{stats.match_count} match{stats.match_count!==1?'s':''} enregistré{stats.match_count!==1?'s':''}</p>
                </div>
              </div>

              {/* KPI trio */}
              <div style={{ display:'grid', gridTemplateColumns:'repeat(3,1fr)', gap:12, marginBottom:18 }}>
                {[
                  { icon:Trophy,   label:'Matchs',         value:stats.match_count,                                   color:'var(--gold)' },
                  { icon:Activity, label:'Possession moy.', value:`${Math.round(stats.avg_possession_seconds/60)} min`, color:'var(--green)' },
                  { icon:Target,   label:'Total phases',    value:total,                                               color:'var(--blue)' },
                ].map(({icon:Icon,label,value,color},i) => (
                  <Tilt3D key={label} intensity={7} className={`fade-in-delay-${i+1}`}
                    style={{ borderRadius:16, padding:'16px 14px', background:'var(--bg-2)', border:'1px solid var(--border)', position:'relative', overflow:'hidden' }}>
                    <div style={{ position:'absolute', top:-18, right:-18, width:70, height:70, borderRadius:'50%', background:color, opacity:0.06, filter:'blur(16px)' }} />
                    <Icon size={15} style={{ color, marginBottom:9 }} />
                    <p style={{ fontSize:10, color:'var(--t3)', textTransform:'uppercase', letterSpacing:'0.08em', marginBottom:4 }}>{label}</p>
                    <p style={{ fontSize:22, fontWeight:900, color:'var(--t1)', letterSpacing:'-0.03em' }}>{value}</p>
                  </Tilt3D>
                ))}
              </div>

              {/* Phase bars */}
              <div style={{ borderRadius:18, padding:'20px 18px', background:'var(--bg-2)', border:'1px solid var(--border)' }}>
                <p style={{ fontWeight:700, fontSize:15, color:'var(--t1)', marginBottom:18, letterSpacing:'-0.01em' }}>Répartition des phases</p>
                <div style={{ display:'flex', flexDirection:'column', gap:12 }}>
                  {Object.entries(stats.phase_totals).sort((a,b)=>b[1]-a[1]).map(([ph, count]) => {
                    const c = PC[ph]||'var(--bg-4)'
                    return (
                      <div key={ph} style={{ display:'flex', alignItems:'center', gap:10 }}>
                        <div style={{ width:7, height:7, borderRadius:'50%', background:c, flexShrink:0 }} />
                        <span style={{ fontSize:13, color:'var(--t2)', width:88, textTransform:'capitalize' }}>{ph.replace('_',' ')}</span>
                        <div style={{ flex:1, height:6, borderRadius:3, background:'var(--bg-3)', overflow:'hidden' }}>
                          <div style={{ height:'100%', borderRadius:3, width:`${(count/maxPhase)*100}%`, background:`linear-gradient(90deg,${c},${c}70)`, boxShadow:`0 0 6px ${c}40`, transition:'width 0.7s cubic-bezier(0.4,0,0.2,1)' }} />
                        </div>
                        <span style={{ fontFamily:'JetBrains Mono,monospace', fontSize:13, fontWeight:700, color:'var(--t1)', width:28, textAlign:'right' }}>{count}</span>
                      </div>
                    )
                  })}
                </div>
              </div>
            </div>
          ) : (
            <div style={{ display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', height:260, borderRadius:20, border:'2px dashed var(--bg-4)' }}>
              <Users size={30} style={{ color:'var(--t3)', marginBottom:12 }} />
              <p style={{ fontSize:14, color:'var(--t3)' }}>Sélectionnez une équipe</p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
