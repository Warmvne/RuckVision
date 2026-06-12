import { useEffect, useRef } from 'react'
import videojs from 'video.js'
import 'video.js/dist/video-js.css'

export default function VideoPlayer({ src, type = 'application/x-mpegURL', onTimeUpdate, playerRef: externalRef }) {
  const containerRef = useRef(null)
  const internalRef = useRef(null)
  const ref = externalRef || internalRef

  useEffect(() => {
    if (!containerRef.current) return

    const player = videojs(containerRef.current, {
      controls: true,
      fluid: true,
      preload: 'auto',
      sources: [{ src, type }],
    })

    ref.current = player

    if (onTimeUpdate) {
      player.on('timeupdate', () => onTimeUpdate(player.currentTime()))
    }

    return () => {
      if (player && !player.isDisposed()) player.dispose()
      ref.current = null
    }
  }, [src])

  return (
    <div data-vjs-player>
      <video ref={containerRef} className="video-js vjs-big-play-centered vjs-theme-sea" />
    </div>
  )
}
