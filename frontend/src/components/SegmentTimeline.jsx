import { useState } from 'react'

const PC = { ruck:'#f97316', scrum:'#38bdf8', lineout:'#a78bfa', open_play:'#00e5a0', try:'#fbbf24', conversion:'#fde68a', penalty:'#f87171', kickoff:'#00c8ff', unknown:'#253050' }
const OPACITY = { ai_proposed:0.55, validated:1, rejected:0.15, edited:0.85 }
const fmt = s => `${Math.floor(s/60)}:${String(Math.floor(s%60)).padStart(2,'0')}`

export default function SegmentTimeline({ segments, duration, currentTime, onSeek, selectedId, onSelect }) {
  const [tooltip, setTooltip] = useState(null)
  if (!duration) return null

  const pct = (currentTime / duration) * 100

  return (
    <div style={{ position:'relative', userSelect:'none' }}>
      {/* Track */}
      <div
        style={{ position:'relative', width:'100%', height:44, borderRadius:12, overflow:'visible', cursor:'pointer', background:'var(--bg-3)', border:'1px solid var(--border)' }}
        onClick={e => { const r=e.currentTarget.getBoundingClientRect(); onSeek?.((e.clientX-r.left)/r.width*duration) }}>

        {segments.map(seg => {
          const left  = (seg.start_time/duration)*100
          const width = Math.max(((seg.end_time-seg.start_time)/duration)*100, 0.2)
          const color = PC[seg.phase_type] || PC.unknown
          const opacity = OPACITY[seg.status] ?? 0.7
          const isSel = seg.id === selectedId

          return (
            <div key={seg.id}
              style={{
                position:'absolute', top:6, height:32, borderRadius:8,
                left:`${left}%`, width:`${width}%`,
                background:color, opacity,
                boxShadow: isSel ? `0 0 10px ${color}80, inset 0 0 0 2px rgba(255,255,255,0.5)` : undefined,
                zIndex: isSel ? 10 : 1,
                transform: isSel ? 'scaleY(1.08)' : 'scaleY(1)',
                transition:'transform 0.15s, opacity 0.15s',
                cursor:'pointer',
              }}
              onClick={e => { e.stopPropagation(); onSelect?.(seg) }}
              onMouseEnter={e => {
                const pr = e.currentTarget.closest('[style*="border-radius: 12px"]')?.getBoundingClientRect()
                const sr = e.currentTarget.getBoundingClientRect()
                setTooltip({ seg, x: pr ? sr.left-pr.left+sr.width/2 : 0 })
              }}
              onMouseLeave={() => setTooltip(null)}
            />
          )
        })}

        {/* Playhead */}
        <div style={{
          position:'absolute', top:0, bottom:0, width:2, zIndex:20, pointerEvents:'none',
          left:`${pct}%`, background:'white', boxShadow:'0 0 6px rgba(255,255,255,0.7)',
        }}>
          <div style={{ position:'absolute', top:-3, left:'50%', transform:'translateX(-50%)', width:10, height:10, borderRadius:'50%', background:'white', boxShadow:'0 0 8px rgba(255,255,255,0.8)' }} />
        </div>
      </div>

      {/* Tooltip */}
      {tooltip && (
        <div style={{
          position:'absolute', bottom:52, left:tooltip.x, transform:'translateX(-50%)',
          padding:'8px 12px', borderRadius:10, zIndex:30, pointerEvents:'none',
          background:'var(--bg-3)', border:'1px solid var(--border)',
          boxShadow:'0 8px 24px rgba(0,0,0,0.5)',
          whiteSpace:'nowrap',
        }}>
          <p style={{ fontWeight:700, fontSize:12, color:'var(--t1)', textTransform:'capitalize' }}>
            {tooltip.seg.phase_type?.replace('_',' ')}
          </p>
          <p style={{ fontFamily:'JetBrains Mono,monospace', fontSize:11, color:'var(--t2)', marginTop:2 }}>
            {fmt(tooltip.seg.start_time)} → {fmt(tooltip.seg.end_time)}
          </p>
        </div>
      )}

      {/* Time markers */}
      <div style={{ display:'flex', justifyContent:'space-between', marginTop:6, padding:'0 2px' }}>
        {[0,0.25,0.5,0.75,1].map(r => (
          <span key={r} style={{ fontFamily:'JetBrains Mono,monospace', fontSize:10, color:'var(--t3)' }}>
            {fmt(r*duration)}
          </span>
        ))}
      </div>
    </div>
  )
}
