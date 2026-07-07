import { createClient } from '@supabase/supabase-js'

const supabaseUrl = 'https://dfrcpfgbyoooqpptloiv.supabase.co'
const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY
const STORAGE_KEY = 'jarvis.workouts.v2'
const LEGACY_STORAGE_KEY = 'jarvis.workouts'
const ATHLETE_PREFIX = 'Atleta: '

export const supabase = createClient(supabaseUrl, supabaseKey, {
  auth: {
    persistSession: false,
    autoRefreshToken: false,
  },
})

export type GroupMember = 'Ettore' | 'Papà' | 'Zio'

export type SharedWorkout = {
  id: string
  user: string
  name: string
  date: string
  distance_km: number
  elevation_m: number
  source: string
  created_at?: string
}

export type WorkoutInsert = Omit<SharedWorkout, 'id' | 'created_at' | 'user'> & {
  athlete: GroupMember
}

function createWorkoutId() {
  if (typeof crypto !== 'undefined' && 'randomUUID' in crypto) {
    return crypto.randomUUID()
  }

  return `local-${Date.now()}-${Math.random().toString(16).slice(2)}`
}

function readLocalWorkouts(): SharedWorkout[] {
  if (typeof window === 'undefined') {
    return []
  }

  try {
    const raw = window.localStorage.getItem(STORAGE_KEY) ?? window.localStorage.getItem(LEGACY_STORAGE_KEY)
    if (!raw) {
      return []
    }

    const parsed = JSON.parse(raw)
    return Array.isArray(parsed) ? (parsed as SharedWorkout[]) : []
  } catch {
    return []
  }
}

function writeLocalWorkouts(workouts: SharedWorkout[]) {
  if (typeof window === 'undefined') {
    return
  }

  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(workouts))
  window.localStorage.removeItem(LEGACY_STORAGE_KEY)
}

export function clearWorkoutCache() {
  if (typeof window === 'undefined') {
    return
  }

  window.localStorage.removeItem(STORAGE_KEY)
  window.localStorage.removeItem(LEGACY_STORAGE_KEY)
}

function mergeWorkouts(remote: SharedWorkout[], local: SharedWorkout[]) {
  const map = new Map<string, SharedWorkout>()

  const all = [...remote, ...local]
  all.forEach((item) => {
    if (!item?.id) {
      return
    }

    map.set(item.id, item)
  })

  return Array.from(map.values()).sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
}

function workoutSignature(workout: Pick<SharedWorkout, 'name' | 'date' | 'distance_km' | 'elevation_m' | 'source'>) {
  return [
    workout.name.trim().toLowerCase(),
    workout.date,
    workout.distance_km,
    workout.elevation_m,
    workout.source.trim().toLowerCase(),
  ].join('|')
}

function encodeAthleteSource(athlete: GroupMember, source: string) {
  return `${ATHLETE_PREFIX}${athlete} | ${source}`.trim()
}

export function decodeAthleteFromSource(source: string): GroupMember {
  const match = source.match(/Atleta:\s*(Ettore|Papà|Zio)/)
  return (match?.[1] as GroupMember | undefined) ?? 'Ettore'
}

export function stripAthleteFromSource(source: string) {
  return source.replace(/^Atleta:\s*(Ettore|Papà|Zio)\s*\|\s*/u, '')
}

export async function saveWorkout(workout: WorkoutInsert) {
  const localWorkout: SharedWorkout = {
    user: new Date().toISOString(),
    name: workout.name,
    date: workout.date,
    distance_km: workout.distance_km,
    elevation_m: workout.elevation_m,
    source: encodeAthleteSource(workout.athlete, workout.source),
    id: createWorkoutId(),
  }

  try {
    const { data, error } = await supabase
      .from('workouts')
      .insert([
        {
          user: localWorkout.user,
          name: localWorkout.name,
          date: localWorkout.date,
          distance_km: localWorkout.distance_km,
          elevation_m: localWorkout.elevation_m,
          source: localWorkout.source,
        },
      ])
      .select('*')
      .single()

    if (error) {
      throw error
    }

    const existing = readLocalWorkouts()
    const savedWorkout = data ? (data as SharedWorkout) : localWorkout
    const withoutDuplicate = existing.filter((item) => workoutSignature(item) !== workoutSignature(savedWorkout))
    writeLocalWorkouts(mergeWorkouts([savedWorkout], withoutDuplicate))
    return
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Errore sconosciuto durante il salvataggio su Supabase'
    throw new Error(message)
  }
}

export async function loadWorkouts() {
  const localWorkouts = readLocalWorkouts()

  try {
    const { data, error } = await supabase
      .from('workouts')
      .select('*')
      .order('date', { ascending: false })

    if (!error && data) {
      const remoteWorkouts = data as SharedWorkout[]
      const remoteSignatures = new Set(remoteWorkouts.map((item) => workoutSignature(item)))
      const filteredLocal = localWorkouts.filter((item) => !remoteSignatures.has(workoutSignature(item)))
      const merged = mergeWorkouts(remoteWorkouts, filteredLocal)
      writeLocalWorkouts(merged)
      return merged
    }
  } catch {
    // fallback to local data when Supabase is unavailable
  }

  return localWorkouts
}
