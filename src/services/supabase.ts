import { createClient } from '@supabase/supabase-js'

const supabaseUrl = 'https://dfrcpfgbyoooqpptloiv.supabase.co'
const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY
const STORAGE_KEY = 'jarvis.workouts'

export const supabase = createClient(supabaseUrl, supabaseKey, {
  auth: {
    persistSession: false,
    autoRefreshToken: false,
  },
})

export type GroupMember = 'Ettore' | 'Papà' | 'Zio'

export type SharedWorkout = {
  id: string
  user: GroupMember
  name: string
  date: string
  distance_km: number
  elevation_m: number
  source: string
  created_at?: string
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
    const raw = window.localStorage.getItem(STORAGE_KEY)
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

export async function saveWorkout(workout: Omit<SharedWorkout, 'id' | 'created_at'>) {
  const localWorkout: SharedWorkout = {
    ...workout,
    id: createWorkoutId(),
  }

  try {
    const { error } = await supabase.from('workouts').insert([localWorkout])

    if (!error) {
      const existing = readLocalWorkouts()
      writeLocalWorkouts(mergeWorkouts([localWorkout], existing))
      return
    }
  } catch {
    // fallback to local storage when Supabase is unavailable
  }

  const existing = readLocalWorkouts()
  writeLocalWorkouts(mergeWorkouts([localWorkout], existing))
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
      const merged = mergeWorkouts(remoteWorkouts, localWorkouts)
      writeLocalWorkouts(merged)
      return merged
    }
  } catch {
    // fallback to local data when Supabase is unavailable
  }

  return localWorkouts
}
