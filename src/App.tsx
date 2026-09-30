import { useCallback, useEffect, useReducer, useRef, useState } from 'react'
import type { ReactElement } from 'react'
import type { WordCard } from './types'
import { BALL_TAPS_TO_BURST, CARD_PLAYS_BEFORE_EXIT, initialPlayState, playReducer } from './machine'
import { TIMING } from './timing'
import { createDefaultDeck } from './data/defaultDeck'
import { loadDeck, saveDeck, type PersistMode } from './lib/storage'
import { playBoing, playPop, playWhoosh, unlockAudio } from './lib/sound'
import { cancelSpeech, speak, warmUpSpeech } from './lib/speech'
import { usePointerTracker, useSingleTap } from './hooks/usePointerGuard'
import { BurstingBall, SurpriseBall } from './components/SurpriseBall'
import { BurstParticles } from './components/BurstParticles'
import { WordCardView } from './components/WordCardView'
import { TapDots } from './components/TapDots'
import { ParentCorner } from './components/ParentCorner'
import { AdminGate } from './components/AdminGate'
import { AdminPanel } from './components/AdminPanel'

type Mode = 'play' | 'gate' | 'admin'

function Backdrop() {
  return (
    <div className="pointer-events-none absolute inset-0 overflow-hidden" aria-hidden="true">
      <div className="absolute left-[8%] top-[12%] h-[9vmin] w-[24vmin] animate-drift rounded-full bg-white/80" />
      <div className="absolute right-[6%] top-[26%] h-[7vmin] w-[18vmin] animate-drift rounded-full bg-white/70 [animation-delay:-9s]" />
      <div className="absolute left-[30%] top-[6%] h-[5vmin] w-[12vmin] animate-drift rounded-full bg-white/60 [animation-delay:-17s]" />
      <div className="absolute -bottom-[28vmin] left-1/2 h-[46vmin] w-[170vmax] -translate-x-1/2 rounded-[50%] bg-[#9ADFA8]" />
      <div className="absolute -bottom-[34vmin] -left-[20vmin] h-[50vmin] w-[90vmin] rounded-[50%] bg-[#7ACF8E]" />
    </div>
  )
}

export default function App() {
  const [deck, setDeck] = useState<WordCard[]>(createDefaultDeck)
  const [persistMode, setPersistMode] = useState<PersistMode>('indexeddb')
  const [state, dispatch] = useReducer(playReducer, initialPlayState)
  const [mode, setMode] = useState<Mode>('play')
  const [locked, setLocked] = useState(false)
  const [bounceKey, setBounceKey] = useState(0)
  const [speaking, setSpeaking] = useState(false)
  const [burstSeed, setBurstSeed] = useState<number | null>(null)
  const [showHint, setShowHint] = useState(true)

  /** 동기 잠금: 같은 프레임에 들어온 두 번째 이벤트도 여기서 막힌다 (state는 렌더 전까지 갱신되지 않음) */
  const lockRef = useRef(false)
  /** 보호자 모드 진입 등으로 흐름이 끊기면 증가 → 진행 중이던 비동기 콜백을 무효화 */
  const session = useRef(0)
  const timers = useRef(new Set<number>())
  const tracker = usePointerTracker()

  // ── 저장된 덱 불러오기 ─────────────────────────────
  useEffect(() => {
    let alive = true
    void loadDeck().then(({ deck: saved, mode: m }) => {
      if (!alive) return
      setPersistMode(m)
      if (saved) setDeck(saved)
    })
    warmUpSpeech()
    const t = window.setTimeout(() => setShowHint(false), 7000)
    return () => {
      alive = false
      clearTimeout(t)
    }
  }, [])

  // ── 타이머 & 잠금 유틸 ────────────────────────────
  const later = useCallback((fn: () => void, ms: number) => {
    const s = session.current
    const id = window.setTimeout(() => {
      timers.current.delete(id)
      if (s === session.current) fn()
    }, ms)
    timers.current.add(id)
  }, [])

  const acquire = () => {
    if (lockRef.current) return false
    lockRef.current = true
    setLocked(true)
    return true
  }
  const release = useCallback(() => {
    lockRef.current = false
    setLocked(false)
  }, [])

  /** 진행 중인 애니메이션·음성을 모두 끊고 잠금 해제 */
  const interrupt = useCallback(() => {
    session.current += 1
    timers.current.forEach((id) => clearTimeout(id))
    timers.current.clear()
    cancelSpeech()
    setSpeaking(false)
    setBurstSeed(null)
    release()
  }, [release])

  // 앱이 백그라운드로 가면 음성을 멈추고 현재 단계는 유지
  useEffect(() => {
    const onVis = () => {
      if (document.hidden) cancelSpeech()
    }
    document.addEventListener('visibilitychange', onVis)
    return () => document.removeEventListener('visibilitychange', onVis)
  }, [])

  // 브라우저 기본 제스처 차단: 핀치 줌, iOS 제스처, 길게 눌러 메뉴 (보호자 화면 제외)
  useEffect(() => {
    if (mode === 'admin') return
    const multi = (e: TouchEvent) => {
      if (e.touches.length > 1) e.preventDefault()
    }
    const block = (e: Event) => e.preventDefault()
    document.addEventListener('touchstart', multi, { passive: false })
    document.addEventListener('gesturestart', block)
    document.addEventListener('contextmenu', block)
    return () => {
      document.removeEventListener('touchstart', multi)
      document.removeEventListener('gesturestart', block)
      document.removeEventListener('contextmenu', block)
    }
  }, [mode])

  // 화면 꺼짐 방지 (지원·허용되는 환경에서만, 실패해도 무시)
  const wakeLock = useRef<{ release: () => Promise<void> } | null>(null)
  const requestWakeLock = () => {
    if (wakeLock.current) return
    const nav = navigator as Navigator & { wakeLock?: { request: (t: 'screen') => Promise<{ release: () => Promise<void> }> } }
    nav.wakeLock
      ?.request('screen')
      .then((l) => (wakeLock.current = l))
      .catch(() => undefined)
  }

  const card = deck.length > 0 ? deck[Math.min(state.index, deck.length - 1)] : null
  const phase = state.phase

  // ── 핵심 인터랙션 ────────────────────────────────
  const handleTap = () => {
    if (mode !== 'play' || !card) return
    if (phase.name !== 'ball' && phase.name !== 'card') return
    if (!acquire()) return

    unlockAudio()
    requestWakeLock()
    setShowHint(false)

    if (phase.name === 'ball') {
      const next = phase.taps + 1
      dispatch({ type: 'BALL_TAP' })
      if (next < BALL_TAPS_TO_BURST) {
        playBoing(next)
        setBounceKey((k) => k + 1)
        later(release, TIMING.ballBounce)
      } else {
        playPop()
        setBurstSeed(state.round)
        later(() => dispatch({ type: 'SHOW_CARD' }), TIMING.burstToCard)
        later(() => setBurstSeed(null), TIMING.particles)
        later(release, TIMING.burstToCard + TIMING.cardEnter)
      }
      return
    }

    // phase.name === 'card'
    if (phase.plays < CARD_PLAYS_BEFORE_EXIT) {
      dispatch({ type: 'CARD_PLAY' })
      setSpeaking(true)
      const s = session.current
      const started = performance.now()
      void speak(card.word).then(() => {
        if (s !== session.current) return
        setSpeaking(false)
        const rest = Math.max(0, TIMING.speakMin - (performance.now() - started))
        later(release, rest + TIMING.speakCooldown)
      })
    } else {
      playWhoosh()
      dispatch({ type: 'CARD_EXIT' })
      later(() => dispatch({ type: 'NEXT', deckSize: deck.length }), TIMING.cardExit)
      later(release, TIMING.cardExit + TIMING.ballEnter)
    }
  }

  const tap = useSingleTap(handleTap, tracker)

  // ── 보호자 모드 ─────────────────────────────────
  const openGate = () => {
    interrupt()
    setMode('gate')
  }
  const closeToPlay = () => {
    setMode('play')
    dispatch({ type: 'RESET', index: Math.min(state.index, Math.max(0, deck.length - 1)) })
  }
  const changeDeck = (next: WordCard[]) => {
    setDeck(next)
    void saveDeck(next, persistMode).then(setPersistMode)
  }

  // ── 렌더 ───────────────────────────────────────
  let stage: ReactElement
  let dots: ReactElement | null = null
  if (!card) {
    stage = (
      <div className="max-w-xs rounded-[2rem] bg-white/85 p-6 text-center">
        <p className="font-display text-2xl text-ink">카드가 없어요</p>
        <p className="mt-2 font-body text-sm text-ink/70">오른쪽 위 모서리를 3초 동안 눌러 보호자 모드에서 낱말을 추가해 주세요.</p>
      </div>
    )
  } else if (phase.name === 'ball') {
    stage = <SurpriseBall key={state.round} taps={phase.taps} bounceKey={bounceKey} />
    dots = <TapDots kind="ball" total={BALL_TAPS_TO_BURST} filled={phase.taps} />
  } else if (phase.name === 'bursting') {
    stage = <BurstingBall />
    dots = <TapDots kind="ball" total={BALL_TAPS_TO_BURST} filled={BALL_TAPS_TO_BURST} />
  } else {
    const plays = phase.name === 'card' ? phase.plays : CARD_PLAYS_BEFORE_EXIT
    stage = <WordCardView key={`${state.round}-${card.id}`} card={card} speaking={speaking} leaving={phase.name === 'leaving'} />
    dots = (
      <TapDots
        kind="card"
        total={CARD_PLAYS_BEFORE_EXIT}
        filled={plays}
        showNext={phase.name === 'card' && plays >= CARD_PLAYS_BEFORE_EXIT && !speaking}
      />
    )
  }

  const label =
    !card ? '카드 없음' : phase.name === 'ball' ? `깜짝 공, ${BALL_TAPS_TO_BURST - phase.taps}번 더 누르면 열려요` : `${card.word} 카드`

  return (
    <div className="app-surface fixed inset-0 select-none overflow-hidden">
      <Backdrop />

      <main className="absolute inset-0 flex flex-col items-center justify-center gap-[3vh] px-4">
        {/* 거대한 히트 영역: 공/카드 주변 거의 전체. 잠금 중에는 pointer-events 자체를 끈다 */}
        <div
          role="button"
          aria-label={label}
          aria-disabled={locked}
          {...tap}
          className="relative flex h-[min(78vh,820px)] w-[min(94vw,760px)] items-center justify-center rounded-[3rem]"
          style={{ pointerEvents: locked || mode !== 'play' ? 'none' : 'auto', touchAction: 'none' }}
        >
          {stage}
          {burstSeed !== null && <BurstParticles seed={burstSeed} />}
        </div>
        <div className="flex h-9 items-center">{dots}</div>
      </main>

      {mode === 'play' && <ParentCorner onUnlock={openGate} />}

      {showHint && mode === 'play' && (
        <p className="pointer-events-none absolute right-4 top-[max(1rem,env(safe-area-inset-top))] mr-20 max-w-[14rem] rounded-2xl bg-white/80 px-3 py-2 text-right font-body text-xs leading-snug text-ink/70">
          보호자 모드: 이 모서리를 3초 동안 누르세요
        </p>
      )}

      {mode === 'gate' && <AdminGate onPass={() => setMode('admin')} onCancel={closeToPlay} />}
      {mode === 'admin' && <AdminPanel deck={deck} persistMode={persistMode} onChange={changeDeck} onClose={closeToPlay} />}
    </div>
  )
}
