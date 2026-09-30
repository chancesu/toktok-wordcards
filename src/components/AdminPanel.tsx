import { useEffect, useRef, useState } from 'react'
import type { CardType, WordCard } from '../types'
import { createDefaultDeck, newId, placeholderArt } from '../data/defaultDeck'
import { fileToResizedDataUrl } from '../lib/image'
import type { PersistMode } from '../lib/storage'
import { speak } from '../lib/speech'

interface Props {
  deck: WordCard[]
  persistMode: PersistMode
  onChange: (deck: WordCard[]) => void
  onClose: () => void
}

type Filter = 'all' | CardType
interface Draft extends WordCard {
  isNew: boolean
}

const PERSIST_LABEL: Record<PersistMode, string> = {
  indexeddb: '이 브라우저(IndexedDB)에 저장돼요. 새로고침해도 유지돼요.',
  localstorage: '이 브라우저(localStorage)에 저장돼요. 사진이 많으면 공간이 부족할 수 있어요.',
  memory: '이 브라우저에서는 저장할 수 없어서, 새로고침하면 처음 상태로 돌아가요.',
}

const btn =
  'inline-flex items-center justify-center gap-1.5 rounded-xl border-2 border-ink px-3.5 py-2 text-sm font-bold text-ink transition active:translate-y-px focus-visible:outline focus-visible:outline-[3px] focus-visible:outline-offset-2 focus-visible:outline-grape disabled:opacity-40'

/** 두 번 눌러야 실행되는 위험 버튼 (confirm()은 쓰지 않음) */
function ConfirmButton({ label, confirmLabel, onConfirm, className = '' }: { label: string; confirmLabel: string; onConfirm: () => void; className?: string }) {
  const [armed, setArmed] = useState(false)
  useEffect(() => {
    if (!armed) return
    const t = setTimeout(() => setArmed(false), 3000)
    return () => clearTimeout(t)
  }, [armed])
  return (
    <button
      type="button"
      className={`${btn} ${armed ? 'border-coral bg-coral text-white' : 'bg-white'} ${className}`}
      onClick={() => (armed ? (setArmed(false), onConfirm()) : setArmed(true))}
    >
      {armed ? confirmLabel : label}
    </button>
  )
}

function TypeBadge({ type }: { type: CardType }) {
  return type === 'special' ? (
    <span className="rounded-full bg-sun px-2 py-0.5 text-xs font-bold text-ink">스페셜 · 가족</span>
  ) : (
    <span className="rounded-full bg-cloud px-2 py-0.5 text-xs font-bold text-ink/70">일반</span>
  )
}

function Editor({ draft, onSave, onCancel }: { draft: Draft; onSave: (c: WordCard) => void; onCancel: () => void }) {
  const [d, setD] = useState<Draft>(draft)
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)
  const fileRef = useRef<HTMLInputElement>(null)
  const usesPlaceholder = d.imageUrl.startsWith('data:image/svg')

  const pick = async (file: File | undefined) => {
    if (!file) return
    setBusy(true)
    setError('')
    try {
      const url = await fileToResizedDataUrl(file)
      setD((x) => ({ ...x, imageUrl: url }))
    } catch (e) {
      setError(e instanceof Error ? e.message : '사진을 불러오지 못했어요.')
    } finally {
      setBusy(false)
      if (fileRef.current) fileRef.current.value = ''
    }
  }

  const save = () => {
    const word = d.word.trim()
    if (!word) return setError('낱말을 입력해 주세요.')
    if (Array.from(word).length > 10) return setError('낱말은 10글자까지 쓸 수 있어요.')
    const imageUrl = d.isNew && usesPlaceholder ? placeholderArt(word, d.type) : d.imageUrl
    onSave({ id: d.id, type: d.type, word, imageUrl })
  }

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-ink/50 sm:items-center sm:px-4" role="dialog" aria-modal="true" aria-labelledby="editor-title">
      <form
        className="max-h-[92%] w-full max-w-md overflow-y-auto rounded-t-[2rem] border-[3px] border-ink bg-paper p-5 sm:rounded-[2rem]"
        onSubmit={(e) => {
          e.preventDefault()
          save()
        }}
      >
        <h2 id="editor-title" className="font-display text-2xl text-ink">
          {d.isNew ? '새 낱말 카드' : '카드 고치기'}
        </h2>

        <label htmlFor="card-word" className="mt-4 block text-sm font-bold text-ink/70">
          낱말
        </label>
        <input
          id="card-word"
          value={d.word}
          maxLength={20}
          autoComplete="off"
          placeholder="예: 이모, 기린, 비행기"
          onChange={(e) => setD((x) => ({ ...x, word: e.target.value }))}
          className="mt-1 w-full rounded-xl border-2 border-ink bg-white px-3 py-2.5 font-display text-2xl text-ink outline-none focus:border-grape"
        />

        <fieldset className="mt-4">
          <legend className="text-sm font-bold text-ink/70">카드 종류</legend>
          <div className="mt-1 grid grid-cols-2 gap-2">
            {(
              [
                ['normal', '일반', '과일, 동물, 탈것 등'],
                ['special', '스페셜', '가족 호칭 · 가족사진'],
              ] as const
            ).map(([value, label, hint]) => (
              <label
                key={value}
                className={`cursor-pointer rounded-xl border-2 px-3 py-2 ${d.type === value ? 'border-ink bg-sun/60' : 'border-ink/25 bg-white'}`}
              >
                <input
                  type="radio"
                  name="card-type"
                  id={`card-type-${value}`}
                  value={value}
                  checked={d.type === value}
                  onChange={() => setD((x) => ({ ...x, type: value }))}
                  className="sr-only"
                />
                <span className="block font-bold text-ink">{label}</span>
                <span className="block text-xs text-ink/60">{hint}</span>
              </label>
            ))}
          </div>
        </fieldset>

        <p className="mt-4 text-sm font-bold text-ink/70">그림 · 사진</p>
        <div className="mt-1 flex items-start gap-3">
          <div className="relative h-28 w-28 shrink-0 overflow-hidden rounded-2xl border-2 border-ink bg-cloud">
            <img src={d.isNew && usesPlaceholder ? placeholderArt(d.word || '?', d.type) : d.imageUrl} alt="카드 그림 미리보기" className="h-full w-full object-cover" />
            {busy && <div className="absolute inset-0 flex items-center justify-center bg-white/70 text-sm text-ink">줄이는 중…</div>}
          </div>
          <div className="flex min-w-0 flex-col gap-2">
            <input ref={fileRef} id="card-photo" type="file" accept="image/*" className="sr-only" onChange={(e) => pick(e.target.files?.[0])} />
            <label htmlFor="card-photo" className={`${btn} cursor-pointer bg-mint text-white`}>
              사진 올리기
            </label>
            <button
              type="button"
              className={`${btn} bg-white`}
              onClick={() => setD((x) => ({ ...x, imageUrl: placeholderArt(x.word || '?', x.type) }))}
            >
              기본 그림으로
            </button>
            <p className="text-xs leading-relaxed text-ink/60">사진은 자동으로 작게 줄여서 이 기기에만 저장해요.</p>
          </div>
        </div>

        <p className="mt-3 min-h-5 text-sm text-coral" role="alert">
          {error}
        </p>

        <div className="mt-2 flex flex-wrap items-center gap-2">
          <button type="button" className={`${btn} bg-white`} onClick={() => d.word.trim() && void speak(d.word.trim())} disabled={!d.word.trim()}>
            🔈 소리 들어보기
          </button>
          <span className="flex-1" />
          <button type="button" className={`${btn} border-transparent`} onClick={onCancel}>
            취소
          </button>
          <button type="submit" className={`${btn} bg-ink text-white`} disabled={busy}>
            저장
          </button>
        </div>
      </form>
    </div>
  )
}

/** 부모용 관리자 화면: 추가 · 수정 · 삭제 · 순서 변경 · 초기화 */
export function AdminPanel({ deck, persistMode, onChange, onClose }: Props) {
  const [filter, setFilter] = useState<Filter>('all')
  const [draft, setDraft] = useState<Draft | null>(null)
  const [fsError, setFsError] = useState('')

  const counts = {
    all: deck.length,
    normal: deck.filter((c) => c.type === 'normal').length,
    special: deck.filter((c) => c.type === 'special').length,
  }
  const visible = deck.filter((c) => filter === 'all' || c.type === filter)

  const move = (id: string, dir: -1 | 1) => {
    const i = deck.findIndex((c) => c.id === id)
    const j = i + dir
    if (i < 0 || j < 0 || j >= deck.length) return
    const next = deck.slice()
    ;[next[i], next[j]] = [next[j], next[i]]
    onChange(next)
  }

  const save = (card: WordCard) => {
    const exists = deck.some((c) => c.id === card.id)
    onChange(exists ? deck.map((c) => (c.id === card.id ? card : c)) : [...deck, card])
    setDraft(null)
  }

  const toggleFullscreen = async () => {
    setFsError('')
    try {
      if (document.fullscreenElement) await document.exitFullscreen()
      else await document.documentElement.requestFullscreen()
    } catch {
      setFsError('이 화면에서는 전체 화면을 쓸 수 없어요.')
    }
  }

  return (
    <div className="absolute inset-0 z-40 overflow-y-auto bg-[#F4F8FF] font-body text-ink" style={{ touchAction: 'pan-y' }}>
      <header className="sticky top-0 z-10 border-b-2 border-ink/10 bg-[#F4F8FF]/95 px-4 py-3 backdrop-blur">
        <div className="mx-auto flex max-w-3xl flex-wrap items-center gap-2">
          <div className="min-w-0 flex-1">
            <p className="text-xs tracking-[0.2em] text-ink/50">보호자 모드</p>
            <h1 className="font-display text-2xl leading-tight">낱말 카드 관리</h1>
          </div>
          <button type="button" className={`${btn} bg-white`} onClick={toggleFullscreen}>
            전체 화면
          </button>
          <button type="button" className={`${btn} bg-ink text-white`} onClick={onClose}>
            놀이로 돌아가기
          </button>
        </div>
      </header>

      <main className="mx-auto max-w-3xl px-4 pb-16 pt-4">
        {fsError && <p className="mb-3 text-sm text-coral">{fsError}</p>}

        <div className="flex flex-wrap items-center gap-2">
          {(
            [
              ['all', '전체'],
              ['normal', '일반'],
              ['special', '스페셜'],
            ] as const
          ).map(([value, label]) => (
            <button
              key={value}
              type="button"
              onClick={() => setFilter(value)}
              aria-pressed={filter === value}
              className={`rounded-full border-2 px-3.5 py-1.5 text-sm font-bold ${filter === value ? 'border-ink bg-ink text-white' : 'border-ink/20 bg-white text-ink/70'}`}
            >
              {label} <span className="tabular-nums opacity-70">{counts[value]}</span>
            </button>
          ))}
          <span className="flex-1" />
          <button
            type="button"
            className={`${btn} bg-mint text-white`}
            onClick={() =>
              setDraft({ id: newId(), type: filter === 'special' ? 'special' : 'normal', word: '', imageUrl: placeholderArt('?', 'normal'), isNew: true })
            }
          >
            ＋ 낱말 추가
          </button>
        </div>

        {visible.length === 0 ? (
          <div className="mt-8 rounded-3xl border-2 border-dashed border-ink/25 bg-white p-8 text-center">
            <p className="font-display text-xl">아직 카드가 없어요</p>
            <p className="mt-1 text-sm text-ink/60">‘낱말 추가’를 눌러 첫 카드를 만들어 주세요.</p>
          </div>
        ) : (
          <ol className="mt-4 grid gap-2.5">
            {visible.map((card) => {
              const pos = deck.findIndex((c) => c.id === card.id)
              return (
                <li key={card.id} className="flex items-center gap-3 rounded-2xl border-2 border-ink/10 bg-white p-2.5 pr-3">
                  <span className="w-6 text-center text-sm tabular-nums text-ink/40">{pos + 1}</span>
                  <img src={card.imageUrl} alt="" className="h-16 w-16 shrink-0 rounded-xl border-2 border-ink/10 object-cover" />
                  <div className="min-w-0 flex-1">
                    <p className="truncate font-display text-2xl leading-tight">{card.word}</p>
                    <div className="mt-1">
                      <TypeBadge type={card.type} />
                    </div>
                  </div>
                  <div className="flex flex-wrap items-center justify-end gap-1.5">
                    <button type="button" className={`${btn} bg-white px-2.5`} aria-label={`${card.word} 듣기`} onClick={() => void speak(card.word)}>
                      🔈
                    </button>
                    {filter === 'all' && (
                      <>
                        <button type="button" className={`${btn} bg-white px-2.5`} aria-label="위로" disabled={pos === 0} onClick={() => move(card.id, -1)}>
                          ↑
                        </button>
                        <button type="button" className={`${btn} bg-white px-2.5`} aria-label="아래로" disabled={pos === deck.length - 1} onClick={() => move(card.id, 1)}>
                          ↓
                        </button>
                      </>
                    )}
                    <button type="button" className={`${btn} bg-white`} onClick={() => setDraft({ ...card, isNew: false })}>
                      수정
                    </button>
                    <ConfirmButton label="삭제" confirmLabel="정말 삭제" onConfirm={() => onChange(deck.filter((c) => c.id !== card.id))} />
                  </div>
                </li>
              )
            })}
          </ol>
        )}

        <section className="mt-10 rounded-3xl bg-white p-5">
          <h2 className="font-display text-lg">저장 · 초기화</h2>
          <p className="mt-1 text-sm leading-relaxed text-ink/70">{PERSIST_LABEL[persistMode]}</p>
          <div className="mt-3">
            <ConfirmButton label="처음 카드로 되돌리기" confirmLabel="모두 지우고 되돌리기" onConfirm={() => onChange(createDefaultDeck())} />
          </div>
        </section>
      </main>

      {draft && <Editor draft={draft} onSave={save} onCancel={() => setDraft(null)} />}
    </div>
  )
}
