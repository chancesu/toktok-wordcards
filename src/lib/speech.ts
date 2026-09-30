/**
 * Web Speech API(TTS) 래퍼.
 * - speak()는 발화가 끝나면 resolve되는 Promise를 돌려준다 → 이 시간 동안 입력을 잠근다.
 * - onend가 오지 않는 브라우저 버그/음성 미지원 환경을 위해 길이 기반 타임아웃으로 반드시 resolve.
 * - iOS Safari는 사용자 제스처 콜스택 안에서 speak()를 불러야 하므로 동기적으로 호출한다.
 */

let koVoice: SpeechSynthesisVoice | null = null

function pickVoice() {
  if (!('speechSynthesis' in window)) return
  const voices = window.speechSynthesis.getVoices()
  const ko = voices.filter((v) => v.lang?.toLowerCase().startsWith('ko'))
  // 로컬(오프라인) 음성을 우선: 네트워크 음성은 첫 발화가 늦을 수 있음
  koVoice = ko.find((v) => v.localService) ?? ko[0] ?? null
}

export function warmUpSpeech() {
  if (!('speechSynthesis' in window)) return
  pickVoice()
  window.speechSynthesis.onvoiceschanged = pickVoice
}

export function isSpeechSupported(): boolean {
  return typeof window !== 'undefined' && 'speechSynthesis' in window
}

export function cancelSpeech() {
  try {
    window.speechSynthesis?.cancel()
  } catch {
    /* noop */
  }
}

export function speak(text: string): Promise<void> {
  const estimate = 1400 + Array.from(text).length * 450
  if (!isSpeechSupported()) {
    return new Promise((r) => setTimeout(r, 900))
  }
  return new Promise((resolve) => {
    let done = false
    const finish = () => {
      if (done) return
      done = true
      clearTimeout(timer)
      resolve()
    }
    const timer = setTimeout(finish, estimate)
    try {
      const synth = window.speechSynthesis
      synth.cancel() // 이전 발화가 남아 있으면 겹치지 않게 제거
      const u = new SpeechSynthesisUtterance(text)
      u.lang = 'ko-KR'
      if (koVoice) u.voice = koVoice
      u.rate = 0.8 // 아이가 듣기 좋게 천천히
      u.pitch = 1.15
      u.volume = 1
      u.onend = finish
      u.onerror = finish
      synth.speak(u)
    } catch {
      finish()
    }
  })
}
