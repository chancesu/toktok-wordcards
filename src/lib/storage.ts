import type { WordCard } from '../types'

/**
 * 덱 저장소. IndexedDB → localStorage → 메모리 순서로 폴백한다.
 * 사진이 data URL로 들어가므로 용량 여유가 큰 IndexedDB가 기본이다.
 */
export type PersistMode = 'indexeddb' | 'localstorage' | 'memory'

const DB_NAME = 'toktok-wordcards'
const STORE = 'kv'
const KEY = 'deck-v1'

function withTimeout<T>(p: Promise<T>, ms: number): Promise<T> {
  return new Promise((resolve, reject) => {
    const t = setTimeout(() => reject(new Error('timeout')), ms)
    p.then(
      (v) => {
        clearTimeout(t)
        resolve(v)
      },
      (e) => {
        clearTimeout(t)
        reject(e)
      },
    )
  })
}

let dbPromise: Promise<IDBDatabase> | null = null

function openDb(): Promise<IDBDatabase> {
  if (dbPromise) return dbPromise
  dbPromise = withTimeout(
    new Promise<IDBDatabase>((resolve, reject) => {
      if (typeof indexedDB === 'undefined') return reject(new Error('IndexedDB 없음'))
      const req = indexedDB.open(DB_NAME, 1)
      req.onupgradeneeded = () => req.result.createObjectStore(STORE)
      req.onsuccess = () => resolve(req.result)
      req.onerror = () => reject(req.error)
      req.onblocked = () => reject(new Error('blocked'))
    }),
    2500,
  ).catch((e) => {
    dbPromise = null
    throw e
  })
  return dbPromise
}

async function idbGet<T>(key: string): Promise<T | undefined> {
  const db = await openDb()
  return new Promise((resolve, reject) => {
    const req = db.transaction(STORE, 'readonly').objectStore(STORE).get(key)
    req.onsuccess = () => resolve(req.result as T | undefined)
    req.onerror = () => reject(req.error)
  })
}

async function idbSet(key: string, value: unknown): Promise<void> {
  const db = await openDb()
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE, 'readwrite')
    tx.objectStore(STORE).put(value, key)
    tx.oncomplete = () => resolve()
    tx.onerror = () => reject(tx.error)
    tx.onabort = () => reject(tx.error)
  })
}

function isDeck(v: unknown): v is WordCard[] {
  return (
    Array.isArray(v) &&
    v.every(
      (c) =>
        c &&
        typeof c.id === 'string' &&
        typeof c.word === 'string' &&
        typeof c.imageUrl === 'string' &&
        (c.type === 'normal' || c.type === 'special'),
    )
  )
}

export async function loadDeck(): Promise<{ deck: WordCard[] | null; mode: PersistMode }> {
  try {
    const d = await idbGet<unknown>(KEY)
    return { deck: isDeck(d) ? d : null, mode: 'indexeddb' }
  } catch {
    try {
      const raw = localStorage.getItem(KEY)
      const d = raw ? (JSON.parse(raw) as unknown) : null
      return { deck: isDeck(d) ? d : null, mode: 'localstorage' }
    } catch {
      return { deck: null, mode: 'memory' }
    }
  }
}

/** 저장 후 실제로 사용된 저장 방식을 돌려준다 */
export async function saveDeck(deck: WordCard[], preferred: PersistMode): Promise<PersistMode> {
  if (preferred === 'indexeddb') {
    try {
      await idbSet(KEY, deck)
      return 'indexeddb'
    } catch {
      /* 아래로 폴백 */
    }
  }
  if (preferred !== 'memory') {
    try {
      localStorage.setItem(KEY, JSON.stringify(deck))
      return 'localstorage'
    } catch {
      /* 용량 초과 등 */
    }
  }
  return 'memory'
}
