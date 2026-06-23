import { useState } from 'react'

const PHASE_COLORS = {
  ruck:       { bg: '#f97316', glow: 'rgba(249,115,22,0.4)' },
  scrum:      { bg: '#3b82f6', glow: 'rgba(59,130,246,0.4)' },
  lineout:    { bg: '#a855f7', glow: 'rgba(168,85,247,0.4)' },
  open_play:  { bg: '#00e676', glow: 'rgba(0,230,118,0.4)' },
  try:        { bg: '#ffd600', glow: 'rgba(255,214,0,0.6)' },
  conversion: { bg: '#fde047', glow: 'rgba(253,224,71,0.4)' },
  penalty:    { bg: '#ef4444', glow: 'rgba(239,68,68,0.4)' },
  kickoff:    { bg: '#06b6d4', glow: 'rgba(6,182,212,0.4)' },
  unknown:    { bg: '#334155', glow: 'rgba(51,65,85,0.3)' },
}

const STATUS_OPACITY = {
  ai_proposed: 0.55,
  validated:   1,
  rejected:    0.15,
  edited:      0.85,
}

function formatTime(s) {
  const m = Math.floor(s / 60)
  const sec = Math.floor(s % 60)
  return `${m}:${sec.toString().padStart(2, '0')}`
}

export default function SegmentTimeline({ segments, duration, currentTime, onSeek, selectedId, onSelect }) {
  const [tooltip, setTooltip] = useState(null)

  if (!duration) return null

  const progress = (currentTime / duration) * 100

  return (
    <div className="relative w-full select-none">
      {/* Track */}
      <div
        className="relative w-full h-12 rounded-xl overflow-visible cursor-pointer"
        style={{ background: 'var(--navy-3)', border: '1px solid var(--glass-border)' }}
        onClick={e => {
          const rect = e.currentTarget.getBoundingClientRect()
          onSeek?.((e.clientX - rect.left) / rect.width * duration)
        }}>

        {/* Segments */}
        {segments.map(seg => {
          const left = (seg.start_time / duration) * 100
          const width = Math.max(((seg.end_time - seg.start_time) / duration) * 100, 0.2)
          const colors = PHASE_COLORS[seg.phase_type] || PHASE_COLORS.unknown
          const opacity = STATUS_OPACITY[seg.status] ?? 0.7
          const isSelected = seg.id === selectedId

          return (
            <div
              key={seg.id}
              className="absolute top-1.5 h-9 rounded-lg cursor-pointer transition-all duration-150"
              style={{
                left: `${left}%`,
                width: `${width}%`,
                background: colors.bg,
                opacity,
                boxShadow: isSelected ? `0 0 12px ${colors.glow}, inset 0 0 0 2px rgba(255,255,255,0.5)` : undefined,
                zIndex: isSelected ? 10 : 1,
                transform: isSelected ? 'scaleY(1.1)' : 'scaleY(1)',
              }}
              onClick={e => { e.stopPropagation(); onSelect?.(seg) }}
              onMouseEnter={e => {
                const rect = e.currentTarget.closest('[class*=rounded-xl]').getBoundingClientRect()
                const segRect = e.currentTarget.getBoundingClientRect()
                setTooltip({ seg, x: segRect.left - rect.left + segRect.width / 2 })
              }}
              onMouseLeave={() => setTooltip(null)}
            />
          )
        })}

        {/* Playhead */}
        <div
          className="absolute top-0 bottom-0 w-0.5 z-20 pointer-events-none"
          style={{
            left: `${progress}%`,
            background: 'white',
            boxShadow: '0 0 8px rgba(255,255,255,0.8)',
          }}>
          <div className="absolute -top-1 left-1/2 -translate-x-1/2 w-2.5 h-2.5 rounded-full bg-white"
            style={{ boxShadow: '0 0 8px rgba(255,255,255,0.8)' }} />
        </div>

        {/* Progress fill */}
        <div className="absolute inset-y-0 left-0 pointer-events-none rounded-xl"
          style={{ width: `${progress}%`, background: 'rgba(0,230,118,0.04)' }} />
      </div>

      {/* Tooltip */}
      {tooltip && (
        <div
          className="absolute -top-14 z-30 px-3 py-2 rounded-xl text-xs pointer-events-none"
          style={{
            left: `${tooltip.x}px`,
            transform: 'translateX(-50%)',
            background: 'var(--navy-3)',
            border: '1px solid var(--glass-border)',
            boxShadow: '0 8px 24px rgba(0,0,0,0.5)',
            color: 'var(--text-primary)',
            whiteSpace: 'nowrap',
          }}>
          <p className="font-semibold capitalize">{tooltip.seg.phase_type?.replace('_', ' ')}</p>
          <p className="font-mono" style={{ color: 'var(--text-secondary)' }}>
            {formatTime(tooltip.seg.start_time)} → {formatTime(tooltip.seg.end_time)}
          </p>
        </div>
      )}

      {/* Time markers */}
      <div className="flex justify-between mt-1.5 px-0.5">
        {[0, 0.25, 0.5, 0.75, 1].map(r => (
          <span key={r} className="font-mono text-xs" style={{ color: 'var(--text-muted)' }}>
            {formatTime(r * duration)}
          </span>
        ))}
      </div>
    </div>
  )
}
