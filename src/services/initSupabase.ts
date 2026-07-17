import { supabase } from './supabase'

export async function ensureWorkoutsTable() {
  const { error } = await supabase.rpc('pg_catalog.version')

  if (error) {
    throw error
  }
}

export async function seedDemoWorkouts() {
  const demoWorkouts = [
    {
      user: 'Ettore',
      name: 'Lungo sterrato',
      date: '2026-07-06',
      distance_km: 53,
      elevation_m: 620,
      source: 'Supabase Demo',
    },
    {
      user: 'Papà',
      name: 'Recupero',
      date: '2026-07-04',
      distance_km: 28,
      elevation_m: 180,
      source: 'Supabase Demo',
    },
    {
      user: 'Zio',
      name: 'Sprint',
      date: '2026-07-02',
      distance_km: 22,
      elevation_m: 240,
      source: 'Supabase Demo',
    },
  ]

  const { error } = await supabase.from('workouts').insert(demoWorkouts)

  if (error) {
    throw error
  }
}
