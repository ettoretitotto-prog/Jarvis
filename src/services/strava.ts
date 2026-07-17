export interface StravaActivity {
  id: string;
  name: string;
  date: string;
  distanceKm: number;
  elevationM: number;
  stravaUrl: string;
  type: string;
}

export interface StravaImportResult {
  athleteName: string;
  activities: StravaActivity[];
}

export function buildStravaAuthUrl(): string | null {
  const clientId = import.meta.env.VITE_STRAVA_CLIENT_ID;
  if (!clientId) {
    return null;
  }

  const redirectUri = import.meta.env.VITE_STRAVA_REDIRECT_URI || window.location.origin;
  const scope = 'activity:read';

  const params = new URLSearchParams({
    client_id: clientId,
    redirect_uri: redirectUri,
    response_type: 'code',
    approval_prompt: 'auto',
    scope,
  });

  return `https://www.strava.com/oauth/authorize?${params.toString()}`;
}

export async function exchangeStravaCode(code: string): Promise<StravaImportResult> {
  const clientId = import.meta.env.VITE_STRAVA_CLIENT_ID;
  const clientSecret = import.meta.env.VITE_STRAVA_CLIENT_SECRET;

  if (!clientId || !clientSecret) {
    return {
      athleteName: 'Demo Strava',
      activities: [
        {
          id: 'demo-1',
          name: 'Lungo di prova',
          date: '2026-07-06',
          distanceKm: 44.8,
          elevationM: 780,
          stravaUrl: 'https://www.strava.com/activities/123456789',
          type: 'Ride',
        },
      ],
    };
  }

  const tokenResponse = await fetch('https://www.strava.com/api/v3/oauth/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      client_id: clientId,
      client_secret: clientSecret,
      code,
      grant_type: 'authorization_code',
    }),
  });

  if (!tokenResponse.ok) {
    throw new Error('Impossibile scambiare il codice Strava');
  }

  const tokenData = (await tokenResponse.json()) as {
    access_token?: string;
    athlete?: { firstname?: string; lastname?: string };
  };

  if (!tokenData.access_token) {
    throw new Error('Token Strava non ricevuto');
  }

  const activitiesResponse = await fetch('https://www.strava.com/api/v3/athlete/activities?per_page=8', {
    headers: {
      Authorization: `Bearer ${tokenData.access_token}`,
    },
  });

  if (!activitiesResponse.ok) {
    throw new Error('Impossibile recuperare le attività Strava');
  }

  const activities = (await activitiesResponse.json()) as Array<{
    id: number;
    name: string;
    start_date: string;
    distance: number;
    total_elevation_gain: number;
    type: string;
  }>;

  return {
    athleteName: `${tokenData.athlete?.firstname ?? 'Strava'} ${tokenData.athlete?.lastname ?? ''}`.trim(),
    activities: activities.map((activity) => ({
      id: String(activity.id),
      name: activity.name,
      date: activity.start_date,
      distanceKm: Number((activity.distance / 1000).toFixed(1)),
      elevationM: activity.total_elevation_gain,
      stravaUrl: `https://www.strava.com/activities/${activity.id}`,
      type: activity.type,
    })),
  };
}
