import { useCallback, useEffect, useRef } from 'react'
import type { PointerEvent as ReactPointerEvent } from 'react'

/**
 * 화면 전체에서 현재 눌려 있는 포인터 수를 추적한다.
 * - pointerdown은 window 캡처 단계에서 등록 → 대상 핸들러보다 먼저 카운트가 올라간다.
 * - pointerup/cancel은 window 버블 단계에서 해제 → 대상 핸들러가 먼저 '멀티터치였는지'를 볼 수 있다.
 * - 한 번이라도 두 손가락 이상이 겹쳤다면(multi=true), 모든 손가락이 떨어질 때까지 그 제스처는 무효.
 */
export function usePointerTracker() {
  const active = useRef(new Set<number>())
  const multi = useRef(false)

  useEffect(() => {
    const down = (e: PointerEvent) => {
      active.current.add(e.pointerId)
      if (active.current.size > 1) multi.current = true
    }
    const up = (e: PointerEvent) => {
      active.current.delete(e.pointerId)
      if (active.current.size === 0) multi.current = false
    }
    window.addEventListener('pointerdown', down, { capture: true })
    window.addEventListener('pointerup', up)
    window.addEventListener('pointercancel', up)
    return () => {
      window.removeEventListener('pointerdown', down, { capture: true })
      window.removeEventListener('pointerup', up)
      window.removeEventListener('pointercancel', up)
    }
  }, [])

  return { active, multi }
}

/**
 * 한 손가락 '탭'만 통과시키는 핸들러 세트.
 * 누른 포인터와 뗀 포인터가 같고, 그 사이 다른 손가락이 끼어들지 않았을 때만 onTap 호출.
 * (pointerup에서 발화하는 이유: iOS에서 TTS·오디오는 터치 종료 제스처에서 가장 안정적으로 허용됨)
 */
export function useSingleTap(onTap: () => void, tracker: ReturnType<typeof usePointerTracker>) {
  const downId = useRef<number | null>(null)
  const cb = useRef(onTap)
  cb.current = onTap

  const onPointerDown = useCallback(
    (e: ReactPointerEvent) => {
      const invalid =
        !e.isPrimary ||
        tracker.multi.current ||
        tracker.active.current.size > 1 ||
        (e.pointerType === 'mouse' && e.button !== 0)
      downId.current = invalid ? null : e.pointerId
    },
    [tracker],
  )

  const onPointerUp = useCallback(
    (e: ReactPointerEvent) => {
      const ok = downId.current === e.pointerId && !tracker.multi.current
      downId.current = null
      if (ok) cb.current()
    },
    [tracker],
  )

  const reset = useCallback(() => {
    downId.current = null
  }, [])

  return { onPointerDown, onPointerUp, onPointerCancel: reset }
}
