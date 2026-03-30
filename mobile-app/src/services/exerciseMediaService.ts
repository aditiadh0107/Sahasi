// exerciseMediaService.ts
// Fetches 3D anatomy exercise GIFs from ExerciseDB API.
// Uses a two-level cache: AsyncStorage (persists across sessions) + in-memory Map (fast lookups).
// All API calls go through this file — never call fetch directly from components.

import AsyncStorage from '@react-native-async-storage/async-storage'
import { EXERCISEDB_BASE_URL, EXERCISEDB_HEADERS } from '@/src/config/apiConfig'
import EXERCISE_DB_NAMES from '@/src/data/exerciseNameMap'

// ── Cache keys ────────────────────────────────────────────────────────────────
const GIF_CACHE_KEY = 'exercisedb_gif_v1'      // exerciseId → gifUrl
const NAME_MAP_KEY  = 'exercisedb_namemap_v1'  // lowercase exercise name → gifUrl

// ── In-memory caches ──────────────────────────────────────────────────────────
const gifCache  = new Map<string, string | null>()  // exerciseId → gifUrl
const nameToGif = new Map<string, string>()          // lowercase name → gifUrl
const pending   = new Map<string, Promise<string | null>>()

let gifCacheLoaded  = false
let nameMapLoaded   = false

// ── Storage helpers ───────────────────────────────────────────────────────────

async function loadGifCache() {
  if (gifCacheLoaded) return
  gifCacheLoaded = true
  try {
    const raw = await AsyncStorage.getItem(GIF_CACHE_KEY)
    if (raw) {
      const obj = JSON.parse(raw) as Record<string, string | null>
      Object.entries(obj).forEach(([k, v]) => gifCache.set(k, v))
    }
  } catch {
    console.log('[exerciseMediaService] failed to load gif cache')
  }
}

async function loadNameMap() {
  if (nameMapLoaded) return
  nameMapLoaded = true
  try {
    const raw = await AsyncStorage.getItem(NAME_MAP_KEY)
    if (raw) {
      const obj = JSON.parse(raw) as Record<string, string>
      Object.entries(obj).forEach(([k, v]) => nameToGif.set(k, v))
    }
  } catch {
    console.log('[exerciseMediaService] failed to load name map')
  }
}

function saveGifCache() {
  try {
    const obj: Record<string, string | null> = {}
    gifCache.forEach((v, k) => { obj[k] = v })
    AsyncStorage.setItem(GIF_CACHE_KEY, JSON.stringify(obj))
  } catch { /* ignore */ }
}

function saveNameMap() {
  try {
    const obj: Record<string, string> = {}
    nameToGif.forEach((v, k) => { obj[k] = v })
    AsyncStorage.setItem(NAME_MAP_KEY, JSON.stringify(obj))
  } catch { /* ignore */ }
}

// ── API calls ─────────────────────────────────────────────────────────────────

// Fetch all exercises for a target muscle and populate nameToGif map
async function fetchByTarget(target: string): Promise<void> {
  try {
    const res = await fetch(
      `${EXERCISEDB_BASE_URL}/exercises/target/${encodeURIComponent(target)}`,
      { headers: EXERCISEDB_HEADERS }
    )
    if (!res.ok) return
    const exercises: any[] = await res.json()
    if (Array.isArray(exercises)) {
      exercises.forEach(ex => {
        if (ex.name && ex.gifUrl) {
          nameToGif.set(ex.name.toLowerCase(), ex.gifUrl)
        }
      })
    }
  } catch {
    console.log('[exerciseMediaService] fetchByTarget failed:', target)
  }
}

// Fallback: search by name directly
async function fetchByName(name: string): Promise<string | null> {
  try {
    const res = await fetch(
      `${EXERCISEDB_BASE_URL}/exercises/name/${encodeURIComponent(name)}?limit=1`,
      { headers: EXERCISEDB_HEADERS }
    )
    if (!res.ok) return null
    const data: any[] = await res.json()
    return Array.isArray(data) && data.length > 0 ? (data[0].gifUrl ?? null) : null
  } catch {
    console.log('[exerciseMediaService] fetchByName failed:', name)
    return null
  }
}

// ── Prefetch all exercises for all tabs ───────────────────────────────────────

// Tab → ExerciseDB target muscles (per user spec)
const ALL_TARGETS = [
  'chest', 'back', 'upper arms', 'shoulders', 'upper legs', 'lower legs',  // strength
  'traps',                                                                    // self-defence
  'cardiovascular system',                                                    // cardio
  'spine', 'upper back', 'glutes',                                           // flexibility
  'abs', 'waist',                                                             // core
]

let prefetchDone    = false
let prefetchPromise: Promise<void> | null = null

// Call this once when the workout screen mounts.
// Fetches all exercise GIFs by target muscle and caches them.
// Subsequent app opens use AsyncStorage so no API calls are needed.
export async function prefetchAllExercises(): Promise<void> {
  if (prefetchDone) return
  if (prefetchPromise) return prefetchPromise

  prefetchPromise = (async () => {
    await loadNameMap()

    // If we already have data in the name map, skip re-fetching
    if (nameToGif.size > 50) {
      prefetchDone = true
      return
    }

    for (const target of ALL_TARGETS) {
      await fetchByTarget(target)
    }

    saveNameMap()
    prefetchDone = true
  })()

  return prefetchPromise
}

// ── Main export ───────────────────────────────────────────────────────────────

export async function getExerciseGifUrl(exerciseId: string): Promise<string | null> {
  await loadGifCache()

  if (gifCache.has(exerciseId)) return gifCache.get(exerciseId)!
  if (pending.has(exerciseId)) return pending.get(exerciseId)!

  const searchName = EXERCISE_DB_NAMES[exerciseId]
  if (!searchName) {
    gifCache.set(exerciseId, null)
    return null
  }

  const request = (async (): Promise<string | null> => {
    await loadNameMap()

    // Try name map first (fast, no API call if prefetch already ran)
    let gifUrl = nameToGif.get(searchName.toLowerCase()) ?? null

    // Fallback: direct name search
    if (!gifUrl) {
      gifUrl = await fetchByName(searchName)
    }

    gifCache.set(exerciseId, gifUrl)
    pending.delete(exerciseId)
    saveGifCache()
    return gifUrl
  })()

  pending.set(exerciseId, request)
  return request
}
