/**
 * 놀이 화면 상태 머신.
 *
 *   ball(0) ─tap→ ball(1) ─tap→ ball(2) ─tap→ bursting
 *   bursting ─(타이머)→ card(0)
 *   card(0) ─tap/TTS→ card(1) ─tap/TTS→ card(2) ─tap/TTS→ card(3)
 *   card(3) ─tap→ leaving ─(타이머)→ ball(0) + 다음 단어
 *
 * 허용되지 않은 전이는 현재 상태를 그대로 돌려주므로,
 * 늦게 도착한 타이머나 중복 이벤트가 상태를 망가뜨리지 않는다.
 */

export const BALL_TAPS_TO_BURST = 3
export const CARD_PLAYS_BEFORE_EXIT = 3

export type Phase =
  | { name: 'ball'; taps: number }
  | { name: 'bursting' }
  | { name: 'card'; plays: number }
  | { name: 'leaving' }

export interface PlayState {
  phase: Phase
  /** 덱에서 현재 단어 위치 */
  index: number
  /** 새 포켓볼이 등장할 때마다 증가 (컴포넌트 key로 사용해 등장 애니메이션을 재시작) */
  round: number
}

export type PlayAction =
  | { type: 'BALL_TAP' }
  | { type: 'SHOW_CARD' }
  | { type: 'CARD_PLAY' }
  | { type: 'CARD_EXIT' }
  | { type: 'NEXT'; deckSize: number }
  | { type: 'RESET'; index: number }

export const initialPlayState: PlayState = {
  phase: { name: 'ball', taps: 0 },
  index: 0,
  round: 0,
}

export function playReducer(s: PlayState, a: PlayAction): PlayState {
  const p = s.phase
  switch (a.type) {
    case 'BALL_TAP': {
      if (p.name !== 'ball') return s
      const taps = p.taps + 1
      return {
        ...s,
        phase: taps >= BALL_TAPS_TO_BURST ? { name: 'bursting' } : { name: 'ball', taps },
      }
    }
    case 'SHOW_CARD':
      if (p.name !== 'bursting') return s
      return { ...s, phase: { name: 'card', plays: 0 } }
    case 'CARD_PLAY':
      if (p.name !== 'card' || p.plays >= CARD_PLAYS_BEFORE_EXIT) return s
      return { ...s, phase: { name: 'card', plays: p.plays + 1 } }
    case 'CARD_EXIT':
      if (p.name !== 'card' || p.plays < CARD_PLAYS_BEFORE_EXIT) return s
      return { ...s, phase: { name: 'leaving' } }
    case 'NEXT':
      if (p.name !== 'leaving') return s
      return {
        phase: { name: 'ball', taps: 0 },
        index: a.deckSize > 0 ? (s.index + 1) % a.deckSize : 0,
        round: s.round + 1,
      }
    case 'RESET':
      return { phase: { name: 'ball', taps: 0 }, index: a.index, round: s.round + 1 }
  }
}
