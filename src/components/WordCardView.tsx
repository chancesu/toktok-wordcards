import type { WordCard } from '../types'

interface Props {
  card: WordCard
  speaking: boolean
  leaving: boolean
}

function Sparkle({ className, delay }: { className: string; delay: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      className={`absolute h-[7%] w-[7%] animate-twinkle ${className}`}
      style={{ animationDelay: delay }}
      aria-hidden="true"
    >
      <path d="M12 0 L14.5 9.5 L24 12 L14.5 14.5 L12 24 L9.5 14.5 L0 12 L9.5 9.5 Z" fill="#FFC83D" />
    </svg>
  )
}

/**
 * 낱말 카드. 스페셜(가족) 카드는 무지개 액자 + '우리 가족' 리본 + 반짝임으로 구분한다.
 * 이미지는 pointer-events:none, draggable=false → 길게 눌러도 저장/드래그 메뉴가 뜨지 않는다.
 */
export function WordCardView({ card, speaking, leaving }: Props) {
  const special = card.type === 'special'
  const len = Array.from(card.word).length
  const wordSize = len <= 2 ? 'text-[min(15vmin,5.5rem)]' : len <= 4 ? 'text-[min(12vmin,4.6rem)]' : 'text-[min(9vmin,3.6rem)]'

  return (
    <div className={`relative ${leaving ? 'animate-card-out' : 'animate-card-in'}`}>
      <div
        className={`relative aspect-[4/5] w-[min(76vw,54vh)] rounded-[2.4rem] shadow-[0_14px_0_rgba(36,49,94,0.18)] ${
          special
            ? 'bg-[conic-gradient(from_200deg,#FF9FB2,#FFC83D,#6FE3D0,#8FB8FF,#B79CFF,#FF9FB2)] p-[3.2%]'
            : 'border-[6px] border-ink bg-paper'
        }`}
      >
        <div
          className={`grid h-full w-full grid-rows-[1fr_auto] overflow-hidden bg-paper ${
            special ? 'rounded-[2rem] border-[5px] border-ink' : 'rounded-[2rem]'
          }`}
        >
          <div className="relative m-[5%] mb-0 overflow-hidden rounded-[1.5rem] bg-cloud">
            <img
              src={card.imageUrl}
              alt=""
              draggable={false}
              className="pointer-events-none absolute inset-0 h-full w-full select-none object-cover"
            />
          </div>
          <div className="flex items-center justify-center px-[6%] py-[5%]">
            <span
              className={`block font-display leading-none tracking-wide ${wordSize} ${
                special ? 'text-coral' : 'text-ink'
              } ${speaking ? 'animate-speak' : ''}`}
            >
              {card.word}
            </span>
          </div>
        </div>

        {special && (
          <>
            <div className="absolute -top-[4.5%] left-1/2 -translate-x-1/2 whitespace-nowrap rounded-full border-[4px] border-ink bg-sun px-[1.1em] py-[0.25em] font-display text-[min(4.6vmin,1.5rem)] text-ink shadow-[0_4px_0_rgba(36,49,94,0.25)]">
              ♥ 우리 가족
            </div>
            <Sparkle className="-left-[3%] top-[18%]" delay="0s" />
            <Sparkle className="-right-[3%] top-[40%]" delay=".6s" />
            <Sparkle className="-left-[2%] bottom-[16%]" delay="1.1s" />
          </>
        )}
      </div>
    </div>
  )
}
