import { Capacitor } from '@capacitor/core';
import { CapacitorHealthkit, type ActivityData, type QueryOutput } from '@perfood/capacitor-healthkit';

export interface HealthWorkout {
  id: string;
  name: string;
  date: string;
  distanceKm: number;
  elevationM: number;
  source: string;
}

const READ_PERMISSIONS = ['activity', 'distance', 'duration', 'calories'];

export async function requestHealthReadAccess(): Promise<boolean> {
  if (!Capacitor.isNativePlatform()) {
    return true;
  }

  try {
    await CapacitorHealthkit.requestAuthorization({
      read: READ_PERMISSIONS,
      write: [],
      all: [''],
    });
    return true;
  } catch {
    return false;
  }
}

export async function readRecentCyclingWorkouts(days = 7): Promise<HealthWorkout[]> {
  if (Capacitor.isNativePlatform()) {
    try {
      const endDate = new Date();
      const startDate = new Date(Date.now() - days * 24 * 60 * 60 * 1000);
      const result: QueryOutput<ActivityData> = await CapacitorHealthkit.queryHKitSampleType<ActivityData>({
        sampleName: 'WORKOUT_TYPE',
        startDate: startDate.toISOString(),
        endDate: endDate.toISOString(),
        limit: 20,
      });

      const workouts = Array.isArray((result as { results?: ActivityData[] }).results) ? (result as { results?: ActivityData[] }).results ?? [] : [];

      return workouts
        .map((item: ActivityData, index: number) => ({
          id: String((item as ActivityData & { id?: string }).id ?? `health-${index}`),
          name: String((item as ActivityData & { activityName?: string }).activityName ?? 'Allenamento bici'),
          date: String((item as ActivityData & { startDate?: string }).startDate ?? new Date().toISOString()),
          distanceKm: Number((item as ActivityData & { distance?: number }).distance ?? 0) / 1000,
          elevationM: Number((item as ActivityData & { elevation?: number }).elevation ?? 0),
          source: 'Apple Health',
        }))
        .filter((item: HealthWorkout) => item.distanceKm > 0);
    } catch {
      // fall back to demo data below
    }
  }

  return [
    {
      id: 'demo-1',
      name: 'Lungo di prova',
      date: new Date().toISOString(),
      distanceKm: 34.2,
      elevationM: 410,
      source: 'Demo',
    },
    {
      id: 'demo-2',
      name: 'Sprint in salita',
      date: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
      distanceKm: 21.8,
      elevationM: 220,
      source: 'Demo',
    },
  ];
}
