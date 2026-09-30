export type CardType = 'normal' | 'special'

export interface WordCard {
  id: string
  type: CardType
  word: string
  /** data: URL (기본 일러스트 SVG 또는 업로드한 사진을 리사이즈한 JPEG) */
  imageUrl: string
}
