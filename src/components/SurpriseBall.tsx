import { useId } from 'react'

type Part = 'whole' | 'top' | 'bottom'

/**
 * 원형 '깜짝 캡슐' 공. (특정 캐릭터 상품 디자인을 복제하지 않은 오리지널 디자인)
 * part로 위/아래 반쪽만 잘라 그릴 수 있어서, 터질 때 두 조각이 갈라져 날아가는 연출에 쓴다.
 */
export function BallArt({ part = 'whole', taps = 0 }: { part?: Part; taps?: number }) {
  const uid = useId().replace(/[^a-zA-Z0-9]/g, '')
  const id = (s: string) => `${s}-${uid}`
  const clip =
    part === 'top' ? (
      <rect x="0" y="0" width="240" height="120" />
    ) : part === 'bottom' ? (
      <rect x="0" y="120" width="240" height="120" />
    ) : (
      <rect x="0" y="0" width="240" height="240" />
    )

  return (
    <svg viewBox="0 0 240 240" className="block h-full w-full overflow-visible" aria-hidden="true">
      <defs>
        <linearGradient id={id('top')} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#6FE3D0" />
          <stop offset="1" stopColor="#1F9C89" />
        </linearGradient>
        <linearGradient id={id('bot')} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#FFE58A" />
          <stop offset="1" stopColor="#F2A516" />
        </linearGradient>
        <clipPath id={id('circle')}>
          <circle cx="120" cy="120" r="100" />
        </clipPath>
        <clipPath id={id('part')}>{clip}</clipPath>
      </defs>

      <g clipPath={`url(#${id('part')})`}>
        <g clipPath={`url(#${id('circle')})`}>
          <rect x="0" y="0" width="240" height="120" fill={`url(#${id('top')})`} />
          <rect x="0" y="120" width="240" height="120" fill={`url(#${id('bot')})`} />
          {/* 윗면 물방울 무늬 */}
          {[
            [70, 60, 9],
            [110, 38, 6],
            [150, 66, 10],
            [185, 88, 6],
            [48, 96, 6],
          ].map(([cx, cy, r]) => (
            <circle key={`${cx}-${cy}`} cx={cx} cy={cy} r={r} fill="#fff" opacity=".35" />
          ))}
          {/* 아랫면 줄무늬 */}
          <path d="M20 170 Q120 200 220 170" stroke="#fff" strokeWidth="7" opacity=".35" fill="none" />
          {/* 지그재그 이음새 */}
          <path
            d="M0 120 L20 110 L40 130 L60 110 L80 130 L100 110 L120 130 L140 110 L160 130 L180 110 L200 130 L220 110 L240 120"
            stroke="#24315E"
            strokeWidth="9"
            strokeLinejoin="round"
            fill="none"
          />
          {/* 반짝임 */}
          <ellipse cx="78" cy="66" rx="26" ry="13" transform="rotate(-32 78 66)" fill="#fff" opacity=".7" />
        </g>
        <circle cx="120" cy="120" r="100" fill="none" stroke="#24315E" strokeWidth="7" />
        {/* 얼굴: 터치할수록 표정이 신나진다 */}
        <g transform="translate(120 160)">
          {taps >= 2 ? (
            <>
              <path d="M-34 -6 l10 -8 l10 8" stroke="#24315E" strokeWidth="6" fill="none" strokeLinecap="round" strokeLinejoin="round" />
              <path d="M14 -6 l10 -8 l10 8" stroke="#24315E" strokeWidth="6" fill="none" strokeLinecap="round" strokeLinejoin="round" />
            </>
          ) : (
            <>
              <circle cx="-24" cy="-8" r="7" fill="#24315E" />
              <circle cx="24" cy="-8" r="7" fill="#24315E" />
            </>
          )}
          {taps >= 1 ? (
            <path d="M-14 8 Q0 26 14 8 Z" fill="#24315E" />
          ) : (
            <path d="M-12 8 Q0 18 12 8" stroke="#24315E" strokeWidth="6" fill="none" strokeLinecap="round" />
          )}
          <circle cx="-42" cy="8" r="8" fill="#FF7A6B" opacity=".55" />
          <circle cx="42" cy="8" r="8" fill="#FF7A6B" opacity=".55" />
        </g>
      </g>
    </svg>
  )
}

/** 대기 상태의 공: 둥실둥실 + 터치마다 스쿼시 바운스 + 2번째 터치 이후 들썩임 */
export function SurpriseBall({ taps, bounceKey }: { taps: number; bounceKey: number }) {
  return (
    <div className="relative flex aspect-square w-[min(62vw,46vh)] items-center justify-center">
      <div className="absolute bottom-[2%] left-1/2 h-[7%] w-[56%] -translate-x-1/2 rounded-[50%] bg-ink/15 blur-[2px]" />
      <div className="h-full w-full animate-ball-in">
        <div className="h-full w-full animate-floaty">
          <div key={bounceKey} className={`h-full w-full origin-bottom ${bounceKey > 0 ? 'animate-squash' : ''}`}>
            <div className={`h-full w-full ${taps >= 2 ? 'animate-jiggle' : ''}`}>
              <BallArt taps={taps} />
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

/** 터지는 순간: 두 반쪽이 갈라져 날아감 */
export function BurstingBall() {
  return (
    <div className="relative aspect-square w-[min(62vw,46vh)]">
      <div className="absolute inset-0 animate-half-top">
        <BallArt part="top" taps={3} />
      </div>
      <div className="absolute inset-0 animate-half-bottom">
        <BallArt part="bottom" taps={3} />
      </div>
    </div>
  )
}
