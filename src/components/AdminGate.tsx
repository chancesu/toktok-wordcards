import { useState } from 'react'

function makeQuestion() {
  const a = 6 + Math.floor(Math.random() * 4) // 6~9
  const b = 6 + Math.floor(Math.random() * 4)
  return { a, b, answer: a * b }
}

/** 보호자 확인: 곱셈 문제 + 큰 숫자 키패드 */
export function AdminGate({ onPass, onCancel }: { onPass: () => void; onCancel: () => void }) {
  const [q, setQ] = useState(makeQuestion)
  const [input, setInput] = useState('')
  const [wrong, setWrong] = useState(0)

  const press = (d: string) => setInput((v) => (v.length >= 3 ? v : v + d))
  const submit = () => {
    if (Number(input) === q.answer) {
      onPass()
    } else {
      setWrong((w) => w + 1)
      setInput('')
      setQ(makeQuestion())
    }
  }

  const key =
    'h-16 rounded-2xl border-[3px] border-ink bg-white font-display text-3xl text-ink shadow-[0_4px_0_#24315E] active:translate-y-[3px] active:shadow-[0_1px_0_#24315E] focus-visible:outline focus-visible:outline-4 focus-visible:outline-offset-2 focus-visible:outline-grape'

  return (
    <div className="absolute inset-0 z-40 flex items-center justify-center bg-ink/55 px-4 font-body" role="dialog" aria-modal="true" aria-labelledby="gate-title">
      <form
        className="w-full max-w-sm rounded-[2rem] border-[4px] border-ink bg-paper p-6 shadow-[0_12px_0_rgba(0,0,0,.2)]"
        onSubmit={(e) => {
          e.preventDefault()
          submit()
        }}
      >
        <p id="gate-title" className="text-center text-sm tracking-[0.2em] text-ink/60">
          보호자 확인
        </p>
        <p className="mt-2 text-center font-display text-4xl text-ink">
          {q.a} × {q.b} = ?
        </p>
        <div
          key={wrong}
          className={`mx-auto mt-4 flex h-16 w-40 items-center justify-center rounded-2xl border-[3px] border-dashed border-ink/40 bg-white font-display text-4xl tabular-nums text-ink ${wrong ? 'animate-shake' : ''}`}
          aria-live="polite"
        >
          {input || <span className="text-ink/25">—</span>}
        </div>
        <p className="mt-2 h-5 text-center text-sm text-coral">{wrong > 0 ? '틀렸어요. 새 문제를 풀어 주세요.' : ''}</p>

        <div className="mt-3 grid grid-cols-3 gap-3">
          {['1', '2', '3', '4', '5', '6', '7', '8', '9'].map((d) => (
            <button key={d} type="button" className={key} onClick={() => press(d)}>
              {d}
            </button>
          ))}
          <button type="button" className={`${key} text-xl`} onClick={() => setInput((v) => v.slice(0, -1))} aria-label="지우기">
            ⌫
          </button>
          <button type="button" className={key} onClick={() => press('0')}>
            0
          </button>
          <button type="submit" className={`${key} bg-mint text-xl text-white`} disabled={!input}>
            확인
          </button>
        </div>
        <button type="button" onClick={onCancel} className="mt-5 w-full rounded-2xl py-3 text-ink/70 underline underline-offset-4">
          닫고 놀이로 돌아가기
        </button>
      </form>
    </div>
  )
}
