import { createClient } from '@supabase/supabase-js'

const supabaseUrl = 'https://dfrcpfgbyoooqpptloiv.supabase.co'
const supabaseKey = 'sb_publishable_srOIHnEfjRUFXpflbQKPyA_1EIvZzw9'

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

export async function saveWorkout(workout: Omit<SharedWorkout, 'id' | 'created_at'>) {
  const { error } = await supabase.from('workouts').insert([workout])

  if (error) {
    throw error
  }
}

export async function loadWorkouts() {
  const { data, error } = await supabase
    .from('workouts')
    .select('*')
    .order('date', { ascending: false })

  if (error) {
    throw error
  }

  return (data ?? []) as SharedWorkout[]
}
