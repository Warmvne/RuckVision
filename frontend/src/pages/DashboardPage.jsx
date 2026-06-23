import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { api } from '../api'
import { BarChart, Bar, PieChart, Pie, Cell, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts'
import { ArrowLeft, TrendingUp, Clock, Layers, Target } from 'lucide-react'
import Tilt3D from '../components/Tilt3D'
import ProgressRing from '../components/ProgressRing'

const PC = { ruck:'#f97316', scrum:'#38bdf8', lineout:'#a78bfa', open_play:'#00e5a0', try:'#fbbf24', conversion:'#fde68a', penalty:'#f87171', kickoff:'#00c8ff', unknown:'#253050' }
const PL = { ruck:'Ruck', scrum:'Mêlée', lineout:'Touche', open_play:'Jeu ouvert', try:'Essai', conversion:'Transfo', penalty:'Pénalité', kickoff:'Envoi', unknown:'Inconnu' }

const Tip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null
  return (
    <div style={{ padding:'10px 14px', borderRadius:12, background:'var(--bg-3)', border:'1px solid var(--border)', boxShadow:'0 8px 28px rgba(0,0,0,0.5)', fontSize:13 }}>
      <p style={{ fontWeight:700, color:'var(--t1)', marginBottom:4 }}>{label}</p>
      {payload.map(p => <p key={p.name} style={{ color: p.fill || 'var(--green)', fontFamily:'JetBrains Mono,monospace' }}>{p.value}</p>)}
    </div>
  )
}

function KpiCard({ icon: Icon, label, value, sub, color, index }) {
  return (
    <Tilt3D intensity={6} className={`fade-in-delay-${index+1}`} style={{
      borderRadius:20, padding:'20px 18px', background:'var(--bg-2)', border:'1px solid var(--border)',
      position:'relative', overflow:'hidden',
    }}>
      <div style={{ position:'absolute', top:-24, right:-24, width:90, height:90, borderRadius:'50%', background:color, opacity:0.07, filter:'blur(20px)' }} />
      <div style={{ width:36, height:36, borderRadius:10, display:'flex', alignItems:'center', justifyContent:'center', marginBottom:14, background:`${color}18`, border:`1px solid ${color}30` }}>
        <Icon size={16} style={{ color }} />
      </div>
      <p style={{ fontSize:11, fontWeight:600, color:'var(--t3)', textTransform:'uppercase', letterSpacing:'0.08em', marginBottom:5 }}>{label}</p>
      <p style={{ fontSize:26, fontWeight:900, color:'var(--t1)', letterSpacing:'-0.03em', lineHeight:1 }}>{value}</p>
      {sub && <p style={{ fontSize:11, color:'var(--t2)', marginTop:5 }}>{sub}</p>}
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
    Promise.all([api.getMatchStats(id), api.getMatch(id)]).then(([s,m]) => { setStats(s); setMatch(m) })
  }, [id])

  if (!stats) return (
    <div style={{ display:'flex', alignItems:'center', justifyContent:'center', height:'100%', flexDirection:'column', gap:14 }}>
      <div className="shimmer" style={{ width:140, height:26 }} />
      <div className="shimmer" style={{ width:90, height:14 }} />
    </div>
  )

  const phases = Object.entries(stats.phase_counts||{}).map(([k,v]) => ({
    name: PL[k]||k, count:v, duration:Math.round(stats.phase_durations_seconds?.[k]||0), fill:PC[k]||'var(--bg-4)',
  })).sort((a,b)=>b.count-a.count)

  const poss = Object.entries(stats.possession_percent||{}).map(([k,v]) => ({
    name: k==='home' ? match?.home_team||'Domicile' : match?.away_team||'Extérieur',
    value:v, fill: k==='home' ? 'var(--green)' : 'var(--blue)',
  }))

  const topPhase = phases[0]
  const topPoss  = [...poss].sort((a,b)=>b.value-a.value)[0]

  return (
    <div style={{ minHeight:'100%', padding:'36px 32px', background:'var(--bg)' }}>

      {/* Header */}
      <div style={{ marginBottom:32 }}>
        <div style={{ display:'flex', alignItems:'center', gap:12, marginBottom:4 }}>
          {id && (
            <button onClick={()=>navigate(`/match/${id}/review`)} style={{ width:34, height:34, borderRadius:10, display:'flex', alignItems:'center', justifyContent:'center', background:'var(--bg-2)', border:'1px solid var(--border)', color:'var(--t2)', cursor:'pointer' }}
              onMouseEnter={e=>e.currentTarget.style.color='var(--t1)'} onMouseLeave={e=>e.currentTarget.style.color='var(--t2)'}>
              <ArrowLeft size={15} />
            </button>
          )}
          <div>
            <p style={{ fontSize:10, fontWeight:700, letterSpacing:'0.15em', color:'var(--green)', textTransform:'uppercase', marginBottom:4 }}>Statistiques</p>
            <h1 className="text-hero text-chrome">{match?.title||'Dashboard'}</h1>
          </div>
          {match?.home_team && (
            <div style={{ marginLeft:'auto', display:'flex', alignItems:'center', gap:12, padding:'8px 16px', borderRadius:12, background:'var(--bg-2)', border:'1px solid var(--border)' }}>
              <span style={{ fontWeight:700, fontSize:14, color:'var(--green)' }}>{match.home_team}</span>
              <span style={{ color:'var(--t3)', fontSize:12 }}>vs</span>
              <span style={{ fontWeight:700, fontSize:14, color:'var(--blue)' }}>{match.away_team}</span>
            </div>
          )}
        </div>
        <div style={{ height:1, marginTop:14, background:'linear-gradient(90deg, var(--green), var(--blue), transparent)' }} />
      </div>

      {/* KPIs */}
      <div style={{ display:'grid', gridTemplateColumns:'repeat(4,1fr)', gap:14, marginBottom:20 }}>
        <KpiCard icon={Layers}     label="Segments"        value={stats.total_segments}                              color="var(--green)" index={0} />
        <KpiCard icon={Clock}      label="Durée"           value={`${Math.round((stats.total_duration||0)/60)} min`} color="var(--blue)"  index={1} />
        <KpiCard icon={TrendingUp} label="Phase dominante" value={topPhase?.name||'—'} sub={`${topPhase?.count||0}×`} color="var(--purple)" index={2} />
        <KpiCard icon={Target}     label="Équipe dom."     value={topPoss?.name||'—'}  sub={`${topPoss?.value||0}%`}  color="var(--gold)"  index={3} />
      </div>

      {/* Charts */}
      <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:18, marginBottom:18 }}>

        {/* Phases bar */}
        <div style={{ borderRadius:20, padding:'22px 20px', background:'var(--bg-2)', border:'1px solid var(--border)' }}>
          <p style={{ fontWeight:700, fontSize:15, color:'var(--t1)', marginBottom:2, letterSpacing:'-0.01em' }}>Distribution des phases</p>
          <p style={{ fontSize:12, color:'var(--t3)', marginBottom:18 }}>Occurrences par type</p>
          <ResponsiveContainer width="100%" height={210}>
            <BarChart data={phases} layout="vertical" margin={{ left:0, right:14 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" horizontal={false} />
              <XAxis type="number" stroke="var(--t4)" fontSize={11} tickLine={false} axisLine={false} tick={{ fill:'var(--t3)' }} />
              <YAxis type="category" dataKey="name" width={68} stroke="var(--t4)" fontSize={11} tickLine={false} axisLine={false} tick={{ fill:'var(--t2)' }} />
              <Tooltip content={<Tip />} cursor={{ fill:'rgba(255,255,255,0.03)' }} />
              <Bar dataKey="count" radius={[0,8,8,0]} maxBarSize={22}>
                {phases.map(e=><Cell key={e.name} fill={e.fill}/>)}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Possession */}
        <div style={{ borderRadius:20, padding:'22px 20px', background:'var(--bg-2)', border:'1px solid var(--border)' }}>
          <p style={{ fontWeight:700, fontSize:15, color:'var(--t1)', marginBottom:2, letterSpacing:'-0.01em' }}>Possession</p>
          <p style={{ fontSize:12, color:'var(--t3)', marginBottom:18 }}>Répartition par équipe</p>
          {poss.length === 0 ? (
            <div style={{ display:'flex', alignItems:'center', justifyContent:'center', height:180 }}>
              <p style={{ fontSize:13, color:'var(--t3)', textAlign:'center' }}>Annotez la possession<br/>dans la revue vidéo</p>
            </div>
          ) : (
            <div style={{ display:'flex', alignItems:'center', gap:20 }}>
              <ResponsiveContainer width="55%" height={180}>
                <PieChart>
                  <Pie data={poss} dataKey="value" cx="50%" cy="50%" innerRadius={48} outerRadius={72} paddingAngle={4} strokeWidth={0}>
                    {poss.map(e=><Cell key={e.name} fill={e.fill}/>)}
                  </Pie>
                  <Tooltip content={<Tip />} />
                </PieChart>
              </ResponsiveContainer>
              <div style={{ display:'flex', flexDirection:'column', gap:16 }}>
                {poss.map(d => (
                  <div key={d.name} style={{ display:'flex', alignItems:'center', gap:10 }}>
                    <ProgressRing pct={d.value} size={50} stroke={4} color={d.fill} />
                    <div>
                      <p style={{ fontSize:12, color:'var(--t2)' }}>{d.name}</p>
                      <p style={{ fontSize:22, fontWeight:900, color:d.fill, fontFamily:'JetBrains Mono,monospace', letterSpacing:'-0.02em' }}>{d.value}%</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Duration bars */}
      <div style={{ borderRadius:20, padding:'22px 20px', background:'var(--bg-2)', border:'1px solid var(--border)' }}>
        <p style={{ fontWeight:700, fontSize:15, color:'var(--t1)', marginBottom:2, letterSpacing:'-0.01em' }}>Temps par phase</p>
        <p style={{ fontSize:12, color:'var(--t3)', marginBottom:18 }}>Durée cumulée (secondes)</p>
        <ResponsiveContainer width="100%" height={190}>
          <BarChart data={phases} margin={{ left:0, right:14 }}>
            <defs>{phases.map(e=>(
              <linearGradient key={e.name} id={`g-${e.name}`} x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%"   stopColor={e.fill} stopOpacity={1}/>
                <stop offset="100%" stopColor={e.fill} stopOpacity={0.35}/>
              </linearGradient>
            ))}</defs>
            <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" vertical={false} />
            <XAxis dataKey="name" stroke="var(--t4)" fontSize={11} tickLine={false} axisLine={false} tick={{ fill:'var(--t2)' }} />
            <YAxis stroke="var(--t4)" fontSize={11} tickLine={false} axisLine={false} tick={{ fill:'var(--t3)' }} tickFormatter={v=>`${v}s`} />
            <Tooltip content={<Tip />} cursor={{ fill:'rgba(255,255,255,0.03)' }} />
            <Bar dataKey="duration" radius={[8,8,0,0]} maxBarSize={44}>
              {phases.map(e=><Cell key={e.name} fill={`url(#g-${e.name})`}/>)}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  )
}
