import type { CardType, WordCard } from '../types'

const svgUrl = (svg: string) => `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svg)}`

/** 이모지 한 개를 크게 그린 파스텔 일러스트 (일반 카드 기본 이미지) */
export function emojiArt(emoji: string, bg: string): string {
  return svgUrl(`<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 400 400">
  <rect width="400" height="400" fill="${bg}"/>
  <circle cx="200" cy="210" r="150" fill="#ffffff" opacity=".55"/>
  <text x="200" y="228" font-size="210" text-anchor="middle" dominant-baseline="middle"
    font-family="'Apple Color Emoji','Segoe UI Emoji','Noto Color Emoji',sans-serif">${emoji}</text>
</svg>`)
}

/** 가족사진 자리 표시 (스페셜 카드 기본 이미지) */
export function familyArt(bg: string, hair: string): string {
  return svgUrl(`<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 400 400">
  <rect width="400" height="400" fill="${bg}"/>
  <circle cx="200" cy="165" r="78" fill="#FFE3CC"/>
  <path d="M122 160c0-52 36-86 78-86s78 34 78 86c-18-26-46-38-78-38s-60 12-78 38z" fill="${hair}"/>
  <circle cx="172" cy="170" r="8" fill="#24315E"/><circle cx="228" cy="170" r="8" fill="#24315E"/>
  <path d="M176 200q24 20 48 0" stroke="#24315E" stroke-width="7" fill="none" stroke-linecap="round"/>
  <circle cx="152" cy="192" r="11" fill="#FF9FB2" opacity=".7"/><circle cx="248" cy="192" r="11" fill="#FF9FB2" opacity=".7"/>
  <path d="M70 400c10-80 64-124 130-124s120 44 130 124z" fill="#ffffff" opacity=".85"/>
  <rect x="96" y="326" width="208" height="44" rx="22" fill="#24315E" opacity=".82"/>
  <text x="200" y="349" font-size="22" text-anchor="middle" dominant-baseline="middle" fill="#fff"
    font-family="'Gowun Dodum','Apple SD Gothic Neo','Malgun Gothic',sans-serif">사진을 넣어 주세요</text>
</svg>`)
}

const PASTELS = ['#FFD9D6', '#E6DAFF', '#FFF1B8', '#D5F5DC', '#D6E8FF', '#FDE7C8']

/** 사진 없이 새 단어를 만들었을 때 쓰는 기본 그림: 첫 글자를 크게 */
export function placeholderArt(word: string, type: CardType): string {
  if (type === 'special') return familyArt('#FFE9F0', '#6B4A3A')
  const ch = Array.from(word.trim())[0] ?? '?'
  const bg = PASTELS[(ch.codePointAt(0) ?? 0) % PASTELS.length]
  return svgUrl(`<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 400 400">
  <rect width="400" height="400" fill="${bg}"/>
  <circle cx="200" cy="200" r="140" fill="#ffffff" opacity=".6"/>
  <text x="200" y="214" font-size="170" text-anchor="middle" dominant-baseline="middle" fill="#24315E"
    font-family="'Jua','Apple SD Gothic Neo','Malgun Gothic',sans-serif">${ch.replace(/[<&>"]/g, '')}</text>
</svg>`)
}

/** 초기 더미 데이터: 일반 카드 사이사이에 가족(스페셜) 카드를 섞어 둔다 */
export function createDefaultDeck(): WordCard[] {
  const n = (id: string, word: string, emoji: string, bg: string): WordCard => ({
    id,
    type: 'normal',
    word,
    imageUrl: emojiArt(emoji, bg),
  })
  const s = (id: string, word: string, bg: string, hair: string): WordCard => ({
    id,
    type: 'special',
    word,
    imageUrl: familyArt(bg, hair),
  })
  return [
    n('w-apple', '사과', '🍎', '#FFD9D6'),
    s('f-mom', '엄마', '#FFE4EC', '#5A3A2E'),
    n('w-grape', '포도', '🍇', '#E6DAFF'),
    s('f-dad', '아빠', '#DDEBFF', '#2E2A28'),
    n('w-banana', '바나나', '🍌', '#FFF1B8'),
    s('f-grandma', '할머니', '#F1E6FF', '#C9C4D6'),
    n('w-strawberry', '딸기', '🍓', '#FFD6E4'),
    s('f-grandpa', '할아버지', '#E2F4E6', '#B8B8B8'),
    n('w-watermelon', '수박', '🍉', '#D5F5DC'),
    s('f-maternal-grandma', '외할머니', '#FFEBD6', '#D8D2CC'),
    n('w-dog', '강아지', '🐶', '#F4E3CF'),
    n('w-car', '자동차', '🚗', '#D6E8FF'),
  ]
}

export function newId(): string {
  try {
    if (typeof crypto !== 'undefined' && 'randomUUID' in crypto) return crypto.randomUUID()
  } catch {
    /* 비보안 컨텍스트에서는 randomUUID가 없을 수 있음 */
  }
  return `w-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`
}
