export default function ProgressRing({ pct = 0, size = 56, stroke = 3, color = 'var(--green)', bg = 'var(--navy-3)', label }) {
  const r = (size - stroke * 2) / 2
  const circ = 2 * Math.PI * r
  const offset = circ - (pct / 100) * circ

  return (
    <div className="relative flex items-center justify-center" style={{ width: size, height: size }}>
      <svg width={size} height={size} style={{ transform: 'rotate(-90deg)' }}>
        <circle cx={size/2} cy={size/2} r={r} fill="none" stroke={bg} strokeWidth={stroke} />
        <circle
          cx={size/2} cy={size/2} r={r}
          fill="none"
          stroke={color}
          strokeWidth={stroke}
          strokeLinecap="round"
          strokeDasharray={circ}
          strokeDashoffset={offset}
          className="progress-ring"
          style={{ filter: `drop-shadow(0 0 4px ${color})` }}
        />
      </svg>
      <div className="absolute inset-0 flex items-center justify-center flex-col">
        {label !== undefined
          ? <span className="font-mono text-xs font-bold" style={{ color }}>{label}</span>
          : <span className="font-mono text-xs font-bold" style={{ color }}>{pct}%</span>
        }
      </div>
    </div>
  )
}
