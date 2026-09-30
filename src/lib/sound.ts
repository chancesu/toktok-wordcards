/**
 * 효과음은 파일 없이 Web Audio로 합성한다 (오프라인·용량 0).
 * 브라우저 자동재생 정책 때문에 첫 사용자 터치 안에서 unlockAudio()를 호출해야 한다.
 */

type Ctor = typeof AudioContext
let ctx: AudioContext | null = null
let noiseBuf: AudioBuffer | null = null

export function unlockAudio(): AudioContext | null {
  try {
    if (!ctx) {
      const AC: Ctor | undefined =
        window.AudioContext ?? (window as unknown as { webkitAudioContext?: Ctor }).webkitAudioContext
      if (!AC) return null
      ctx = new AC()
    }
    if (ctx.state === 'suspended') void ctx.resume()
  } catch {
    ctx = null
  }
  return ctx
}

function tone(
  from: number,
  to: number,
  dur: number,
  type: OscillatorType,
  peak: number,
  delay = 0,
) {
  const c = unlockAudio()
  if (!c) return
  const t0 = c.currentTime + delay
  const osc = c.createOscillator()
  const g = c.createGain()
  osc.type = type
  osc.frequency.setValueAtTime(from, t0)
  osc.frequency.exponentialRampToValueAtTime(Math.max(20, to), t0 + dur)
  g.gain.setValueAtTime(0.0001, t0)
  g.gain.exponentialRampToValueAtTime(peak, t0 + 0.012)
  g.gain.exponentialRampToValueAtTime(0.0001, t0 + dur)
  osc.connect(g).connect(c.destination)
  osc.start(t0)
  osc.stop(t0 + dur + 0.02)
}

function noise(dur: number, fFrom: number, fTo: number, peak: number, delay = 0) {
  const c = unlockAudio()
  if (!c) return
  if (!noiseBuf) {
    noiseBuf = c.createBuffer(1, c.sampleRate, c.sampleRate)
    const d = noiseBuf.getChannelData(0)
    for (let i = 0; i < d.length; i++) d[i] = Math.random() * 2 - 1
  }
  const t0 = c.currentTime + delay
  const src = c.createBufferSource()
  src.buffer = noiseBuf
  const bp = c.createBiquadFilter()
  bp.type = 'bandpass'
  bp.Q.value = 1.2
  bp.frequency.setValueAtTime(fFrom, t0)
  bp.frequency.exponentialRampToValueAtTime(fTo, t0 + dur)
  const g = c.createGain()
  g.gain.setValueAtTime(0.0001, t0)
  g.gain.exponentialRampToValueAtTime(peak, t0 + 0.02)
  g.gain.exponentialRampToValueAtTime(0.0001, t0 + dur)
  src.connect(bp).connect(g).connect(c.destination)
  src.start(t0)
  src.stop(t0 + dur + 0.02)
}

/** '통' — 터치 횟수가 늘수록 음이 조금씩 올라간다 */
export function playBoing(step: number) {
  const base = 150 + step * 55
  tone(base * 1.8, base, 0.3, 'sine', 0.55)
  tone(base * 3.6, base * 2, 0.1, 'triangle', 0.12)
}

/** 공이 터질 때: 팡 + 반짝이는 3화음 */
export function playPop() {
  noise(0.2, 2200, 500, 0.5)
  tone(420, 90, 0.18, 'sine', 0.5)
  ;[1047, 1319, 1568, 2093].forEach((f, i) => tone(f, f * 1.01, 0.22, 'triangle', 0.12, 0.08 + i * 0.06))
}

/** 카드 퇴장: 휙 */
export function playWhoosh() {
  noise(0.42, 350, 2600, 0.35)
}
