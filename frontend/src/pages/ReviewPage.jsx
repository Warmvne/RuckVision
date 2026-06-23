import { useState, useEffect, useRef, useCallback } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { api } from '../api'
import VideoPlayer from '../components/VideoPlayer'
import SegmentTimeline from '../components/SegmentTimeline'
import ProgressRing from '../components/ProgressRing'
import RippleButton from '../components/RippleButton'
import { CheckCircle, XCircle, Scissors, ChevronLeft, ChevronRight, Plus, ArrowLeft, Save, Edit3, Zap } from 'lucide-react'

const PHASES = ['ruck','scrum','lineout','open_play','try','conversion','penalty','kickoff','unknown']
const PHASE_LABELS = { ruck:'Ruck', scrum:'Mêlée', lineout:'Touche', open_play:'Jeu ouvert', try:'Essai', conversion:'Transformation', penalty:'Pénalité', kickoff:"Coup d'envoi", unknown:'Inconnu' }
const ZONES  = ['own_22','own_half','opp_half','opp_22']
const ZONE_LABELS = { own_22:'22m défensif', own_half:'Mi-terrain déf.', opp_half:'Mi-terrain att.', opp_22:'22m offensif' }
const PHASE_DOT = { ruck:'#f97316', scrum:'#38bdf8', lineout:'#a78bfa', open_play:'#00e5a0', try:'#fbbf24', conversion:'#fde68a', penalty:'#f87171', kickoff:'#00c8ff', unknown:'var(--bg-4)' }
const STATUS_BADGE = { ai_proposed:{ bg:'var(--purple-soft)', color:'var(--purple)', label:'IA' }, validated:{ bg:'var(--green-soft)', color:'var(--green)', label:'✓' }, rejected:{ bg:'rgba(248,113,113,0.1)', color:'var(--red)', label:'✗' }, edited:{ bg:'var(--blue-soft)', color:'var(--blue)', label:'✎' } }

function fmt(s) { return `${Math.floor(s/60)}:${String(Math.floor(s%60)).padStart(2,'0')}` }

export default function ReviewPage() {
  const { id } = useParams()
  const navigate = useNavigate()
  const playerRef = useRef(null)
  const [match, setMatch] = useState(null)
  const [segments, setSegments] = useState([])
  const [selected, setSelected] = useState(null)
  const [currentTime, setCurrentTime] = useState(0)
  const [editing, setEditing] = useState(null)

  const load = useCallback(async () => {
    const [m, segs] = await Promise.all([api.getMatch(id), api.getSegments(id)])
    setMatch(m); setSegments(segs)
  }, [id])

  useEffect(() => { load() }, [load])

  const select = seg => { setSelected(seg); setEditing({...seg}); playerRef.current?.currentTime(seg.start_time) }
  const navSeg = dir => { const a = segments.filter(s => s.status !== 'rejected'); const i = a.findIndex(s => s.id === selected?.id); const n = a[i+dir]; if (n) select(n) }

  const handleValidate = async () => { await api.validateSegment(selected.id); await load(); navSeg(1) }
  const handleReject   = async () => { await api.rejectSegment(selected.id);   await load(); navSeg(1) }
  const handleSave     = async () => {
    await api.updateSegment(selected.id, { start_time:editing.start_time, end_time:editing.end_time, phase_type:editing.phase_type, team_possession:editing.team_possession, field_zone:editing.field_zone, notes:editing.notes, label:editing.label })
    await load()
  }
  const handleSplit = async () => {
    const t = playerRef.current?.currentTime() ?? currentTime
    if (!selected || t <= selected.start_time || t >= selected.end_time) { alert("Placez la tête de lecture à l'intérieur du segment."); return }
    await api.splitSegment(selected.id, t); await load()
  }

  const stats = { total: segments.length, validated: segments.filter(s => s.status === 'validated').length }
  const pct   = stats.total ? Math.round(stats.validated / stats.total * 100) : 0

  const inputStyle = {
    width: '100%', padding: '8px 12px', borderRadius: 10, fontSize: 13,
    background: 'var(--bg-3)', color: 'var(--t1)',
    border: '1px solid var(--border)', outline: 'none',
    transition: 'border-color 0.2s',
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100vh', background: 'var(--bg)' }}>

      {/* ── Top bar ── */}
      <header style={{ display:'flex', alignItems:'center', gap:12, padding:'0 20px', height:52, flexShrink:0, background:'var(--bg-2)', borderBottom:'1px solid var(--border)' }}>
        <button onClick={() => navigate('/')} style={{ width:32, height:32, borderRadius:9, display:'flex', alignItems:'center', justifyContent:'center', background:'var(--glass)', border:'1px solid var(--border)', color:'var(--t2)', cursor:'pointer', flexShrink:0 }}
          onMouseEnter={e=>e.currentTarget.style.color='var(--t1)'} onMouseLeave={e=>e.currentTarget.style.color='var(--t2)'}>
          <ArrowLeft size={15} />
        </button>

        <div style={{ width:1, height:20, background:'var(--border)', flexShrink:0 }} />

        <div style={{ display:'flex', alignItems:'center', gap:8, minWidth:0 }}>
          <div className="pulse-dot" style={{ width:7, height:7, borderRadius:'50%', background:'var(--green)', flexShrink:0 }} />
          <p style={{ fontWeight:600, fontSize:14, color:'var(--t1)', whiteSpace:'nowrap', overflow:'hidden', textOverflow:'ellipsis' }}>{match?.title}</p>
          {match?.home_team && <span style={{ fontSize:12, color:'var(--t3)', whiteSpace:'nowrap' }}>{match.home_team} <span style={{color:'var(--t4)'}}>vs</span> {match.away_team}</span>}
        </div>

        <div style={{ marginLeft:'auto', display:'flex', alignItems:'center', gap:16 }}>
          {/* Progress */}
          <div style={{ display:'flex', alignItems:'center', gap:10 }}>
            <ProgressRing pct={pct} size={36} stroke={3} color="var(--green)" />
            <div>
              <p style={{ fontSize:11, color:'var(--t2)', lineHeight:1 }}>{stats.validated}/{stats.total} validés</p>
              <p style={{ fontSize:10, color:'var(--t3)', lineHeight:1.5 }}>en attente: {segments.filter(s=>s.status==='ai_proposed').length}</p>
            </div>
          </div>
          <div style={{ width:1, height:20, background:'var(--border)' }} />
          <RippleButton onClick={() => navigate(`/match/${id}/dashboard`)} style={{
            display:'flex', alignItems:'center', gap:6, padding:'6px 14px', borderRadius:9,
            background:'var(--blue-soft)', color:'var(--blue)', border:'1px solid rgba(56,189,248,0.25)',
            fontSize:12, fontWeight:600, cursor:'pointer',
          }}>
            <Zap size={12} /> Stats
          </RippleButton>
        </div>
      </header>

      {/* ── Body ── */}
      <div style={{ display:'flex', flex:1, overflow:'hidden' }}>

        {/* Video + timeline + controls */}
        <div style={{ display:'flex', flexDirection:'column', flex:1, padding:'12px', gap:10, overflow:'hidden' }}>
          <div style={{ flex:1, borderRadius:16, overflow:'hidden', background:'#000', minHeight:0 }}>
            <VideoPlayer src={`/hls/${id}/index.m3u8`} onTimeUpdate={setCurrentTime} playerRef={playerRef} />
          </div>

          {/* Timeline */}
          <SegmentTimeline segments={segments} duration={match?.duration_seconds} currentTime={currentTime}
            onSeek={t => playerRef.current?.currentTime(t)} selectedId={selected?.id} onSelect={select} />

          {/* Controls */}
          <div style={{ display:'flex', alignItems:'center', gap:8, flexShrink:0 }}>
            {[[-1, ChevronLeft], [1, ChevronRight]].map(([dir, Icon]) => (
              <button key={dir} onClick={() => navSeg(dir)} style={{
                width:34, height:34, borderRadius:9, display:'flex', alignItems:'center', justifyContent:'center',
                background:'var(--bg-2)', border:'1px solid var(--border)', color:'var(--t2)', cursor:'pointer', transition:'all 0.2s',
              }} onMouseEnter={e=>e.currentTarget.style.borderColor='var(--green)'} onMouseLeave={e=>e.currentTarget.style.borderColor='var(--border)'}>
                <Icon size={15} />
              </button>
            ))}

            <div style={{ width:1, height:20, background:'var(--border)', margin:'0 2px' }} />

            <RippleButton onClick={handleSplit} style={{
              display:'flex', alignItems:'center', gap:6, padding:'7px 14px', borderRadius:9,
              background:'var(--gold-soft)', color:'var(--gold)', border:'1px solid rgba(251,191,36,0.3)',
              fontSize:12, fontWeight:600, cursor:'pointer',
            }}><Scissors size={13}/> Couper</RippleButton>

            <RippleButton onClick={async () => {
              const t = playerRef.current?.currentTime() ?? currentTime
              await api.createSegment({ match_id:parseInt(id), start_time:t, end_time:Math.min(t+10, match?.duration_seconds??t+10) })
              await load()
            }} style={{
              display:'flex', alignItems:'center', gap:6, padding:'7px 14px', borderRadius:9,
              background:'var(--green-soft)', color:'var(--green)', border:'1px solid rgba(0,229,160,0.3)',
              fontSize:12, fontWeight:600, cursor:'pointer',
            }}><Plus size={13}/> Segment</RippleButton>

            {selected && (
              <div style={{ marginLeft:'auto', display:'flex', gap:8 }}>
                <RippleButton onClick={handleValidate} style={{
                  display:'flex', alignItems:'center', gap:6, padding:'7px 16px', borderRadius:9,
                  background:'var(--green-soft)', color:'var(--green)', border:'1px solid rgba(0,229,160,0.35)',
                  fontSize:12, fontWeight:700, cursor:'pointer',
                }}><CheckCircle size={14}/> Valider</RippleButton>
                <RippleButton onClick={handleReject} style={{
                  display:'flex', alignItems:'center', gap:6, padding:'7px 16px', borderRadius:9,
                  background:'rgba(248,113,113,0.1)', color:'var(--red)', border:'1px solid rgba(248,113,113,0.3)',
                  fontSize:12, fontWeight:700, cursor:'pointer',
                }}><XCircle size={14}/> Rejeter</RippleButton>
              </div>
            )}
          </div>
        </div>

        {/* ── Sidebar ── */}
        <aside style={{ width:300, display:'flex', flexDirection:'column', overflow:'hidden', background:'var(--bg-2)', borderLeft:'1px solid var(--border)' }}>

          {/* Edit panel */}
          {editing && selected && (
            <div style={{ padding:'14px 14px 12px', borderBottom:'1px solid var(--border)', flexShrink:0 }}>
              <div style={{ display:'flex', alignItems:'center', gap:7, marginBottom:12 }}>
                <Edit3 size={12} style={{ color:'var(--green)' }} />
                <span style={{ fontSize:10, fontWeight:700, letterSpacing:'0.1em', color:'var(--green)', textTransform:'uppercase' }}>Édition</span>
                <span style={{ marginLeft:'auto', fontFamily:'JetBrains Mono,monospace', fontSize:11, color:'var(--t3)' }}>
                  {fmt(selected.start_time)} → {fmt(selected.end_time)}
                </span>
              </div>

              <div style={{ display:'flex', flexDirection:'column', gap:8 }}>
                <select value={editing.phase_type||'unknown'} onChange={e=>setEditing(d=>({...d,phase_type:e.target.value}))} style={inputStyle}>
                  {PHASES.map(p=><option key={p} value={p}>{PHASE_LABELS[p]}</option>)}
                </select>

                <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr 1fr', gap:6 }}>
                  {['home','away',''].map(t => (
                    <button key={t} onClick={()=>setEditing(d=>({...d,team_possession:t||null}))} style={{
                      padding:'7px 4px', borderRadius:9, fontSize:11, fontWeight:600, cursor:'pointer', transition:'all 0.15s',
                      background: editing.team_possession===(t||null) ? 'var(--green-soft)' : 'var(--bg-3)',
                      color:      editing.team_possession===(t||null) ? 'var(--green)'      : 'var(--t2)',
                      border:     `1px solid ${editing.team_possession===(t||null) ? 'rgba(0,229,160,0.35)' : 'var(--border)'}`,
                    }}>
                      {t==='home'?match?.home_team?.slice(0,8)??'Dom':t==='away'?match?.away_team?.slice(0,8)??'Ext':'—'}
                    </button>
                  ))}
                </div>

                <select value={editing.field_zone||''} onChange={e=>setEditing(d=>({...d,field_zone:e.target.value||null}))} style={inputStyle}>
                  <option value="">Zone du terrain</option>
                  {ZONES.map(z=><option key={z} value={z}>{ZONE_LABELS[z]}</option>)}
                </select>

                <input value={editing.label||''} placeholder="Étiquette libre"
                  onChange={e=>setEditing(d=>({...d,label:e.target.value}))} style={inputStyle}
                  onFocus={e=>e.target.style.borderColor='var(--green)'} onBlur={e=>e.target.style.borderColor='var(--border)'} />

                <textarea value={editing.notes||''} placeholder="Notes..."
                  onChange={e=>setEditing(d=>({...d,notes:e.target.value}))}
                  style={{...inputStyle, resize:'none', height:60}}
                  onFocus={e=>e.target.style.borderColor='var(--green)'} onBlur={e=>e.target.style.borderColor='var(--border)'} />

                <RippleButton onClick={handleSave} style={{
                  display:'flex', alignItems:'center', justifyContent:'center', gap:7, padding:'9px',
                  borderRadius:11, fontSize:13, fontWeight:700, cursor:'pointer',
                  background:'linear-gradient(135deg, rgba(0,229,160,0.15), rgba(56,189,248,0.15))',
                  color:'var(--green)', border:'1px solid rgba(0,229,160,0.3)',
                }}><Save size={13}/> Enregistrer</RippleButton>
              </div>
            </div>
          )}

          {/* Segment list */}
          <div style={{ flex:1, overflowY:'auto', padding:'10px 10px' }}>
            {segments.map(seg => {
              const bs = STATUS_BADGE[seg.status] || STATUS_BADGE.ai_proposed
              const dot = PHASE_DOT[seg.phase_type] || PHASE_DOT.unknown
              const isSel = seg.id === selected?.id
              return (
                <button key={seg.id} onClick={()=>select(seg)} style={{
                  width:'100%', textAlign:'left', padding:'10px 12px', borderRadius:12,
                  marginBottom:6, cursor:'pointer', transition:'all 0.15s',
                  background: isSel ? 'rgba(0,229,160,0.06)' : 'var(--bg-3)',
                  border: `1px solid ${isSel ? 'rgba(0,229,160,0.3)' : 'var(--border)'}`,
                  boxShadow: isSel ? '0 0 14px var(--green-glow)' : 'none',
                }}>
                  <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:5 }}>
                    <span style={{ fontFamily:'JetBrains Mono,monospace', fontSize:11, color:'var(--t2)' }}>
                      {fmt(seg.start_time)} — {fmt(seg.end_time)}
                    </span>
                    <span style={{ fontSize:10, fontWeight:700, padding:'2px 7px', borderRadius:6, background:bs.bg, color:bs.color }}>{bs.label}</span>
                  </div>
                  <div style={{ display:'flex', alignItems:'center', gap:7 }}>
                    <div style={{ width:7, height:7, borderRadius:'50%', background:dot, flexShrink:0 }} />
                    <span style={{ fontSize:13, fontWeight:600, color:'var(--t1)' }}>{PHASE_LABELS[seg.phase_type]||seg.phase_type}</span>
                    {seg.label && <span style={{ fontSize:11, color:'var(--t3)', overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>{seg.label}</span>}
                  </div>
                  {seg.ai_confidence != null && (
                    <div style={{ display:'flex', alignItems:'center', gap:8, marginTop:6 }}>
                      <div style={{ flex:1, height:3, borderRadius:3, background:'var(--bg-4)', overflow:'hidden' }}>
                        <div style={{ height:'100%', borderRadius:3, width:`${seg.ai_confidence*100}%`,
                          background: seg.ai_confidence>0.7?'var(--green)':seg.ai_confidence>0.4?'var(--gold)':'var(--red)' }} />
                      </div>
                      <span style={{ fontFamily:'JetBrains Mono,monospace', fontSize:10, color:'var(--t3)' }}>
                        {Math.round(seg.ai_confidence*100)}%
                      </span>
                    </div>
                  )}
                </button>
              )
            })}
          </div>
        </aside>
      </div>
    </div>
  )
}
