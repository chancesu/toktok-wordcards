import { useMemo } from 'react'
import type { CSSProperties } from 'react'

const COLORS = ['#FF7A6B', '#FFC83D', '#34C3AE', '#8A6CF0', '#5AA9FF', '#FF9FB2']
const STAR = 'polygon(50% 0,61% 35%,98% 35%,68% 57%,79% 91%,50% 70%,21% 91%,32% 57%,2% 35%,39% 35%)'

/** 공이 터질 때 사방으로 퍼지는 별·동그라미 파티클 */
export function BurstParticles({ seed }: { seed: number }) {
  const pieces = useMemo(() => {
    // seed마다 다른 모양이 나오도록 간단한 결정적 난수
    let x = (seed + 1) * 9301
    const rnd = () => {
      x = (x * 9301 + 49297) % 233280
      return x / 233280
    }
    return Array.from({ length: 22 }, (_, i) => {
      const angle = (i / 22) * Math.PI * 2 + rnd() * 0.4
      const dist = 26 + rnd() * 20 // vmin
      const size = 2.2 + rnd() * 3.2 // vmin
      return {
        i,
        star: i % 3 === 0,
        color: COLORS[i % COLORS.length],
        style: {
          width: `${size}vmin`,
          height: `${size}vmin`,
          '--dx': `${Math.cos(angle) * dist}vmin`,
          '--dy': `${Math.sin(angle) * dist}vmin`,
          '--rot': `${Math.round(rnd() * 540 - 270)}deg`,
          animationDelay: `${Math.round(rnd() * 60)}ms`,
        } as CSSProperties,
      }
    })
  }, [seed])

  return (
    <div className="pointer-events-none absolute inset-0" aria-hidden="true">
      {pieces.map((p) => (
        <span
          key={p.i}
          className="absolute left-1/2 top-1/2 animate-particle motion-reduce:hidden"
          style={{
            ...p.style,
            background: p.color,
            borderRadius: p.star ? 0 : '9999px',
            clipPath: p.star ? STAR : undefined,
          }}
        />
      ))}
    </div>
  )
}
