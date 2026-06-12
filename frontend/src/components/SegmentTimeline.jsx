import clsx from 'clsx'

const PHASE_COLORS = {
  ruck: 'bg-orange-500',
  scrum: 'bg-blue-500',
  lineout: 'bg-purple-500',
  open_play: 'bg-green-500',
  try: 'bg-yellow-400',
  conversion: 'bg-yellow-300',
  penalty: 'bg-red-500',
  kickoff: 'bg-cyan-500',
  unknown: 'bg-gray-500',
}

const STATUS_OPACITY = {
  ai_proposed: 'opacity-60',
  validated: 'opacity-100',
  rejected: 'opacity-20',
  edited: 'opacity-90',
}

export default function SegmentTimeline({ segments, duration, currentTime, onSeek, selectedId, onSelect }) {
  if (!duration) return null

  return (
    <div className="relative w-full h-10 bg-gray-800 rounded-lg overflow-hidden cursor-pointer"
      onClick={(e) => {
        const rect = e.currentTarget.getBoundingClientRect()
        const ratio = (e.clientX - rect.left) / rect.width
        onSeek && onSeek(ratio * duration)
      }}>

      {segments.map(seg => {
        const left = (seg.start_time / duration) * 100
        const width = ((seg.end_time - seg.start_time) / duration) * 100
        const color = PHASE_COLORS[seg.phase_type] || PHASE_COLORS.unknown
        const opacity = STATUS_OPACITY[seg.status] || 'opacity-70'
        const isSelected = seg.id === selectedId

        return (
          <div
            key={seg.id}
            className={clsx(
              'absolute top-1 h-8 rounded transition-all',
              color, opacity,
              isSelected && 'ring-2 ring-white ring-offset-1 ring-offset-gray-800 z-10'
            )}
            style={{ left: `${left}%`, width: `${Math.max(width, 0.3)}%` }}
            onClick={(e) => { e.stopPropagation(); onSelect && onSelect(seg) }}
            title={`${seg.phase_type} ${formatTime(seg.start_time)} → ${formatTime(seg.end_time)}`}
          />
        )
      })}

      {/* Playhead */}
      <div
        className="absolute top-0 bottom-0 w-0.5 bg-white z-20 pointer-events-none"
        style={{ left: `${(currentTime / duration) * 100}%` }}
      />
    </div>
  )
}

function formatTime(s) {
  const m = Math.floor(s / 60)
  const sec = Math.floor(s % 60)
  return `${m}:${sec.toString().padStart(2, '0')}`
}
