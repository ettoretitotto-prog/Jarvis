export interface GeminiCoachResponse {
  text: string;
}

export interface CoachEntry {
  user: string;
  workouts: Array<{
    name: string;
    date: string;
    distanceKm: number;
    elevationM: number;
  }>;
}

const GEMINI_API_KEY = import.meta.env.VITE_GEMINI_API_KEY;

export async function generateCoachText(payload: string): Promise<GeminiCoachResponse> {
  if (!GEMINI_API_KEY) {
    return {
      text: 'Dati bassi: serve un lungo serio, senza scuse, per arrivare a ottobre in forma.',
    };
  }

  const systemPrompt = `Sei un coach di ciclismo per la gara Eroica. Ottobre è vicino. Analizza questi dati settimanali: ${payload}. Scrivi una sola frase d'impatto, diretta e senza preamboli. Se i km sono bassi, sii ironico ma pungente. Se manca il fondo, suggerisci un lungo. Se mancano intensità, suggerisci sprint.`;

  const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${GEMINI_API_KEY}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      contents: [{ parts: [{ text: systemPrompt }] }],
    }),
  });

  if (!response.ok) {
    throw new Error('Impossibile generare il testo del coach');
  }

  const data = await response.json();
  const text = data?.candidates?.[0]?.content?.parts?.[0]?.text ?? '';

  return { text: text.trim() || 'Serve più lavoro, e subito.' };
}

export async function generateCoachAdviceForUsers(entries: CoachEntry[]): Promise<Record<string, string>> {
  const result: Record<string, string> = {};

  if (!GEMINI_API_KEY) {
    return Object.fromEntries(entries.map((entry) => [entry.user, 'Nessun consiglio disponibile al momento.']));
  }

  for (const entry of entries) {
    const payload = entry.workouts.length > 0
      ? entry.workouts.map((item) => `${item.name} • ${new Date(item.date).toLocaleDateString('it-IT')} • ${item.distanceKm.toFixed(1)} km`).join(' | ')
      : 'Nessun allenamento ancora inserito';

    const systemPrompt = `Sei un coach di ciclismo per Eroica. Scrivi un consiglio breve, chiaro e motivato per ${entry.user}. Usa solo i dati che ti passo: ${payload}. Massimo 2 righe, in italiano, con tono diretto.`;

    const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${GEMINI_API_KEY}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{ parts: [{ text: systemPrompt }] }],
      }),
    });

    if (!response.ok) {
      result[entry.user] = 'Consiglio non disponibile in questo momento.';
      continue;
    }

    const data = await response.json();
    const text = data?.candidates?.[0]?.content?.parts?.[0]?.text ?? '';
    result[entry.user] = text.trim() || 'Serve più lavoro, e subito.';
  }

  return result;
}
