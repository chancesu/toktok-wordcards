import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { viteSingleFile } from 'vite-plugin-singlefile'

// SINGLE=1 이면 모든 JS/CSS를 index.html 하나로 인라인 (공유용 프로토타입 빌드)
// base: './' — GitHub Pages 하위 경로(/toktok-wordcards/)에서도 에셋 경로가 깨지지 않도록 상대 경로로 빌드
export default defineConfig({
  base: './',
  plugins: [react(), ...(process.env.SINGLE ? [viteSingleFile()] : [])],
})
