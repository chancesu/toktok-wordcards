/**
 * 업로드한 사진을 긴 변 maxSide 픽셀 JPEG data URL로 줄인다.
 * 원본 그대로 저장하면 휴대폰 사진 한 장이 수 MB라 저장소가 금방 찬다.
 */
export async function fileToResizedDataUrl(file: File, maxSide = 900): Promise<string> {
  if (!file.type.startsWith('image/')) {
    throw new Error('사진 파일만 올릴 수 있어요.')
  }
  const url = URL.createObjectURL(file)
  try {
    const img = await new Promise<HTMLImageElement>((resolve, reject) => {
      const el = new Image()
      el.onload = () => resolve(el)
      el.onerror = () =>
        reject(new Error('이 사진 형식은 열 수 없어요. JPG나 PNG 사진으로 올려 주세요.'))
      el.src = url
    })
    const scale = Math.min(1, maxSide / Math.max(img.naturalWidth, img.naturalHeight))
    const w = Math.max(1, Math.round(img.naturalWidth * scale))
    const h = Math.max(1, Math.round(img.naturalHeight * scale))
    const canvas = document.createElement('canvas')
    canvas.width = w
    canvas.height = h
    const g = canvas.getContext('2d')
    if (!g) throw new Error('사진을 처리하지 못했어요. 다시 시도해 주세요.')
    g.fillStyle = '#ffffff'
    g.fillRect(0, 0, w, h)
    g.drawImage(img, 0, 0, w, h)
    return canvas.toDataURL('image/jpeg', 0.85)
  } finally {
    URL.revokeObjectURL(url)
  }
}
