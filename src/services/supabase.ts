import { createClient } from '@supabase/supabase-js'

const supabaseUrl = 'https://dfrcpfgbyoooqpptloiv.supabase.co'
const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY
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

export function clearWorkoutCache() {
  if (typeof window !== 'undefined') {
    window.localStorage.removeItem('jarvis.workouts.v2')
    window.localStorage.removeItem('jarvis.workouts')
  }
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

    if (!data) {
      throw new Error('Salvataggio completato ma nessun record è stato restituito da Supabase')
    }

    return data as SharedWorkout
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Errore sconosciuto durante il salvataggio su Supabase'
    throw new Error(message)
  }
}

export async function loadWorkouts() {
  try {
    const { data, error } = await supabase
      .from('workouts')
      .select('*')
      .order('date', { ascending: false })

    if (!error && data) {
      clearWorkoutCache()
      return data as SharedWorkout[]
    }
  } catch {
    // no local fallback: UI must reflect Supabase only
  }

  return []
}
