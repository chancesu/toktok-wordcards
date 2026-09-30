# 톡톡 낱말 카드 (유아용 낱말 카드 프로토타입)

React 19 + TypeScript + Tailwind CSS 3 + Vite.

```bash
npm install
npm run dev        # 개발 서버
npm run build      # 타입 체크 + 빌드 (dist/)
SINGLE=1 npx vite build   # JS/CSS가 모두 인라인된 index.html 한 장 (공유·태블릿 오프라인용)
```

## 배포 (GitHub Pages)

`main` 브랜치에 push하면 `.github/workflows/deploy.yml`이 빌드 후 GitHub Pages에 자동 배포합니다.

- 최초 1회: 저장소 **Settings → Pages → Source**를 **GitHub Actions**로 설정
- 주소: https://chancesu.github.io/toktok-wordcards/
- 수동 재배포: Actions 탭 → Deploy to GitHub Pages → Run workflow

## 플로우 (src/machine.ts)

```
ball(0) ─tap→ ball(1) ─tap→ ball(2) ─tap→ bursting ─480ms→ card(0)
card(0) ─tap·TTS→ card(1) ─tap·TTS→ card(2) ─tap·TTS→ card(3) ─tap→ leaving ─600ms→ ball(0) + 다음 단어
```

- 순수 reducer. 허용되지 않은 전이는 현재 상태를 그대로 반환하므로 늦게 도착한 타이머·중복 이벤트가 상태를 깨지 못함.
- 모든 애니메이션 길이와 입력 잠금 시간은 `src/timing.ts` 한 곳에서 관리.

## 연타·멀티터치 방어 (App.tsx, hooks/usePointerGuard.ts)

| 층 | 방식 |
|---|---|
| 동기 잠금 | `lockRef`(ref) — 같은 프레임에 들어온 두 번째 이벤트도 차단. 바운스/버스트/TTS/퇴장이 끝날 때까지 유지 |
| DOM 차단 | 잠금 중 히트 영역 `pointer-events: none` |
| 멀티터치 | window 캡처 단계에서 눌린 포인터 수 추적. 두 손가락 이상이 겹친 제스처는 **모든 손가락이 떨어질 때까지** 무효 (`isPrimary` 검사 포함) |
| 탭 판정 | 같은 포인터로 down→up 했을 때만 발화 (pointerup 기준: iOS TTS/오디오 허용 타이밍) |
| TTS 겹침 | 발화 전 `speechSynthesis.cancel()`, 종료(onend) 후 최소 700ms + 200ms 쿨다운 뒤 잠금 해제. onend 누락 대비 길이 기반 타임아웃 |
| 브라우저 제스처 | 핀치줌·iOS gesturestart·길게 눌러 메뉴 차단, `touch-action: none`, 이미지 드래그 불가 |
| 세션 토큰 | 보호자 모드 진입 시 진행 중 타이머·음성 콜백을 모두 무효화 |

## 보호자 모드

- 우측 상단 96×96px 투명 영역을 **3초** 누르고 있어야 열림 (1초 이후 옅은 진행 링 표시).
- 곱셈 문제(6~9단) 통과 후 진입. 틀리면 새 문제.
- 낱말 추가/수정/삭제(2단계 확인), 순서 변경, 일반/스페셜 필터, 사진 업로드(긴 변 900px JPEG로 축소), 소리 미리 듣기, 기본 덱 초기화, 전체 화면.
- 저장: IndexedDB → localStorage → 메모리 순으로 폴백 (`src/lib/storage.ts`).

## 데이터 모델

```ts
{ id: string; type: 'normal' | 'special'; word: string; imageUrl: string }
```

기본 덱은 일반 카드(사과·포도·바나나…) 사이에 스페셜 카드(엄마·아빠·할머니·할아버지·외할머니)를 섞어 둠.
스페셜 카드는 무지개 액자 + '우리 가족' 리본으로 구분.

## 효과음

오디오 파일 없이 Web Audio로 합성 (`src/lib/sound.ts`). 터치 횟수가 늘수록 '통' 소리가 높아짐.
