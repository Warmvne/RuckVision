import { useRef, useCallback } from 'react'

export default function Tilt3D({ children, className, style, intensity = 12 }) {
  const ref = useRef(null)

  const onMove = useCallback((e) => {
    const el = ref.current
    if (!el) return
    const rect = el.getBoundingClientRect()
    const x = (e.clientX - rect.left) / rect.width  - 0.5
    const y = (e.clientY - rect.top)  / rect.height - 0.5
    el.style.transform = `perspective(600px) rotateY(${x * intensity}deg) rotateX(${-y * intensity}deg) translateZ(8px)`
    el.style.boxShadow = `${-x * 16}px ${y * 16}px 40px rgba(0,0,0,0.5), 0 0 30px rgba(0,255,136,0.06)`
  }, [intensity])

  const onLeave = useCallback(() => {
    const el = ref.current
    if (!el) return
    el.style.transform = 'perspective(600px) rotateY(0deg) rotateX(0deg) translateZ(0px)'
    el.style.boxShadow = ''
  }, [])

  return (
    <div
      ref={ref}
      onMouseMove={onMove}
      onMouseLeave={onLeave}
      className={`card-3d ${className || ''}`}
      style={style}>
      {children}
    </div>
  )
}
