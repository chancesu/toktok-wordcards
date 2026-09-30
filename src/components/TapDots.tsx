interface Props {
  total: number
  filled: number
  kind: 'ball' | 'card'
  /** 카드 3회 재생 후 '한 번 더 누르면 다음' 힌트 */
  showNext?: boolean
}

/** 진행 표시: 공은 동그라미 3개, 카드는 스피커 3개. 부모가 지금 몇 번째인지 한눈에 볼 수 있다. */
export function TapDots({ total, filled, kind, showNext }: Props) {
  return (
    <div className="pointer-events-none flex items-center gap-3" aria-hidden="true">
      {Array.from({ length: total }, (_, i) => {
        const on = i < filled
        return kind === 'ball' ? (
          <span
            key={i}
            className={`h-4 w-4 rounded-full border-[3px] border-ink transition-colors duration-200 ${on ? 'bg-sun' : 'bg-white/70'}`}
          />
        ) : (
          <svg key={i} viewBox="0 0 24 24" className="h-7 w-7">
            <path
              d="M4 9h4l5-4v14l-5-4H4z"
              fill={on ? '#FF7A6B' : 'rgba(255,255,255,.75)'}
              stroke="#24315E"
              strokeWidth="2"
              strokeLinejoin="round"
            />
            {on && <path d="M16 8.5a5 5 0 0 1 0 7M18.5 6a8.5 8.5 0 0 1 0 12" stroke="#24315E" strokeWidth="2" fill="none" strokeLinecap="round" />}
          </svg>
        )
      })}
      {showNext && (
        <svg viewBox="0 0 24 24" className="ml-1 h-8 w-8 animate-nudge">
          <path d="M8 4l8 8-8 8" stroke="#24315E" strokeWidth="3.5" fill="none" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      )}
    </div>
  )
}
