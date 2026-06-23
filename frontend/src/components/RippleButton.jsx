import { useCallback } from 'react'

export default function RippleButton({ children, onClick, className, style, disabled }) {
  const handleClick = useCallback((e) => {
    if (disabled) return
    const btn = e.currentTarget
    const rect = btn.getBoundingClientRect()
    const size = Math.max(rect.width, rect.height)
    const x = e.clientX - rect.left - size / 2
    const y = e.clientY - rect.top  - size / 2
    const ripple = document.createElement('span')
    ripple.className = 'ripple'
    ripple.style.cssText = `width:${size}px;height:${size}px;left:${x}px;top:${y}px`
    btn.appendChild(ripple)
    ripple.addEventListener('animationend', () => ripple.remove())
    onClick?.(e)
  }, [onClick, disabled])

  return (
    <button
      onClick={handleClick}
      disabled={disabled}
      className={`ripple-btn ${className || ''}`}
      style={style}>
      {children}
    </button>
  )
}
