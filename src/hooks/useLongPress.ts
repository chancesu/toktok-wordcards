import { useCallback, useEffect, useRef, useState } from 'react'
import type { PointerEvent as ReactPointerEvent } from 'react'

/** ms 동안 손을 떼지 않고 누르고 있을 때만 onFire. progress(0~1)로 진행 링을 그린다. */
export function useLongPress(ms: number, onFire: () => void) {
  const [progress, setProgress] = useState(0)
  const raf = useRef<number | null>(null)
  const pointer = useRef<number | null>(null)
  const fire = useRef(onFire)
  fire.current = onFire

  const stop = useCallback(() => {
    if (raf.current != null) cancelAnimationFrame(raf.current)
    raf.current = null
    pointer.current = null
    setProgress(0)
  }, [])

  useEffect(() => stop, [stop])

  const onPointerDown = useCallback(
    (e: ReactPointerEvent<HTMLElement>) => {
      if (!e.isPrimary || pointer.current != null) return
      pointer.current = e.pointerId
      try {
        e.currentTarget.setPointerCapture(e.pointerId)
      } catch {
        /* noop */
      }
      const start = performance.now()
      const loop = (t: number) => {
        if (pointer.current == null) return
        const p = Math.min(1, (t - start) / ms)
        setProgress(p)
        if (p >= 1) {
          stop()
          fire.current()
          return
        }
        raf.current = requestAnimationFrame(loop)
      }
      raf.current = requestAnimationFrame(loop)
    },
    [ms, stop],
  )

  const end = useCallback(
    (e: ReactPointerEvent<HTMLElement>) => {
      if (e.pointerId === pointer.current) stop()
    },
    [stop],
  )

  return {
    progress,
    handlers: { onPointerDown, onPointerUp: end, onPointerCancel: end, onLostPointerCapture: end },
  }
}
