import { useLongPress } from '../hooks/useLongPress'
import { TIMING } from '../timing'

/**
 * 우측 상단 투명 영역. 3초 동안 누르고 있어야만 보호자 확인 창이 열린다.
 * 누르는 동안 1/3 이상 지나면 아주 옅은 진행 링이 보인다(부모용 피드백, 아이 눈엔 거의 안 띔).
 */
export function ParentCorner({ onUnlock }: { onUnlock: () => void }) {
  const { progress, handlers } = useLongPress(TIMING.parentLongPress, onUnlock)
  const r = 22
  const c = 2 * Math.PI * r
  return (
    <div
      {...handlers}
      className="absolute right-0 top-0 z-30 flex h-24 w-24 items-center justify-center"
      style={{ touchAction: 'none' }}
      aria-label="보호자 모드 (3초간 길게 누르기)"
    >
      <svg
        viewBox="0 0 56 56"
        className="h-14 w-14 transition-opacity duration-300"
        style={{ opacity: progress > 0.33 ? 0.55 : 0 }}
        aria-hidden="true"
      >
        <circle cx="28" cy="28" r={r} stroke="rgba(36,49,94,.2)" strokeWidth="5" fill="none" />
        <circle
          cx="28"
          cy="28"
          r={r}
          stroke="#24315E"
          strokeWidth="5"
          fill="none"
          strokeLinecap="round"
          strokeDasharray={c}
          strokeDashoffset={c * (1 - progress)}
          transform="rotate(-90 28 28)"
        />
      </svg>
    </div>
  )
}
